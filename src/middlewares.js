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

exports.db = {
  users: {},
  videos: {},
};

let videoId = 500;

exports.getAndIncrementId = () => {
  return videoId++;
};
exports.getId = () => {
  return videoId;
};

// DB LOOKS LIKE
