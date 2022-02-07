//Import des modèles nécessaires
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      const user = await User.findOne({ token: token }).select("_id account");
      //If the token doesn't correspondond to anyone in DB, deny access
      if (!user) {
        return res.status(401).json({ error: "unauthorized" });
        //If the token is valid, then update req to give access to user
      } else {
        req.user = user;
        return next();
      }
    } else {
      return res.status(401).json({ error: "unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
