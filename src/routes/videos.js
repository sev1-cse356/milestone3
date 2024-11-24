const { Router } = require("express");
const VideoRouter = Router();
const { getAllfromDb, insertToDb, updateToDb, getOnefromDb } = require("../db");

VideoRouter.get("/homepage/:count", async (req, res) => {
  const count = req.params.count;
  const videos = await getAllfromDb('videos');

  console.log("DB VIDS", videos.length)

  for (let i = count * 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [videos[i], videos[j]] = [videos[j], videos[i]];
  }

  const randomVideos = videos.slice(0, count);

  return res.json({ status: "OK", randomVideos: randomVideos });
});

VideoRouter.get("/next", (req, res) => {
  req.session.historyIndex += 1;
  if (req.session.historyIndex === req.session.watchHistory.length - 2) {
    return res.json({
      status: "OK",
      preloadVids: true,
    });
  } else {
    return res.json({
      status: "OK",
      preloadVids: false,
    });
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

module.exports = VideoRouter;
