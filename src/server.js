const express = require("express");
const session = require("express-session");
const { sendVerificationEmail } = require("./mailer");

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

app.post("/adduser", async (req, res) => {
  const { username, password, email } = req.body;
  db[email] = { username, password, email, disabled: true };
  await sendVerificationEmail(
    email,
    `${req.headers.host}/verify?email=${email}&key="somerandomstring"`
  );
  return res.send("OK");
});

app.get("/verify", (req, res) => {
  const { email, key } = req.query;
  if (key) {
    db[email].disabled = false;
    return res.send(`OK`);
  }
  return res.send({
    status: "ERROR",
    error: true,
    message: "your error message",
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  Object.keys(db).forEach((e) => {
    if (e.username === username && e.password === password && !e.disabled) {
      req.session.username = username;
      req.session.email = email;
      return res.send("OK");
    }
  });
  return res.send({
    status: "ERROR",
    error: true,
    message: "your error message",
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(function (err) {
    if (err)
      res.send({
        status: "ERROR",
        error: true,
        message: "your error message",
      });
    else res.send("OK");
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
