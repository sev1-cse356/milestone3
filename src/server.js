const express = require("express");
const path = require("path");
const session = require("express-session");
const { engine } = require("express-handlebars");
const MileStone1Router = require("./routes/milestone1");
const Milestone2Router = require("./routes/milestone2");
const VideoRouter = require("./routes/videos");
const { isAuthenticated } = require("./middlewares");

const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");
const port = 3000;

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

app.use("/api", MileStone1Router);
app.use("/api", Milestone2Router);
app.use("/api/videos", VideoRouter);

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

//TODO: 6.
app.get("/upload", (req, res) => {
  return res.send("TO BE IMPLEMENTED");
});

// Protect the /media route
app.use(
  "/media",
  isAuthenticated,
  express.static(path.join(__dirname, "media"))
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
