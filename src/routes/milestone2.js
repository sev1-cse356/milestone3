const { Router } = require("express");
const multer = require("multer");
const cosineSimilarity = require("compute-cosine-similarity");
const { getAllfromDb, insertToDb, updateToDb, getOnefromDb } = require("../db");
const { createClient } = require("redis");
const { isAuthenticated, getAndIncrementId, getId } = require("../middlewares");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/app/src/media");
  },
  filename: function (req, file, cb) {
    cb(null, `${getId()}.mp4`);
  },
});

const redisClient = createClient({
  url: `redis://${process.env.REDIS_URL || "redis:6379"}`,
});
const upload = multer({ storage: storage });
const Milestone2Router = Router();

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

Milestone2Router.post("/like", isAuthenticated, async (req, res) => {
  const { id, value } = req.body;

  // console.table(req.body);
  const _id = id;
  console.log("LIKING", _id)
  let entry = await getOnefromDb("videos", { _id });

  if (entry === undefined){
    return res.json({
      status: "ERROR",
      error: true,
      message: "Video Does not exist",
    })
  }
  entry.ups = new Set(entry.ups);
  entry.downs = new Set(entry.downs);
  // console.table(entry)
  // console.log(entry.ups)
  // console.log(req.session.email)
  // console.log((value === true && entry.ups.has(req.session.email)))
  // console.log((value !== null && !value && entry.downs.has(req.session.email)))
  // Check if the user is performing the same action twice
  // console.log(entry)

  if (
    (value === true && entry.ups.has(req.session.email)) ||
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
    incr = 1;
    updateToDb("videos", { _id }, { $push: { ups: req.session.email } }); // entry.ups.add(req.session.email);
    updateToDb("videos", { _id }, { $pull: { downs: req.session.email } }); // entry.downs.delete(req.session.email);
    updateToDb("users", { _id: req.session.email }, { $push: { liked: id } }); // db.users[req.session.email].liked.add(id);
    // entry.nones.delete(req.session.username);
  } else if (value !== null && !value) {
    incr = -1;
    updateToDb("videos", { _id }, { $push: { downs: req.session.email } });
    updateToDb("videos", { _id }, { $pull: { ups: req.session.email } });
    updateToDb("users", { _id: req.session.email }, { $pull: { liked: id } }); // db.users[req.session.email].liked.delete(id);
    // entry.nones.delete(req.session.username);
  } else {
    if (entry.ups.has(req.session.email)) {
      updateToDb("videos", { _id }, { $pull: { ups: req.session.email } });
      incr = -1;
    }

    if (entry.downs.has(req.session.email)) {
      updateToDb("videos", { _id }, { $pull: { downs: req.session.email } });
      incr = 1;
    }

    updateToDb("users", { _id: req.session.email }, { $pull: { liked: id } }); // db.users[req.session.email].liked.delete(id);
  }

  updateToDb("videos", { _id }, { $inc: { likes: incr } });
  // console.log("OKAY");
  return res.json({ status: "OK", likes: entry.likes + incr });
});

// TEST WITH
// curl -X POST -F "author=Jie" -F "title=TEST" -F "mp4File=@src/media/855457-uhd_3840_2160_30fps_padded.mp4" localhost/api/upload
Milestone2Router.post("/upload", upload.single("mp4File"), (req, res) => {
  const { author, title, description } = req.body;

  const newVidId = getAndIncrementId();
  // console.log("before publish")

  insertToDb("videos", {
    _id: newVidId.toString(),
    author,
    title,
    description: description,
    likes: 0,
    ups: [],
    downs: [],
    status: "processing",
  });
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
  const _id = id;

  let user = await getOnefromDb("users", { _id: req.session.email });

  user.viewed = new Set(user.viewed);
  user.liked = new Set(user.liked);

  if (user.viewed.has(_id)) {
    return res.json({ status: "OK", viewed: true });
  } else {
    updateToDb("users", { _id: req.session.email }, { $push: { viewed: _id } });
    return res.json({ status: "OK", viewed: false });
  }

  // if (id in db[req.session.email].viewed) {
  //   return res.json({ status: "OK", viewed: true });
  // }

  // db[req.session.email].viewed.add(id);
  // return res.json({ status: "OK", viewed: false });
});

Milestone2Router.get("/processing-status", isAuthenticated, async (req, res) => {
  console.log("/api/processing-status");
  // console.log(db.videos)
  const videos = await getAllfromDb("videos", { author: req.session.username });
  console.log("Processing STATUS", videos)
  const ret = videos.map((e) => {
    return { id: e._id, title: e.title, status: e.status };
  });
  return res.json({ status: "OK", videos: ret });
});

