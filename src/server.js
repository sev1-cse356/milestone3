const express = require("express");
const path = require("path");
const session = require("express-session");
const { sendVerificationEmail } = require("./mailer");
const { engine } = require("express-handlebars");
const AuthRouter = require("./routes/auth");

const fs = require("fs");
const VideoRouter = require("./routes/videos");

const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");
const port = 3000;

app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use("*", (req, res, next) => {
  res.set("X-CSE356", "66d0f3556424d34b6b77c48f");
  next();
});

app.use("/api", AuthRouter);
app.use("/api/videos", VideoRouter)

app.use("/media", express.static(path.join(__dirname, "media")));



// const videos = [
//  { id: '320x180_254k', title: 'Video 1', description: 'Low-res video', thumbnail: '/media/320x180_254k.jpg' },
//  { id: '320x180_507k', title: 'Video 2', description: 'Another low-res video', thumbnail: '/media/320x180_507k.jpg' },
//  { id: '480x270_759k', title: 'Video 3', description: 'Mid-res video', thumbnail: '/media/480x270_759k.jpg' },
//  { id: '640x360_1013k', title: 'Video 4', description: 'High-res video', thumbnail: '/media/640x360_1013k.jpg' },
//  { id: '640x360_1254k', title: 'Video 5', description: 'Another high-res video', thumbnail: '/media/640x360_1254k.jpg' },
// ];



app.get("/play/:id", (req, res) => {
  const videoId = req.params.id;
  res.render("player", { videoId });
});

app.get("/", (req, res) => {
  return res.render("home", {
    data: {
      username: req.session.username,
    },
  });
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.username) {
    return next();
  } else {
    res.status(200).header("X-CSE356", "66d0f3556424d34b6b77c48f").json({
      status: "ERROR",
      error: true,
      message: "User not authenticated",
    });
  }
}

// Protect the /media route
app.use(
  "/media",
  isAuthenticated,
  express.static(path.join(__dirname, "media"))
);

app.get("/", isAuthenticated, (req, res) => {
  res.render("home", { username: req.session.username });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(200).json({
    status: "ERROR",
    error: true,
    message: err.message || "An error occurred",
  });
});



app.get("/api/manifest/:id", isAuthenticated, (req, res) => {
  const videoId = req.params.id;
  // const manifestPath = path.join(__dirname, 'media', 'manifests', `${videoId}_manifest.mpd`);
  const manifestPath = path.join(__dirname, "media", `${videoId}_output.mpd`);
  console.log(`Looking for manifest at: ${manifestPath}`);

  // Set required headers
  // res.setHeader('X-CSE356', '66d0f3556424d34b6b77c48f');

  if (fs.existsSync(manifestPath)) {
    res.sendFile(manifestPath);
  } else {
    res.status(200).json({
      status: "ERROR",
      error: true,
      message: "Manifest not found",
    });
  }
});

app.get("/api/thumbnail/:id", (req, res) => {
  const videoId = req.params.id;
  const thumbnailPath = path.join(__dirname, "media", `${videoId}.jpg`);

  console.log("Looking for thumbnail at:", thumbnailPath);

  if (fs.existsSync(thumbnailPath)) {
    res.sendFile(thumbnailPath);
  } else {
    res.status(404).json({ status: "ERROR", message: "Thumbnail not found" });
  }
});

///

