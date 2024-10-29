const express = require("express");
const path = require("path");
const session = require("express-session");
const { sendVerificationEmail } = require("./mailer");
const { engine } = require("express-handlebars");


const fs = require('fs');

const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");
const port = 3000;
const db = {};

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

app.use("", (req, res, next) => {
  res.set("X-CSE356", "66d0f3556424d34b6b77c48f");
  next();
});

app.use("/media", express.static(path.join(__dirname, "media")));

let videos = [];

fs.readFile(path.join(__dirname, 'media', 'm1.json'), 'utf8', (err, data) => {        
    if (err) {
        console.error('Error reading m.json:', err);
        return;
    }
    try {
        const jsonData = JSON.parse(data);

        // Transform the JSON data into the desired format
        videos = Object.entries(jsonData).map(([id, description]) => ({
                id: id.replace('.mp4', ''),
            title: id.replace('.mp4', ''),
            description,
            thumbnail: `/media/${id.replace('.mp4', '.jpg')}`
        }));

        console.log('Videos loaded:', videos);
    } catch (parseError) {
        console.error('Error parsing m.json:', parseError);
    }
});

// const videos = [
//  { id: '320x180_254k', title: 'Video 1', description: 'Low-res video', thumbnail: '/media/320x180_254k.jpg' },
//  { id: '320x180_507k', title: 'Video 2', description: 'Another low-res video', thumbnail: '/media/320x180_507k.jpg' },
//  { id: '480x270_759k', title: 'Video 3', description: 'Mid-res video', thumbnail: '/media/480x270_759k.jpg' },
//  { id: '640x360_1013k', title: 'Video 4', description: 'High-res video', thumbnail: '/media/640x360_1013k.jpg' },
//  { id: '640x360_1254k', title: 'Video 5', description: 'Another high-res video', thumbnail: '/media/640x360_1254k.jpg' },
// ];

app.get('/api/videos/:page', (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const pageSize = 10; // Number of videos per page

  const start = (page - 1) * pageSize;
  const paginatedVideos = videos.slice(start, start + pageSize);

  if (paginatedVideos.length === 0) {
    return res.json({
      status: 'ERROR',
      error: true,
      message: 'No more videos to load',
    });
  }

  res.json({
    status: 'OK',
    videos: paginatedVideos,
  });
});

app.get('/play/:id', (req, res) => {
  const videoId = req.params.id;
  res.render('player', { videoId });
});

app.get("/", (req, res) => {
  return res.render("home", {
    data: {
      username: req.session.username,
    },
  });
});

app.post("/api/adduser", async (req, res) => {
  const { username, password, email } = req.body;
  console.log("/adduser");
  console.table(req.body);
  if (email in db)
    return res.json({
      status: "ERROR",
      error: true,
      message: "DUPLICATE",
    });
   console.table(req.body);
  db[email] = { username, password, email, disabled: true };
  if (email !== 'admin@356.com'){
   await sendVerificationEmail(
     email,
     `http://${req.headers.host}/api/verify?email=${email}&key=somerandomstring`      
   );
  }
  return res.json({ status: "OK" });
});

app.get("/api/verify", (req, res) => {
  const { email, key } = req.query;
  console.log("/verify");
  console.table(req.query);
  if (key) {
    db[encodeURI(email).replace(/%20/g, "+")].disabled = false;
     return res.json({ status: "OK" });
  }

   return res.json({
     status: "ERROR",
    error: true,
     message: "your error message",
   });

  return res.redirect("/");
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  console.log("/login");
  console.table(req.body);

  console.log("Current DB state:", db);

  Object.keys(db).forEach((e) => {
    const entry = db[e];

    console.log("Checking user:", entry);

    if (
      entry.username === username &&
      entry.password === password &&
      !entry.disabled
    ) {
      req.session.username = username;
      return res.json({ status: "OK" });
    }
  });

  if (!res.headersSent)
    return res.json({
      status: "ERROR",
      error: true,
      message: "Invalid username or password",
    });
});

app.post("/api/logout", (req, res) => {
  console.log("/logout");
  req.session.destroy(function (err) {
    if (err)
      return res.json({
        status: "ERROR",
        error: true,
        message: "your error message",
      });
    else return res.json({ status: "OK" });
  });
});

app.post("/api/check-auth", (req, res) => {
  if (!req.session.username)
    return res.json({ isLoggedIn: false, userId: req.session.username });
  return res.json({ isLoggedIn: true, userId: req.session.username });
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


app.post('/api/videos', (req, res) => {
  const { count } = req.body;
  const slicedVideos = videos.slice(0, count);

  res.json({
    status: 'OK',
    videos: slicedVideos,
  });
});


app.get('/api/manifest/:id', isAuthenticated, (req, res) => {
  const videoId = req.params.id;
  // const manifestPath = path.join(__dirname, 'media', 'manifests', `${videoId}_manifest.mpd`);
        const manifestPath = path.join(__dirname, 'media', `${videoId}_output.mpd`);  
  console.log(`Looking for manifest at: ${manifestPath}`);

  // Set required headers
  // res.setHeader('X-CSE356', '66d0f3556424d34b6b77c48f');


  if (fs.existsSync(manifestPath)) {
    res.sendFile(manifestPath);
  } else {
    res.status(200).json({
      status: 'ERROR',
      error: true,
      message: 'Manifest not found',
    });
  }
});



app.get('/api/thumbnail/:id', (req, res) => {
  const videoId = req.params.id;
  const thumbnailPath = path.join(__dirname, 'media', `${videoId}.jpg`);

  console.log('Looking for thumbnail at:', thumbnailPath);

  if (fs.existsSync(thumbnailPath)) {
    res.sendFile(thumbnailPath);
  } else {
    res.status(404).json({ status: 'ERROR', message: 'Thumbnail not found' });        
  }
});