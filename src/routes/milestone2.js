const { Router } = require("express");
const multer = require("multer");
const cosineSimilarity = require("compute-cosine-similarity");
const { getAllfromDb, insertToDb, updateToDb, getOnefromDb } = require("../db");
const { createClient } = require("redis");
const {
  isAuthenticated,
  getAndIncrementId,
  getId,
} = require("../middlewares");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/app/src/media");
  },
  filename: function (req, file, cb) {
    cb(null, `${getId()}.mp4`);
  },
});

const redisClient = createClient({ url: `redis://${process.env.REDIS_URL || "redis:6379"}` });
const upload = multer({ storage: storage });
const Milestone2Router = Router();

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
(async () => {
  await redisClient.connect();
})();


Milestone2Router.post("/like", isAuthenticated, async (req, res) => {
  const { id, value } = req.body;

  console.log("/like");
  // console.table(req.body);
  const _id = parseInt(id)
  let entry = await getOnefromDb("videos", {_id});
  entry.ups = new Set(entry.ups)
  entry.downs = new Set(entry.downs)
  // console.table(entry)
  // console.log(entry.ups)
  // console.log(req.session.email)
  // console.log((value === true && entry.ups.has(req.session.email)))
  // console.log((value !== null && !value && entry.downs.has(req.session.email)))
  // Check if the user is performing the same action twice
  // console.log(entry)
  
  if (
    (value === true &&  entry.ups.has(req.session.email)) ||
    (value !== null && !value && entry.downs.has(req.session.email))
    // || entry.nones.has(req.session.email)
  ) {
    console.log("RETURNING ERROR, USER IS LIKING A VIDEO TWICE");
    return res.json({
      status: "ERROR",
      error: true,
      message: "User trying to like a video twice or something",
    });
  }

  // Process data after validation
  let incr = 0;

  if (value) {
    console.log("LIKE");
    incr = 1;
    updateToDb("videos", {_id}, {$push: {ups: req.session.email}}) // entry.ups.add(req.session.email);
    updateToDb("videos", {_id}, {$pull: {downs: req.session.email}}) // entry.downs.delete(req.session.email);
    updateToDb("users", {_id: req.session.email}, {$push: {liked: id}}) // db.users[req.session.email].liked.add(id);
    // entry.nones.delete(req.session.username);
  } else if (value !== null && !value) {
    console.log("DISLIKE");
    incr = -1;
    updateToDb("videos", {_id}, {$push: {downs: req.session.email}}) 
    updateToDb("videos", {_id}, {$pull: {ups: req.session.email}})
    updateToDb("users", {_id: req.session.email}, {$pull: {liked: id}}) // db.users[req.session.email].liked.delete(id);
    // entry.nones.delete(req.session.username);
  } else {
    console.log("UNSET");

    if (entry.ups.has(req.session.email)) {
      updateToDb("videos", {_id}, {$pull: {ups: req.session.email}})
      incr = -1;
    }

    if (entry.downs.has(req.session.email)) {
      updateToDb("videos", {_id}, {$pull: {downs: req.session.email}})
      incr = 1;
    }

    updateToDb("users", {_id: req.session.email}, {$pull: {liked: id}}) // db.users[req.session.email].liked.delete(id);
  }

  updateToDb("videos", {_id}, {$inc: {likes: incr}})
  // console.log("OKAY");
  return res.json({ status: "OK", likes: entry.likes + incr});
});

// TEST WITH
// curl -X POST -F "author=Jie" -F "title=TEST" -F "mp4File=@src/media/855457-uhd_3840_2160_30fps_padded.mp4" localhost/api/upload
Milestone2Router.post("/upload", upload.single("mp4File"), (req, res) => {
  const { author, title, description } = req.body;

  const newVidId = getAndIncrementId();
  // console.log("before publish")

  insertToDb("videos",  {
    _id: newVidId,
    author,
    title,
    description: description,
    likes: 0,
    ups: [],
    downs: [],
    status: "processing",
  })
  res.json({ status: "OK", id: newVidId });

  // console.log("PUBLISH TO", "upload" + newVidId % 2)
  redisClient.publish(
    "upload",
    JSON.stringify({
      id: newVidId,
      file: req.file.filename,
    })
  );
  // console.log(req.file);
  // return res.json({ status: "OK", id: newVidId });
});

