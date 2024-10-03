const express = require("express");
const session = require("express-session");
const { sendVerificationEmail } = require("./mailer");
const { engine } = require("express-handlebars");

const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");
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

app.get("/", (req, res) => {
  if (!req.session.username)
    return res.json({
      status: "ERROR",
      error: true,
      message: "your error message",
    });
  return res.render("home");
});

app.post("/adduser", async (req, res) => {
  const { username, password, email } = req.body;
  console.log("/adduser");
  console.table(req.body);
  if (email in db)
    return res.json({
      status: "ERROR",
      error: true,
      message: "DUPLICATE",
    });
  // console.table(req.body);
  db[email] = { username, password, email, disabled: true };
  await sendVerificationEmail(
    email,
    `http://${req.headers.host}/verify?email=${email}&key=somerandomstring`
  );
  return res.json({ status: "OK" });
});

app.get("/verify", (req, res) => {
  const { email, key } = req.query;
  console.log("/verify");
  console.table(req.query);
  console.log(encodeURI(email).replace(/%20/g, "+"));
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

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log("/login");
  console.table(req.body);
  Object.keys(db).forEach((e) => {
    console.table(e);
    if (e.username === username && e.password === password && !e.disabled) {
      req.session.username = username;
      req.session.email = email;
      return res.json({ status: "OK" });
    }
  });
  return res.json({
    status: "ERROR",
    error: true,
    message: "your error message",
  });
});

app.post("/logout", (req, res) => {
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
