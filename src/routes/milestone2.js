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

Milestone2Router.post("/videos", isAuthenticated, async (req, res) => {
  const { count } = req.body;
  const email = req.session.email;

  let user = await getOnefromDb("users", {_id: req.session.email})

  if (!user) {
    return res.status(404).json({ error: "User data not found" });
  }

  const videos = await getAllfromDb("videos") // Assume each entry in `db` has a unique video ID
  const recommendedVideos = new Set();

    // Step 1: Prepare the list of all video IDs and the user's preference vector

    const userVector = videos.map(
      (video) =>
        // db[username].ups.has(videoId) ? 1 : // Liked
        // db[username].downs.has(videoId) ? -1 : // Disliked
        email in video.ups
          ? 1
          : email in video.downs
          ? -1
          : 0 // No interaction
    );

    console.log("User Vector")
    console.log(userVector)

    // Step 2: Calculate similarity with other users using the `compute-cosine-similarity` library
    const similarityScores = [];
    const users = await getAllfromDb("users") 
    users.forEach((user) => {
      const otherEmail = user._id
      if (otherEmail !== email) {
        const otherUserVector = videos.map((video) =>{
          console.log(video)
          return otherEmail in video.ups
          ? 1
          : otherEmail in video.downs
          ? -1
          : 0
        }
        );

        const similarity = cosineSimilarity(userVector, otherUserVector);
        similarityScores.push({ user: otherEmail, similarity: similarity });
      }
    });

    console.log(similarityScores)

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


  // END

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
