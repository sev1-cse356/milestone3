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

  const _id = id.toString();
  //console.log("LIKING", _id)
  let entry = await getOnefromDb("videos", { _id });

  if (entry === undefined){
    // console.error("LIKE FAILED")
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
    // console.error("LIKE FAILED: USER IS LIKING A VIDEO TWICE");
    return res.json({
      status: "ERROR",
      error: true,
      message: "User trying to like a video twice or something",
    });
  }

  // Process data after validation
  let incr = 0;

  if (value) {
    // console.log("liking video")
    incr = 1;
    updateToDb("videos", { _id }, { $push: { ups: req.session.email } }); // entry.ups.add(req.session.email);
    updateToDb("videos", { _id }, { $pull: { downs: req.session.email } }); // entry.downs.delete(req.session.email);
    updateToDb("users", { _id: req.session.email }, { $push: { liked: id } }); // db.users[req.session.email].liked.add(id);
    updateToDb("users", { _id: req.session.email }, { $pull: { disliked: id } });
    // entry.nones.delete(req.session.username);
  } else if (value !== null && !value) {
    // console.log("disliking video")
    incr = -1;
    updateToDb("videos", { _id }, { $push: { downs: req.session.email } });
    updateToDb("videos", { _id }, { $pull: { ups: req.session.email } });
    updateToDb("users", { _id: req.session.email }, { $pull: { liked: id } }); // db.users[req.session.email].liked.delete(id);
    updateToDb("users", { _id: req.session.email }, { $push: { disliked: id } });
    // entry.nones.delete(req.session.username);
  } else {
    // console.log("already liked or disliked")
    if (entry.ups.has(req.session.email)) {
      updateToDb("videos", { _id }, { $pull: { ups: req.session.email } });
      incr = -1;
    }

    if (entry.downs.has(req.session.email)) {
      updateToDb("videos", { _id }, { $pull: { downs: req.session.email } });
      incr = 1;
    }

    updateToDb("users", { _id: req.session.email }, { $pull: { liked: id } }); // db.users[req.session.email].liked.delete(id);
    updateToDb("users", { _id: req.session.email }, { $pull: { disliked: id } });
  }

  updateToDb("videos", { _id }, { $inc: { likes: incr } });
  // console.log("LIKE GOOD");
  return res.json({ status: "OK", likes: entry.likes + incr });
});

// TEST WITH
// curl -X POST -F "author=Jie" -F "title=TEST" -F "mp4File=@src/media/855457-uhd_3840_2160_30fps_padded.mp4" localhost/api/upload
Milestone2Router.post("/upload", upload.single("mp4File"), async (req, res) => {
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
  // console.log("/api/processing-status");
  // console.log(db.videos)
  const videos = await getAllfromDb("videos", { author: req.session.username });
  //console.log("Processing STATUS", videos)
  const ret = videos.map((e) => {
    return { id: e._id, title: e.title, status: e.status };
  });
  return res.json({ status: "OK", videos: ret });
});

// Helper: Precompute User and Video Mappings
async function getVideosUsersMap() {
  const [users, videos] = await Promise.all([
    getAllfromDb("users"),
    getAllfromDb("videos"),
  ]);
  // console.log("users", users);
  // console.log("videos", videos);
  const userMap = users.reduce((map, user) => {
    map[user._id] = user;
    return map;
  }, {});
  const videoMap = videos.reduce((map, video) => {
    map[video._id] = video;
    return map;
  }, {});
  //console.log("userMap: ", userMap);
  //console.log("videoMap:", videoMap);
  return [users, videos, userMap, videoMap];
}

// Helper: Fallback to Random Unwatched Videos
function fallback_unwatched(recommendedVideos, videos, user, count) {
  // console.log("In fallback unwatched");
  const unwatchedVideos = videos.filter(
    (vid) => !user.viewed.includes(vid._id) 
  );

  while (recommendedVideos.size < count && unwatchedVideos.length > 0) {
    const randomVideo = unwatchedVideos.splice(
      Math.floor(Math.random() * unwatchedVideos.length),
      1
    )[0];
    recommendedVideos.add(randomVideo);
  }
  return recommendedVideos;
}

