const express = require("express");
const session = require("express-session");
const { engine } = require("express-handlebars");
const MileStone1Router = require("./routes/milestone1");
const Milestone2Router = require("./routes/milestone2");
const VideoRouter = require("./routes/videos");
const { dropDb, insertToDb } = require("./db");
const fs = require("fs");
const path = require("path");

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
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
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

app.get("/",async (req, res) => {
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
  await dropDb("users")
  await dropDb("videos")

  fs.readFile(
    path.join(__dirname, "./media", "m2.json"),
    "utf8",
    async (err, data) => {
      if (err) {
        console.error("Error reading m2.json:", err);
        return;
      }
  
      try {
        const jsonData = JSON.parse(data);
  
        const videos = Object.entries(jsonData).map(([id, description]) => ({
          _id: id.replace(".mp4", ""),
          author: "default",
          title: id.replace(".mp4", ""),
          description: description || "random video description",
          likes: 0,
          ups: [],
          downs: [],
          usersViewed: [],
          status: "complete",
        }));
        
        for (const video of videos) {
          try {
            await insertToDb("videos", video);
          } catch (dbError) {
            console.error("Error inserting video:", dbError);
          }
        }
        console.log(
          `${videos.length} videos were loaded and inserted into the db`
        );
      } catch (parseError) {
        console.error("Error parsing m2.json:", parseError);
      }
    }
  );

  console.log(`Example app listening on port ${port}`);
});
