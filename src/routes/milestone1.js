const { Router } = require("express");
const { isAuthenticated } = require("../middlewares");

const MileStone1Router = Router();
const db = {};

MileStone1Router.post("/adduser", async (req, res) => {
  const { username, password, email } = req.body;
  if (email in db)
    return res.json({
      status: "ERROR",
      error: true,
      message: "DUPLICATE",
    });
  db[email] = { username, password, email, disabled: true };
  if (email !== "admin@356.com") {
    await sendVerificationEmail(
      email,
      `http://${req.headers.host}/api/verify?email=${email}&key=somerandomstring`
    );
  }
  return res.json({ status: "OK" });
});

MileStone1Router.get("/verify", (req, res) => {
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
});

MileStone1Router.post("/login", (req, res) => {
  const { username, password } = req.body;

  Object.keys(db).forEach((e) => {
    const entry = db[e];
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

MileStone1Router.post("/logout", (req, res) => {
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

MileStone1Router.post("/check-auth", (req, res) => {
  if (!req.session.username)
    return res.json({ isLoggedIn: false, userId: req.session.username });
  return res.json({ isLoggedIn: true, userId: req.session.username });
});

MileStone1Router.get("/manifest/:id", isAuthenticated, (req, res) => {
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

MileStone1Router.get("/thumbnail/:id", (req, res) => {
  const videoId = req.params.id;
  const thumbnailPath = path.join(__dirname, "media", `${videoId}.jpg`);

  console.log("Looking for thumbnail at:", thumbnailPath);

  if (fs.existsSync(thumbnailPath)) {
    res.sendFile(thumbnailPath);
  } else {
    res.status(404).json({ status: "ERROR", message: "Thumbnail not found" });
  }
});

module.exports = MileStone1Router;