// Helper: Fallback to Random Watched Videos
function fallback_random(recommendedVideos, videos, user, count) {
  // console.log("In fallback random");
  const watchedVideos = videos.filter(
    (vid) => user.viewed.includes(vid._id) 
  );
  while (recommendedVideos.size < count && watchedVideos.length > 0) {
    const randomVideo = watchedVideos.splice(
      Math.floor(Math.random() * watchedVideos.length),
      1
    )[0];
    recommendedVideos.add(randomVideo);
  }
  return recommendedVideos;
}

// Helper: Format Response
function formatResponse(recommendedVideos, user, count) {
  return Array.from(recommendedVideos).slice(0, count).map((video) => ({
    id: video._id,
    description: video.description || "",
    title: video.title || "",
    watched: user.viewed.includes(video._id),
    liked: user.liked.includes(video._id)
      ? true
      : user.disliked?.includes(video._id)
      ? false
      : null,
    likevalues: video.likes,
  }));
}

function similarVideosByVideos(video, userId, users, videos, userMap, videoMap, recommendedVideos, count) {
  // console.info("In Videos By Videos")
  const videoId = video; // Assign the video ID

  //console.log(`Inside similar vid function ${videoId}`);

  const user = userMap[userId]; // Get the user object from the user map

  if (users.length > 1) {
    // Step 1: Prepare the video preference vector
    const videoVector = users.map((uid) => {
      const liked = uid.liked || [];
      const disliked = uid.disliked || [];
      return liked.includes(videoId.toString()) ? 1 : disliked.includes(videoId.toString()) ? -1 : 0; // Interaction values
    });

    // console.log(`VIDEO VECTOR = ${videoVector}`);

    // Step 2: Calculate similarity with other videos using cosine similarity
    const similarityScores = [];
    // console.log(videos);
    videos.forEach((other) => {
      const otherVid = other._id; // Use _id for videos

      if (otherVid !== videoId) {
        const otherVideoVector = users.map((uid) => {
          const liked = uid.liked || [];
          const disliked = uid.disliked || [];
          return liked.includes(otherVid) ? 1 : disliked.includes(otherVid) ? -1 : 0; // Interaction values
        });

        const similarity = cosineSimilarity(videoVector, otherVideoVector);
        // if (similarity > 0)
        //   console.log("VBV OTHER VECTOR: ", videoVector, otherVideoVector, similarity, Number.isNaN(similarity) ? 0 : similarity)
        
        similarityScores.push({
          video: otherVid,
          similarity: Number.isNaN(similarity) ? 0 : similarity, // Handle NaN similarity
        });
      }
    });

    // Step 3: Sort videos by similarity in descending order
    similarityScores.sort((a, b) => b.similarity - a.similarity);
    // console.log("SORTED Similarity Scores ==========>", similarityScores);
    // console.log("VIDEO BY VIDEOS SIMILIAR")
    // console.log("similarityScores length: ", similarityScores.length)
    // console.log("check first similarityScore: ", similarityScores[0].similarity)
    // for (let i =0; i< similarityScores.length; i++){
    //   if (similarityScores[i].similarity)
    //     console.log(similarityScores[i].similarity, i)
    // }

    // Step 4: Get recommended videos based on similar videos
    // if (user.liked.length)
    for (const { video: similarVideoId } of similarityScores) {
      const similar_video = videoMap[similarVideoId]; // Fetch the video object from the video map
      if (!user.viewed.includes(similarVideoId)) {
        // Only add videos the user has not already viewed
        recommendedVideos.add(similar_video);
      }
      if (recommendedVideos.size >= count) break; // Double-check count
    }
  }

  return recommendedVideos;
}


