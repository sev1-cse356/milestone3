package main

import (
	"context"
	"fmt"
	"log"
	"os/exec"

	redis "github.com/redis/go-redis/v9"
)

func resize(path string) *exec.Cmd {
	cmd := exec.Command("./resize.sh", path)

	// Start the process in the background
	err := cmd.Start()
	if err != nil {
		log.Fatalf("Failed to resize: %v", err)
	}

	return cmd
}

func generate(path string) *exec.Cmd {
	cmd := exec.Command("./generate.sh", path)

	// Start the process in the background
	err := cmd.Start()
	if err != nil {
		log.Fatalf("Failed to generate: %v", err)
	}

	return cmd
}

func thumbnail(path string) *exec.Cmd {
	cmd := exec.Command("./thumbnails.sh", path)

	// Start the process in the background
	err := cmd.Start()
	if err != nil {
		log.Fatalf("Failed to thumbnail: %v", err)
	}

	return cmd
}

var ctx = context.Background()

func main() {
	// resize -> generate -> thumbnail
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "66d0f3556424d34b6b77c48f", // no password set
		DB:       0,                          // use default DB
	})

	pubsub := rdb.Subscribe(ctx, "upload")
	defer pubsub.Close()

	for {
		msg, err := pubsub.ReceiveMessage(ctx)

		if err != nil {
			panic(err)
		}

		path := msg.Payload

		resize(path)
		generate(path)
		thumbnail(path)

		// After all 3 operations are complete, send the path through the notify channel
		err = rdb.Publish(ctx, "notify", path).Err()
		if err != nil {
			panic(err)
		}
		fmt.Println(path, "DONE")
	}
}
