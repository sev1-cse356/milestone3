const express = require("express");
const path = require("path");
const session = require("express-session");
const { sendVerificationEmail } = require("./mailer");
const { engine } = require("express-handlebars");


const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");
const port = 3000;
const db = {};


app.use(express.static(path.join(__dirname, '../public')));

app.use(express.json());
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

//app.use("/media", express.static(path.join(__dirname, "media")));

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

function isAuthenticated(req, res, next) {
  if (req.session && req.session.username) {
    return next();
  } else {
    res.status(200).header('X-CSE356', '66d0f3556424d34b6b77c48f').json({
      status: 'ERROR',
      error: true,
      message: 'User not authenticated'
    });
  }
}

// Protect the /media route
app.use('/media', isAuthenticated, express.static(path.join(__dirname, 'media')));


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
