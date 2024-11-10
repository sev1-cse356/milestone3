const { Router } = require("express");
const fs = require("fs");
const path = require("path");
const VideoRouter = Router();

let videos = [];

fs.readFile(
  path.join(__dirname, "../media", "m2.json"),
  "utf8",
  (err, data) => {
    if (err) {
      console.error("Error reading m.json:", err);
      return;
    }
    try {
      const jsonData = JSON.parse(data);

      // Transform the JSON data into the desired format
      videos = Object.entries(jsonData).map(([id, description]) => ({
        id: id.replace(".mp4", ""),
        title: id.replace(".mp4", ""),
        description,
        thumbnail: `../media/${id.replace(".mp4", "")}_padded.jpg`,
      }));

      console.log(`${videos.length} videos were loaded`);
    } catch (parseError) {
      console.error("Error parsing m.json:", parseError);
    }
  }
);

//TODO:3.
VideoRouter.post("/", (req, res) => {
  const { count } = req.body;
  const slicedVideos = videos.slice(0, count);

  res.json({
    status: "OK",
    videos: slicedVideos,
  });
});

VideoRouter.get("/:page", (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const pageSize = 10; // Number of videos per page

  const start = (page - 1) * pageSize;
  const paginatedVideos = videos.slice(start, start + pageSize);

  if (paginatedVideos.length === 0) {
    return res.json({
      status: "ERROR",
      error: true,
      message: "No more videos to load",
    });
  }

  res.json({
    status: "OK",
    videos: paginatedVideos,
  });
});

VideoRouter.get("/next/:id", (req, res) => {
  const currentVideoId = req.params.id;
  const currentIndex = videos.findIndex((video) => video.id === currentVideoId);

  // Calculate the next index
  const nextIndex = (currentIndex + 1) % videos.length;
  const nextVideoId = videos[nextIndex].id;

  res.json({
    status: "OK",
    videoId: nextVideoId,
  });
});

VideoRouter.get("/prev/:id", (req, res) => {
  const currentVideoId = req.params.id;
  const currentIndex = videos.findIndex((video) => video.id === currentVideoId);

  // Calculate the previous index
  const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
  const prevVideoId = videos[prevIndex].id;

  res.json({
    status: "OK",
    videoId: prevVideoId,
  });
});

module.exports = VideoRouter;
