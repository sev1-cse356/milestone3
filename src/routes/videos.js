const { Router } = require("express");
const fs = require("fs");
const path = require("path");
const VideoRouter = Router();
const { db } = require("../middlewares");

fs.readFile(path.join(__dirname, "../media", "m2.json"), "utf8", (err, data) => {
  if (err) {
    console.error("Error reading m2.json:", err);
    return;
  }

  try {
    const jsonData = JSON.parse(data);

    const videos = Object.entries(jsonData).map(([id, description]) => ({
      author: "default",
      title: id.replace(".mp4", ""),
      description: description || "random video description",
      thumbnail: `http://sev-1.cse356.compas.cs.stonybrook.edu/media/${id.replace(".mp4", "")}_padded.jpg`,
      likes: 0,
      ups: new Set(),
      downs: new Set(),
      usersViewed: new Set(),
      status: "complete",
    }));

    videos.forEach((video, index) => {
      const videoId = Object.keys(jsonData)[index].replace(".mp4", "");
      db.videos[videoId] = video;
    });

    console.log(`${videos.length} videos were loaded and inserted into the db`);
  } catch (parseError) {
    console.error("Error parsing m2.json:", parseError);
  }
});

//TODO:3.
VideoRouter.post("/", (req, res) => {
  const { count } = req.body;
  const slicedVideos = videos.slice(0, count);

  res.json({
    status: "OK",
    videos: slicedVideos,
  });
});

VideoRouter.get("/next", (req, res) => {
  req.session.historyIndex += 1;
  if (req.session.historyIndex === (req.session.watchHistory.length - 2)) {
    return res.json({
      status: "OK",
      preloadVids: true
    })
  } else {
    return res.json({
      status: "OK",
      preloadVids: false
    })
  }
});

VideoRouter.get("/prev", (req, res) => {
  if (req.session.historyIndex > 0) {
    req.session.historyIndex -= 1;
    res.json({
      status: "OK",
    });
  }
});

VideoRouter.get("/homepage/:count", (req, res) => {
  const count = req.params.count;
  const videoIds = Object.keys(db.videos);

  for (let i = videoIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [videoIds[i], videoIds[j]] = [videoIds[j], videoIds[i]];
  }

  const randomVideos = videoIds.slice(0, count).map((vidId) => {
    return { id: vidId, video: db.videos[vidId] };
  });

  return res.json({ status: "OK", randomVideos: randomVideos });
});

// VideoRouter.get("/:page", (req, res) => {
//   const page = parseInt(req.params.page) || 1;
//   const pageSize = 10; // Number of videos per page

//   const start = (page - 1) * pageSize;
//   const paginatedVideos = videos.slice(start, start + pageSize);

//   if (paginatedVideos.length === 0) {
//     return res.json({
//       status: "ERROR",
//       error: true,
//       message: "No more videos to load",
//     });
//   }

//   res.json({
//     status: "OK",
//     videos: paginatedVideos,
//   });
// });

// VideoRouter.get("/next/:id", (req, res) => {
//   const currentVideoId = req.params.id;
//   const currentIndex = videos.findIndex((video) => video.id === currentVideoId);

//   // Calculate the next index
//   const nextIndex = (currentIndex + 1) % videos.length;
//   const nextVideoId = videos[nextIndex].id;

//   res.json({
//     status: "OK",
//     videoId: nextVideoId,
//   });
// });

// VideoRouter.get("/prev/:id", (req, res) => {
//   const currentVideoId = req.params.id;
//   const currentIndex = videos.findIndex((video) => video.id === currentVideoId);

//   // Calculate the previous index
//   const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
//   const prevVideoId = videos[prevIndex].id;

//   res.json({
//     status: "OK",
//     videoId: prevVideoId,
//   });
// });

module.exports = VideoRouter;
