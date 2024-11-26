const express = require("express");
const session = require("express-session");
const { engine } = require("express-handlebars");
const MileStone1Router = require("./routes/milestone1");
const Milestone2Router = require("./routes/milestone2");
const VideoRouter = require("./routes/videos");
const MongoDBStore = require('connect-mongodb-session')(session);

const store = new MongoDBStore({
  uri: 'mongodb://root:example@db:27017/',
  databaseName: "sessions",
  collection: 'user_sessions'
});

store.on('error', function(error) {
  // Also get an error here
  console.error("SESSION STORE MONGO NOT GOOD")
});


const app = express();
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./src/views");
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false,  maxAge: 1000 * 60 * 60 * 24 * 7  },
    store: store
  })
);

// app.use("*", (req, res, next) => {
//   res.set("X-CSE356", "66d0f3556424d34b6b77c48f");
//   next();
// });

app.use("/api", MileStone1Router);
app.use("/api", Milestone2Router);
app.use("/api/videos", VideoRouter);

app.get("/play/:id", (req, res) => {
  const videoId = req.params.id;
  res.render("player", { videoId });
});

app.get("/", async (req, res) => {
  return res.render("home", {
    data: {
      username: req.session.username,
    },
  });
});

//TODO: 6.
app.get("/upload", (req, res) => {
  return res.render("upload");
});

// Protect the /media route
// app.use(
//   "/media",
//   isAuthenticated,
//   express.static(path.join(__dirname, "media"))
// );

app.listen(port, async () => {
 
  console.log(`Example app listening on port ${port}`);
});
