exports.isAuthenticated = function isAuthenticated(req, res, next) {
  if (req.session && req.session.username) {
    return next();
  } else {
    res.status(200).json({
      status: "ERROR",
      error: true,
      message: "User not authenticated",
    });
  }
};

let videoId = Date.now();

exports.getAndIncrementId = () => {
  return `v${videoId++}`;
};
exports.getId = () => {
  return `v${videoId}`;
};

// DB LOOKS LIKE
