const express = require("express");
const session = require("express-session");

const app = express();
const port = 3000;
const db = {};

app.use(express.json());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use("", (req, res, next) => {
  res.set("X-CSE356", "66d0f3556424d34b6b77c48f");
  next();
});

app.post("/adduser", (req, res) => {
  const { username, password, email } = req.body;
  db[email] = { username, password, email, disabled: true };
  return res.json({ username, password, email, disabled: true });
});

app.get("/verify", (req, res) => {
  const { email, key } = req.query;
  if (key) {
    db[email].disabled = false;
    return res.send(`${email} Verified`);
  }
  return res.send(`${email} Not Verified`);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  Object.keys(db).forEach((e) => {
    if (e.username === username && e.password === password && !e.disabled) {
      req.session.username = username;
      req.session.email = email;
      return res.send(req.session);
    }
  });
  return res.send("Fail to Login");
});

app.post("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err) res.send("User Did Not Log Out");
    else res.send("User Logged Out");
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