// Add this route towards the end, before exporting the router
Milestone2Router.post("/videos", isAuthenticated, async (req, res) => {
  const { count, videoId } = req.body; // Include videoId in the request
  const email = req.session.email;

  let user = await getOnefromDb("users", { _id: req.session.email });
  let videos = await getAllfromDb("videos");
  let users = await getAllfromDb("users");

  if (!user) {
    return res.status(404).json({ error: "User data not found" });
  }
  user.liked = user.liked || [];
  user.viewed = user.viewed || [];

  // Step 1: Construct the User-Video Matrix
  const videoVectors = videos.map((vid) =>
    users.map((usr) =>
      vid.ups.includes(usr._id) ? 1 : vid.downs.includes(usr._id) ? -1 : 0
    )
  );

  let recommendedVideos = [];

  const videoExists = videos.some((vid) => vid._id === videoId);

  if (videoId && videoExists) {
    // console.log('path 1')
    // Video-based recommendations logic...
    let targetVectorIndex = -1;

    for (let i = 0; i < videos.length; i++) {
      if (videos[i]._id == videoId) targetVectorIndex = i;
    }

    if (targetVectorIndex === -1) {
      return res.status(404).json({ error: "Video not found" });
    }
    const targetVector = videoVectors[targetVectorIndex];

    const similarityScores = videos.map((vid, index) => {
      if (vid._id === videoId) return { id: vid, similiarity: -Infinity}; // Skip self-comparison
      let similarityScore = cosineSimilarity(targetVector, videoVectors[index])
      let similarity = isNaN(similarityScore) ? 0 : similarityScore;
      return {
        id: vid,
        similarity: similarity,
      };
    });

    // Step 3: Sort videos by similarity
    similarityScores.sort((a, b) => b.similarity - a.similarity);
    
    // Step 4: Get top `count` similar videos

    for (const { id } of similarityScores) {
      if (!user.viewed.includes(id._id)) {
        recommendedVideos.push(id);
      }
      if (recommendedVideos.size >= count) break;
    }

    // console.log("similarity score in videoExists is ", similarityScores)

  } else {
    // console.log('path 2')
    // Fallback to user recommendations logic
    const userVector = videos.map((vid) =>
      vid.ups.includes(email) ? 1 : vid.downs.includes(email) ? -1 : 0
    );

    const similarityScores = [];
    for (const similarUser of users) {
      if (similarUser._id === email) continue;
      const otherVector = videos.map((vid) =>
        vid.ups.includes(similarUser._id)
          ? 1
          : vid.downs.includes(similarUser._id)
          ? -1
          : 0
      );
      let similarity = cosineSimilarity(userVector, otherVector);
      similarity = isNaN(similarity) ? 0 : similarity; // Handle NaN
      similarityScores.push({
        user: similarUser,
        similarity,
      });
    }

    similarityScores.sort((a, b) => b.similarity - a.similarity);
    
    // console.log("similarity scores in fallback is ", similarityScores)

    for (const { user: similarUser } of similarityScores) {
      similarUser.liked = similarUser.liked || [];
      const otherLikes = similarUser.liked;
      for (const vidId of otherLikes) {
        if (!user.viewed.includes(vidId)) {
          const vid = videos.find((v) => v._id === vidId);
          if (vid) {
            recommendedVideos.push(vid);
            if (recommendedVideos.length >= count) break;
          }
        }
      }
      if (recommendedVideos.length >= count) break;
    }
  }

  // Ensure we have exactly 'count' videos
  if (recommendedVideos.length < count) {
    // get random unwatched vids
    const unwatchedVideos = videos.filter(
      (vid) => !user.viewed.includes(vid._id)
    );
    
    while (recommendedVideos.length < count && unwatchedVideos.length > 0) {
      const randomIndex = Math.floor(Math.random() * unwatchedVideos.length);
      const randomVideo = unwatchedVideos.splice(randomIndex, 1)[0];
      recommendedVideos.push(randomVideo);
    }

    // if still not enough, add previously watched vids
    const additionalVideos = videos.filter(
      (vid) => !recommendedVideos.includes(vid)
    );

    for (const vid of additionalVideos) {
      recommendedVideos.push(vid);
      if (recommendedVideos.length >= count) break;
    }
  }

  // Step 5: Format response
  const videoList = recommendedVideos.slice(0, count).map((vid) => {
    return {
      id: vid._id,
      description: vid.description || "",
      title: vid.title || "",
      watched: user.viewed.includes(vid._id),
      liked: vid.ups.includes(email)
        ? true
        : vid.downs.includes(email)
        ? false
        : null,
      likevalues: vid.likes,
    };
  });

  // console.log('user already viewed: ', user.viewed)
  
  console.log("recommended videolist here is: ", videoList)
  
  return res.json({ status: "OK", videos: videoList });
});

module.exports = Milestone2Router;
