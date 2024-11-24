const fs = require("fs");
const path = require("path");
const { insertToDb } = require("./db");

let vidId = 0
fs.readFile(
  path.join(__dirname, "./media", "m2.json"),
  "utf8",
  async (err, data) => {
    if (err) {
      console.error("Error reading m2.json:", err);
      return;
    }

    try {
      const jsonData = JSON.parse(data);

      const videos = Object.entries(jsonData).map(([id, description]) => ({
        _id: id.replace(".mp4", ""),
        author: "default",
        title: id.replace(".mp4", ""),
        description: description || "random video description",
        likes: 0,
        ups: [],
        downs: [],
        usersViewed: [],
        status: "complete",
      }));
      
      for (const video of videos) {
        try {
          await insertToDb("videos", video);
        } catch (dbError) {
          console.error("Error inserting video:", dbError);
        }
      }
      console.log(
        `${videos.length} videos were loaded and inserted into the db`
      );
    } catch (parseError) {
      console.error("Error parsing m2.json:", parseError);
    }
  }
);