const { Router } = require("express");
const { isAuthenticated, db} = require("../middlewares");
const path = require("path");
const fs = require("fs");
const MileStone1Router = Router();
const { sendVerificationEmail } = require("../mailer");
const { getAllfromDb, insertToDb, updateToDb } = require("../db");

MileStone1Router.post("/adduser", async (req, res) => {
  //console.log("/adduser");
  console.table(req.body)
  const { username, password, email } = req.body;


  const users = await getAllfromDb("users", {_id: email})
  // console.table(req.body);

  if (users.length)
    return res.json({
      status: "ERROR",
      error: true,
      message: "DUPLICATE",
    });

  insertToDb("users",  { _id: email, username, password, disabled: true, viewed: [], liked: [], disliked: [] })

  // console.log("DB STATE AFTER ADDING USER", email);
  // console.table(db);
  if (email !== "admin@356.com") {
    await sendVerificationEmail(
      email,
      `http://sev-1.cse356.compas.cs.stonybrook.edu/api/verify?email=${email}&key=somerandomstring`
    );
  }
  return res.json({ status: "OK" });
});

MileStone1Router.get("/verify", async (req, res) => {
  //console.log("/api/verify");
  const { email, key } = req.query;
  // console.log("DB STATE");
  // console.table(db);
  const encodedEmail = encodeURIComponent(email)
    .replace(/%20/g, "+")
    .replace(/%40/g, "@");

  try {
    if (key && key === "somerandomstring") {
      updateToDb("users", {_id: encodedEmail}, { $set: { "disabled": false } })
      return res.json({ status: "OK" });
    } else {
      return res.json({
        status: "ERROR",
        error: true,
        message: "Wrong Key",
      });
    }
  } catch {
    return res.json({
      status: "ERROR",
      error: true,
      message: "your error message",
    });
  }
});

MileStone1Router.post("/login", async (req, res) => {
  //console.log("/api/login")
  // console.table(req.body)
  const { username, password } = req.body;
  const user = await getAllfromDb("users", {"username": username})
  if(user[0] && password === user[0].password){
    req.session.username = username;
    req.session.email = user[0]._id;
    //console.log("LOGIN SUCESSFUL")
    return res.json({ status: "OK" });
  } else{
    //console.log("LOGIN FAILED")
    return res.json({
      status: "ERROR",
      error: true,
      message: "Invalid username or password",
    });
  }
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

function isNumeric(str) {
  return !isNaN(str) && !isNaN(parseFloat(str));
}

MileStone1Router.get("/manifest/:id", isAuthenticated, (req, res) => {
  const videoId = req.params.id;
  let manifestPath = path.join(__dirname, "../media", `${videoId}`);

  if(isNumeric(videoId)){
    manifestPath = path.join(__dirname, "../media", `${videoId}_padded_output.mpd`);
  }

  // const manifestPath = path.join(__dirname, 'media', 'manifests', `${videoId}_manifest.mpd`);
  // console.log(`Manifest ID: ${videoId}`)
  // console.log(`Looking for manifest at: ${manifestPath}`);

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
  const thumbnailPath = path.join(
    __dirname,
    "../media",
    `${videoId}_padded.jpg`
  );

  if (fs.existsSync(thumbnailPath)) {
    res.sendFile(thumbnailPath);
  } else {
    res.status(404).json({ status: "ERROR", message: "Thumbnail not found" });
  }
});

module.exports = MileStone1Router;
