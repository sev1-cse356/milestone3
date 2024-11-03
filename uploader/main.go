package main

import (
	"context"
	"fmt"
	"log"
	"os/exec"

	redis "github.com/redis/go-redis/v9"
)

func resize() *exec.Cmd {
	cmd := exec.Command("./scripts/resize.sh", "-a")

	// Start the process in the background
	err := cmd.Start()
	if err != nil {
		log.Fatalf("Failed to resize: %v", err)
	}

	return cmd
}

func generate() *exec.Cmd {
	cmd := exec.Command("./scripts/generate.sh", "-a")

	// Start the process in the background
	err := cmd.Start()
	if err != nil {
		log.Fatalf("Failed to generate: %v", err)
	}

	return cmd
}

func thumbnail() *exec.Cmd {
	cmd := exec.Command("./scripts/thumbnail.sh", "-a")

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
		Addr:     "redis:6379",
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

		fmt.Println(msg.Channel, msg.Payload)
	}
}
