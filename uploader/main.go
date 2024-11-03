package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"

	redis "github.com/redis/go-redis/v9"
)

type UploadRequest struct {
	Id   int    `json:"id"`
	File string `json:"file"`
}

var ctx = context.Background()

func main() {
	// resize -> generate -> thumbnail

	fmt.Println("Uploader is Starting...")
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

		var data UploadRequest

		json.Unmarshal([]byte(msg.Payload), &data)

		binaryData, err := base64.StdEncoding.DecodeString(data.File)
		if err != nil {
			log.Fatalf("Failed to decode Base64: %v", err)
		}

		// After all 3 operations are complete, send the path through the notify channel
		// err = rdb.Publish(ctx, "notify", path).Err()
		// if err != nil {
		// 	panic(err)
		// }
		fmt.Println(binaryData, "DONE")
	}
}
