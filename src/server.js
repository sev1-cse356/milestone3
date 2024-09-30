const express = require("express");
const app = express();
const port = 3000;

app.use("", (req, res, next) => {
  res.set("X-CSE356", "66d0f3556424d34b6b77c48f");
  next();
});

app.post("/adduser", (req, res) => {
  const { username, password, email } = req.body;

  const user = { username, password, email, disabled: true };

  res.json(user);
});

app.get("/verify", (req, res) => {
  const { email, key } = req.query;
  res.send("Hello World!");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  res.send("Hello World!");
});

app.post("/logout", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