Milestone2Router.post("/view", isAuthenticated, async (req, res) => {
  const { id } = req.body;
  const _id = parseInt(id)

  let user = await getOnefromDb("users", {_id: req.session.email})

  user.viewed = new Set(user.viewed)
  user.liked = new Set(user.liked)

  console.log(user)
  if (user.viewed.has(_id)) {
    return res.json({ status: "OK", viewed: true });
  } else {
    updateToDb("users", {_id: req.session.email}, {$push: {viewed: _id}}) 
    return res.json({ status: "OK", viewed: false });
  }

  // if (id in db[req.session.email].viewed) {
  //   return res.json({ status: "OK", viewed: true });
  // }

  // db[req.session.email].viewed.add(id);
  // return res.json({ status: "OK", viewed: false });
});

Milestone2Router.get("/processing-status", async (req, res) => {
  console.log("/api/processing-status");
  // console.log(db.videos)
  const videos = await getAllfromDb("videos", {author: req.session.username})
  const ret = videos.map(e=> { return {id: e._id, title: e.title, status: e.status} })
  return res.json({ status: "OK", videos: ret});
});

// Add this route towards the end, before exporting the router
Milestone2Router.post("/videos", isAuthenticated, async (req, res) => {
  const { count, videoId } = req.body; // Include videoId in the request
  const email = req.session.email;

  let user = await getOnefromDb("users", {_id: req.session.email})

  if (!user) {
    return res.status(404).json({ error: "User data not found" });
  }

  const videoIds = Object.keys(db.videos); // Get all video IDs
  const userIds = Object.keys(db.users); // Get all user IDs

  // Step 1: Construct the User-Video Matrix
  const videoVectors = videoIds.map((vid) =>
    userIds.map((user) =>
      db.videos[vid].ups.has(user)
        ? 1
        : db.videos[vid].downs.has(user)
        ? -1
        : 0
    )
  );

  let recommendedVideos = new Set();

  if (videoId && videoId in db.videos) {
    // Step 2: Find similarity with other videos
    const targetVectorIndex = videoIds.indexOf(videoId);
    if (targetVectorIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }
    const targetVector = videoVectors[targetVectorIndex];

    const similarityScores = videoIds.map((vid, index) => {
      if (vid === videoId) return -Infinity; // Skip self-comparison
      return {
        id: vid,
        similarity: cosineSimilarity(targetVector, videoVectors[index]),
      };
    });

    // Step 3: Sort videos by similarity
    similarityScores.sort((a, b) => b.similarity - a.similarity);

    // Step 4: Get top `count` similar videos
    for (const { id } of similarityScores) {
      recommendedVideos.add(id);
      if (recommendedVideos.size >= count) break;
    }
  } else {
    // Fallback to user recommendations logic
    const userVector = videoIds.map(
      (vid) =>
        db.videos[vid].ups.has(email)
          ? 1
          : db.videos[vid].downs.has(email)
          ? -1
          : 0
    );

    const similarityScores = [];
    for (const user of userIds) {
      if (user === email) continue;
      const otherVector = videoIds.map((vid) =>
        db.videos[vid].ups.has(user)
          ? 1
          : db.videos[vid].downs.has(user)
          ? -1
          : 0
      );
      similarityScores.push({
        user,
        similarity: cosineSimilarity(userVector, otherVector),
      });
    }

    similarityScores.sort((a, b) => b.similarity - a.similarity);
    for (const { user: similarUser } of similarityScores) {
      const otherLikes = db.users[similarUser].liked;
      for (const vid of otherLikes) {
        if (!db.users[email].viewed.has(vid)) {
          recommendedVideos.add(vid);
          if (recommendedVideos.size >= count) break;
        }
      }
      if (recommendedVideos.size >= count) break;
    }

    const unwatchedVideos = videoIds.filter(
      (vid) => !db.users[email].viewed.has(vid)
    );
    while (recommendedVideos.size < count && unwatchedVideos.length > 0) {
      const randomVideo = unwatchedVideos.splice(
        Math.floor(Math.random() * unwatchedVideos.length),
        1
      )[0];
      recommendedVideos.add(randomVideo);
    }
  }

  // Step 5: Format response
  const videoList = Array.from(recommendedVideos).map((id) => {
    const video = db.videos[id];
    return {
      id,
      description: video.description || "",
      title: video.title || "",
      watched: db.users[email].viewed.has(id),
      liked: video.ups.has(email)
        ? true
        : video.downs.has(email)
        ? false
        : null,
      likevalues: video.likes,
    };
  });

  return res.json({ status: "OK", videos: videoList.slice(0, count) });
});


module.exports = Milestone2Router;
