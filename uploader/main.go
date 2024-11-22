package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"time"

	redis "github.com/redis/go-redis/v9"
)

type UploadRequest struct {
	Id       int    `json:"id"`
	File     []byte `json:"file"`
	Filename string `json:"filename"`
}

var ctx = context.Background()
var sem = make(chan int, 2)

func main() {
	// resize -> generate -> thumbnail

	fmt.Printf("Subscribing to: %s\n", os.Getenv("UPLOAD_QUEUE"))
	rdb := redis.NewClient(&redis.Options{
		Addr:        os.Getenv("REDIS_URL"),
		Password:    "66d0f3556424d34b6b77c48f", // no password set
		DB:          0,                          // use default DB
		ReadTimeout: -1,
	})

	pubsub := rdb.Subscribe(ctx, os.Getenv("UPLOAD_QUEUE"))
	defer pubsub.Close()

	for {
		msg, err := pubsub.ReceiveMessage(ctx)

		if err != nil {
			panic(err)
		}

		var data UploadRequest

		json.Unmarshal([]byte(msg.Payload), &data)

		go process(rdb, data)
		sem <- 1
	}
}

func process(rdb *redis.Client, data UploadRequest) {
	fmt.Println(data.Id, "STARTING")
	startTime := time.Now()
	file, err := os.Create(fmt.Sprintf("input-%d.mp4", data.Id))

	if err != nil {
		fmt.Printf("Error creating file: %v\n", err)
		return
	}
	defer file.Close() // Ensure the file is closed when done

	if _, err := file.Write([]byte(data.File)); err != nil {
		fmt.Printf("Error writing to file: %v\n", err)
		return
	}

	paddedFileName := fmt.Sprintf("./tmp/%d_padded.mp4", data.Id)

	fmt.Printf("Processing: %v\n", paddedFileName)

	cmd := exec.Command(
		"ffmpeg",
		"-y",        // Overwrite output files
		"-f", "mp4", // Input format; change as needed based on your data
		"-i", fmt.Sprintf("input-%d.mp4", data.Id),
		"-vf", `scale=w=iw*min(1280/iw\,720/ih):h=ih*min(1280/iw\,720/ih),pad=1280:720:(1280-iw*min(1280/iw\,720/ih))/2:(720-ih*min(1280/iw\,720/ih))/2`, // Video filter
		"-c:a", "copy", // Copy audio codec
		paddedFileName, // Output file
	)

	// cmd.Stderr = os.Stdout

	if err := cmd.Start(); err != nil {
		fmt.Println("Error starting the resize process:", err)
		return
	}

	if err := cmd.Wait(); err != nil {
		fmt.Println(data.Id, "Error waiting for resize to finish:", err)
		return
	}

	tncmd := exec.Command("ffmpeg",
		"-y",                 // Overwrite output files without asking
		"-i", paddedFileName, // Input video file
		"-vf", "scale=320:180", // Video filter to scale the output
		"-frames:v", "1", // Capture only 1 frame
		"-q:v", "2", // Set quality level (lower means better quality)
		fmt.Sprintf("./tmp/%d_padded.jpg", data.Id), // Output file path
	)

	if err := tncmd.Start(); err != nil {
		fmt.Println("Error starting the thumbnail process:", err)
		return
	}

	if err := tncmd.Wait(); err != nil {
		fmt.Println(data.Id, "Error waiting for thumbnail to finish:", err)
		return
	}

	// noextFileName := strings.Split(data.Filename, ".mp4")[0]

	splitCmd := exec.Command("ffmpeg",
		"-y",                 // Overwrite output files without asking
		"-i", paddedFileName, // Input video file
		"-map", "0:v", // Map video streams from input
		"-b:v:0", "512k", // Set bitrate for first output stream
		"-s:v:0", "640x360", // Set size for first output stream
		"-map", "0:v", // Map video streams from input
		"-b:v:1", "768k", // Set bitrate for second output stream
		"-s:v:1", "960x540", // Set size for second output stream
		"-map", "0:v", // Map video streams from input
		"-b:v:2", "1024k", // Set bitrate for third output stream
		"-s:v:2", "1280x720", // Set size for third output stream
		"-f", "dash", // Set format to DASH
		"-seg_duration", "10", // Set segment duration
		"-use_template", "1", // Use template for segment names
		"-use_timeline", "1", // Use timeline for segments
		"-init_seg_name", fmt.Sprintf(`%d_padded_chunk_$RepresentationID$_init.m4s`, data.Id), // Initial segment name
		"-media_seg_name", fmt.Sprintf(`%d_padded_chunk_$RepresentationID$_$Bandwidth$_$Number$.m4s`, data.Id), // Media segment name
		"-adaptation_sets", "id=0,streams=v", // Adaptation sets
		fmt.Sprintf("./tmp/%d_padded_output.mpd", data.Id), // Output DASH manifest file
	)

	// splitCmd.Stderr = os.Stdout

	if err := splitCmd.Start(); err != nil {
		fmt.Println("Error starting the split process:", err)
		return
	}

	if err := splitCmd.Wait(); err != nil {
		fmt.Println(data.Id, "Error waiting for split to finish:", err)
		return
	}

	// After all 3 operations are complete, send the path through the notify channel
	err = rdb.Publish(ctx, "notify", data.Id).Err()
	if err != nil {
		panic(err)
	}
	duration := time.Now().Sub(startTime)
	fmt.Println(data.Id, "DONE", duration)
	<-sem
}