// Helper: User-Based Recommendations
function similarVideosByUser(
  users,
  videos,
  userMap,
  videoMap,
  userId,
  recommendedVideos,
  count
) {
  // console.log(`Reached user-based recommendation for user ${userId}`);

  const user = userMap[userId];

  if (users.length > 1) {
    // Step 1: Prepare the user's preference vector
    const userVector = videos.map((vid) => {
      const liked = vid.ups || [];
      const disliked = vid.downs || [];
      return liked.includes(userId) ? 1 : disliked.includes(userId) ? -1 : 0; // No interaction
    });
    // console.log(`USER VECTOR for userId ${userId} = ${userVector}`);

    // Step 2: Calculate similarity with other users
    const similarityScores = [];

    users.forEach((otherUser) => {
      const otherUserId = otherUser._id;
      if (otherUserId !== userId) {
        // Generate preference vector for the other user
        const otherUserVector = videos.map((vid) => {
          const liked = vid.ups || [];
          const disliked = vid.downs || [];
          return liked.includes(otherUserId)
            ? 1
            : disliked.includes(otherUserId)
            ? -1
            : 0; // No interaction
        });

        const similarity = cosineSimilarity(userVector, otherUserVector);
        similarityScores.push({
          user: otherUserId,
          similarity: Number.isNaN(similarity) ? 0 : similarity, // Handle NaN
        });
      }
    });

    // Step 3: Sort users by similarity in descending order
    similarityScores.sort((a, b) => b.similarity - a.similarity);
    // console.log("SORTED USER SIMILARITY SCORES ===========> ", similarityScores);

    // Step 4: Recommend videos based on similar users
    for (const { user: similarUserId } of similarityScores) {
      const similarUser = userMap[similarUserId];
      const otherLikes = similarUser.liked || []; // Videos liked by the similar user

      for (const videoId of otherLikes) {
        if (!user.viewed.includes(videoId)) {
          // Only recommend videos not viewed by the current user
          recommendedVideos.add(videoMap[videoId]);
          if (recommendedVideos.size >= count) break;
        }
      }
      if (recommendedVideos.size >= count) break;
    }
  }

  return recommendedVideos;
}


// Endpoint: Recommendations
Milestone2Router.post("/videos", isAuthenticated, async (req, res) => {
  const { count, videoId } = req.body;
  const userId = req.session.email;
  // console.log("userID: ", userId);
  // console.log("Count: ", count)
  // console.log("Video ID was: ", videoId.trim())
  const [users, videos, userMap, videoMap] = await getVideosUsersMap();
  const recommendedVideos = new Set();

  if (videoId) {
    // console.log("called VBV")
    similarVideosByVideos(
      videoId,
      userId,
      users,
      videos,
      userMap,
      videoMap,
      recommendedVideos,
      count
    );
  }

  // console.log("Recommended videos length after VBV: ", recommendedVideos.size)

  if (recommendedVideos.size < count) {
    // console.log("VBU")
    similarVideosByUser(
      users,
      videos,
      userMap,
      videoMap,
      userId,
      recommendedVideos,
      count
    );
  }

  // console.log("Recommended videos length after VBU: ", recommendedVideos.size)

  //console.log("Number of recommended videos:", recommendedVideos.size);
  //console.log("Recommended Videos After Video-Based:", Array.from(recommendedVideos));

  if (recommendedVideos.size < count) {
    fallback_unwatched(recommendedVideos, videos, userMap[userId], count);
  }
    

  if (recommendedVideos.size < count) {
    fallback_random(recommendedVideos, videos, userMap[userId], count);
  }

  // console.log("recommendedVideos length at end is: ", recommendedVideos.size)

  const videoList = formatResponse(recommendedVideos, userMap[userId], count);

  // console.log("videoList length: ", videoList.length)
  // console.log("count was ", count)

  return res.json({ status: "OK", videos: videoList });
});

module.exports = Milestone2Router;
