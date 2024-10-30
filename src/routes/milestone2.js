const { Router } = require("express");
const { db, isAuthenticated } = require("../middlewares");

const Milestone2Router = Router();

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

//TODO: 4.
Milestone2Router.post("/upload", (req, res) => {
  return res.send("TO BE IMPLEMENTED");
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
