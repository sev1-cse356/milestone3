const { Router } = require("express");
const multer = require("multer");
const { db, isAuthenticated, getAndIncrementId } = require("../middlewares");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Milestone2Router = Router();
const { createClient } = require("redis");
const cosineSimilarity = require("compute-cosine-similarity");

const redisClient = createClient({ url: "redis://redis:6379" });
const subscriber = redisClient.duplicate();

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

(async () => {
  await subscriber.connect();
  await subscriber.subscribe("notify", (message) => {
    db.videos[message]["status"] = "complete";
  });
})();

//TODO: 2. ADD AUTHENTICATION LATER
Milestone2Router.post("/like", isAuthenticated, (req, res) => {
  const { id, value } = req.body;

  if (!(id in db.videos)) {
    db.videos[id] = {
      author: "",
      title: id,
      description: "some random description",
      likes: 0,
      ups: new Set(),
      downs: new Set(),
      usersViewed: new Set(),
    };
  }

  const entry = db.videos[id];

  // Check if the user is performing the same action twice

  if (
    (value && entry.ups.has(req.session.email)) ||
    (value !== null && !value && entry.downs.has(req.session.email))
    // || entry.nones.has(req.session.email)
  ) {
    return res.json({
      status: "ERROR",
      error: true,
      message: "User trying to like a video twice or something",
    });
  }

  // Process data after validation
  let incr = 0;

  if (value) {
    incr = 1;
    entry.ups.add(req.session.email);
    entry.downs.delete(req.session.email);
    db.users[req.session.email].liked.add(id);
    // entry.nones.delete(req.session.username);
  } else if (value !== null && !value) {
    incr = -1;
    entry.downs.add(req.session.email);
    entry.ups.delete(req.session.email);
    db.users[req.session.email].liked.delete(id);
    // entry.nones.delete(req.session.username);
  } else {
    entry.ups.delete(req.session.email);
    entry.downs.delete(req.session.email);
    db.users[req.session.email].liked.delete(id);
    // entry.nones.add(req.session.username);
  }

  entry.likes += incr;

  return res.json({ status: "OK", likes: entry.likes });
});

//TODO: 4. ONLY ACCEPTS FORMDATA
// TEST WITH
// curl -X POST -F "author=Jie" -F "title=TEST" -F "mp4File=@src/media/855457-uhd_3840_2160_30fps_padded.mp4" localhost/api/upload
Milestone2Router.post("/upload", upload.single("mp4File"), (req, res) => {
  const { author, title } = req.body;

  const newVidId = getAndIncrementId();
  console.log("before publish")
  redisClient.publish(
    "upload",
    JSON.stringify({
      id: newVidId,
      file: req.file.buffer.toString("base64"),
      filename: req.file.originalname,
    })
  );
  console.log("after publish")
  db.videos[newVidId] = {
    author,
    title,
    description: "random video description",
    likes: 0,
    ups: new Set(),
    downs: new Set(),
    nones: new Set(),
    status: "processing",
  };
  // console.log(req.file);
  return res.json({ status: "OK", id: newVidId });
});

Milestone2Router.post("/view", isAuthenticated, (req, res) => {
  const { id } = req.body;
  
  if (db.users[req.session.email].viewed.has(id)) {
    return res.json({ status: "OK", viewed: true });
  } else {
    db.users[req.session.email].viewed.add(id);
    return res.json({ status: "OK", viewed: false });
  }

  // if (id in db[req.session.email].viewed) {
  //   return res.json({ status: "OK", viewed: true });
  // }

  // db[req.session.email].viewed.add(id);
  // return res.json({ status: "OK", viewed: false });
});

//TODO: 7.
Milestone2Router.get("/processing-status", (req, res) => {
  let start = 500;
  console.log("/api/processing-status");

  const videos = [];
  while (start.toString() in db.videos) {
    const entry = db.videos[start];
    videos.push({ id: start, title: entry.title, status: entry.status });
    start++;
  }
  console.log(videos);
  return res.json({ status: "OK", videos: videos });
});

Milestone2Router.post("/videos", isAuthenticated, async (req, res) => {
  const { count } = req.body;
  const email = req.session.email;

  if (!db.users[email]) {
    return res.status(404).json({ error: "User data not found" });
  }

  const videoIds = Object.keys(db.videos); // Assume each entry in `db` has a unique video ID
  const recommendedVideos = new Set();

  if (Object.keys(db.users).length > 1) {
    // Step 1: Prepare the list of all video IDs and the user's preference vector

    const userVector = videoIds.map(
      (videoId) =>
        // db[username].ups.has(videoId) ? 1 : // Liked
        // db[username].downs.has(videoId) ? -1 : // Disliked
        db.videos[videoId].ups.has(email)
          ? 1
          : db.videos[videoId].downs.has(email)
          ? -1
          : 0 // No interaction
    );

    // Step 2: Calculate similarity with other users using the `compute-cosine-similarity` library
    const similarityScores = [];

    Object.keys(db.users).forEach((otherEmail) => {
      if (otherEmail !== email) {
        const otherUserVector = videoIds.map((videoId) =>
          // db[otherUser].ups.has(videoId) ? 1 :
          // db[otherUser].downs.has(videoId) ? -1 :
          db.videos[videoId].ups.has(otherEmail)
            ? 1
            : db.videos[videoId].downs.has(otherEmail)
            ? -1
            : 0
        );

        const similarity = cosineSimilarity(userVector, otherUserVector);
        similarityScores.push({ user: otherEmail, similarity: similarity });
      }
    });

    // Step 3: Sort users by similarity in descending order
    similarityScores.sort((a, b) => b.similarity - a.similarity);

    // Step 4: Get recommended videos based on similar users
    for (const { user: similarUser } of similarityScores) {
      const otherLikes = db.users[similarUser].liked;
      for (const videoId of otherLikes) {
        if (!db.users[email].viewed.has(videoId)) {
          // Only add if not already watched
          recommendedVideos.add(videoId);
          if (recommendedVideos.size >= count) break;
        }
      }
      if (recommendedVideos.size >= count) break;
    }
  }

  // Step 5: Fallback to random unwatched videos if needed
  const unwatchedVideos = videoIds.filter(
    (videoId) => !db.users[email].viewed.has(videoId)
  );
  while (recommendedVideos.size < count && unwatchedVideos.length > 0) {
    const randomVideo = unwatchedVideos.splice(
      Math.floor(Math.random() * unwatchedVideos.length),
      1
    )[0];
    recommendedVideos.add(randomVideo);
  }

  // Step 6: Fallback to random watched videos if still needed
  const watchedVideos = videoIds.filter((videoId) =>
    db.users[email].viewed.has(videoId)
  );
  while (recommendedVideos.size < count && watchedVideos.length > 0) {
    const randomVideo = watchedVideos.splice(
      Math.floor(Math.random() * watchedVideos.length),
      1
    )[0];
    recommendedVideos.add(randomVideo);
  }

  // Step 7: Format the response
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

module.exports = Milestone2Router;
