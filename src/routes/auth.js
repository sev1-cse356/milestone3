const { Router } = require("express");

const AuthRouter = Router();
const db = {};

AuthRouter.post("/adduser", async (req, res) => {
  const { username, password, email } = req.body;
  if (email in db)
    return res.json({
      status: "ERROR",
      error: true,
      message: "DUPLICATE",
    });
  db[email] = { username, password, email, disabled: true };
  if (email !== "admin@356.com") {
    await sendVerificationEmail(
      email,
      `http://${req.headers.host}/api/verify?email=${email}&key=somerandomstring`
    );
  }
  return res.json({ status: "OK" });
});

AuthRouter.get("/verify", (req, res) => {
  const { email, key } = req.query;
  console.log("/verify");
  console.table(req.query);
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

AuthRouter.post("/login", (req, res) => {
  const { username, password } = req.body;

  Object.keys(db).forEach((e) => {
    const entry = db[e];
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

AuthRouter.post("/logout", (req, res) => {
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

AuthRouter.post("/check-auth", (req, res) => {
  if (!req.session.username)
    return res.json({ isLoggedIn: false, userId: req.session.username });
  return res.json({ isLoggedIn: true, userId: req.session.username });
});

module.exports = AuthRouter;
