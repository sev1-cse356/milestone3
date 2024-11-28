package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var MongoClient *mongo.Client

type API_LIKE_REQBODY struct {
	Id    string `json:"id" binding:"required"`
	Value string `json:"value" binding:"required"`
}

func updateToDb(collection string, filter bson.D, expr bson.D) {
	toCol := MongoClient.Database("cse356").Collection(collection)
	update := bson.D{{Key: "$set", Value: bson.D{{Key: "status", Value: "complete"}}}}
	toCol.UpdateOne(context.TODO(), filter, update)
}

func main() {
	r := gin.Default()
	client, err := mongo.Connect(options.Client().ApplyURI(os.Getenv("MONGO_URL")))
	MongoClient = client

	if err != nil {
		log.Panicf("CONNECT TO MONGODB FAILED; %s", os.Getenv("MONGO_URL"))
	}

	r.GET("/api/like", func(c *gin.Context) {
		body := API_LIKE_REQBODY{}

		if errA := c.ShouldBind(&body); errA == nil {
			c.String(http.StatusOK, `the body should be LIKE BODY`)
		}

		// filter := bson.D{{Key: "_id", Value: body.Id}}

		// expr := bson.D{
		// 	{Key: "$push", Value: bson.M{"ups": req.Session.Email}},
		// 	{Key: "$pull", Value: bson.M{"downs": req.Session.Email}},
		// }

		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
