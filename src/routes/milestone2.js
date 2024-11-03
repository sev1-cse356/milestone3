const { Router } = require("express");
const multer = require("multer");
const { db, isAuthenticated, getAndIncrementId } = require("../middlewares");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Milestone2Router = Router();
const { createClient } = require("redis");

const redisClient = createClient({ url: "redis://redis:6379" });

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

//TODO: 2. ADD AUTHENTICATION LATER
Milestone2Router.post("/like", isAuthenticated, (req, res) => {
  const { id, value } = req.body;

  if (!(id in db)) {
    db[id] = { likes: 0, ups: new Set(), downs: new Set(), nones: new Set() };
  }

  const entry = db[id];

  // Check if the user is performing the same action twice

  if (
    (value && entry.ups.has(req.session.username)) ||
    (value !== null && !value && entry.downs.has(req.session.username)) ||
    entry.nones.has(req.session.username)
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
    entry.ups.add(req.session.username);
    entry.downs.delete(req.session.username);
    entry.nones.delete(req.session.username);
  } else if (value !== null && !value) {
    incr = -1;
    entry.downs.add(req.session.username);
    entry.ups.delete(req.session.username);
    entry.nones.delete(req.session.username);
  } else {
    entry.nones.add(req.session.username);
    entry.ups.delete(req.session.username);
    entry.downs.delete(req.session.username);
  }

  entry.likes += incr;

  return res.json({ likes: db[id].likes });
});

//TODO: 4. ONLY ACCEPTS FORMDATA
// TEST WITH
// curl -X POST -F "author=Jie" -F "title=TEST" -F "mp4file=@src/media/855457-uhd_3840_2160_30fps_padded.mp4" localhost/api/upload
Milestone2Router.post("/upload", upload.single("mp4file"), (req, res) => {
  const { author, title } = req.body;

  const newVidId = getAndIncrementId();
  redisClient.publish(
    "upload",
    JSON.stringify({ id: newVidId, file: req.file.buffer.toString("base64") })
  );

  db[newVidId] = {
    author,
    title,
    likes: 0,
    ups: new Set(),
    downs: new Set(),
    nones: new Set(),
  };
  // console.log(req.file);
  return res.json({ id: newVidId });
});

//TODO: 5.
Milestone2Router.post("/view", isAuthenticated, (req, res) => {
  const { id } = req.body;
  db[req.session.email].viewed.add(id);
  return res.json({ status: "OK" });
});

//TODO: 7.
Milestone2Router.post("/processing-status", (req, res) => {
  return res.send("TO BE IMPLEMENTED");
});

module.exports = Milestone2Router;
