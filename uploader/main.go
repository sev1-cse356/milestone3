package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"time"

	redis "github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type UploadRequest struct {
	Id   int    `json:"id"`
	File string `json:"file"`
}

var ctx = context.Background()
var sem = make(chan int, runtime.NumCPU()/4)

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

	paddedFileName := fmt.Sprintf("./tmp/%d_padded.mp4", data.Id)
	inputFile := fmt.Sprintf("./tmp/%s", data.File)
	manifestFile := fmt.Sprintf("./tmp/%d_padded_output.mpd", data.Id)

	fmt.Printf("Processing: %v\n", inputFile)

	cmd := exec.Command(
		"ffmpeg",
		"-y",        // Overwrite output files
		"-f", "mp4", // Input format; change as needed based on your data
		"-i", inputFile,
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
		manifestFile, // Output DASH manifest file
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

	// After all 3 operations are complete, update MongoDB record
	client, _ := mongo.Connect(options.Client().ApplyURI("mongodb://root:example@db:27017/cse356"))
	collection := client.Database("cse356").Collection("videos")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.D{{"_id", data.Id}}
	update := bson.D{{"$set", bson.D{{"status", "complete"}}}}
	res, _ := collection.UpdateOne(ctx, filter, update)

	fmt.Println(res)
	duration := time.Since(startTime)
	fmt.Println(data.Id, "DONE", duration)
	<-sem
}
