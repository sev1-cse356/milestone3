const { Router } = require("express");
const { db } = require("../middlewares");

const Milestone2Router = Router();

//TODO: 2.
Milestone2Router.post("/like", (req, res) => {
  return res.send("TO BE IMPLEMENTED");
});

//TODO: 4.
Milestone2Router.post("/upload", (req, res) => {
  return res.send("TO BE IMPLEMENTED");
});

//TODO: 5.
Milestone2Router.post("/view", (req, res) => {
  return res.send("TO BE IMPLEMENTED");
});

//TODO: 7.
Milestone2Router.post("/processing-status", (req, res) => {
  return res.send("TO BE IMPLEMENTED");
});

module.exports = Milestone2Router;
