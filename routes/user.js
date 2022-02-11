const express = require("express");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

//Import des modèles nécessaires
const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const email = req.fields.email;
    const username = req.fields.username;
    const password = req.fields.password;

    if (username) {
      // Chercher si l'email existe déjà dans la base
      const isEmailAlreadyUsed = await User.findOne({
        email: req.fields.email,
      });
      if (!isEmailAlreadyUsed) {
        // Génère le salt
        const salt = uid2(16);
        const passWord = req.fields.password;
        // Génère le hash
        const hash = SHA256(passWord + salt).toString(encBase64);
        // Génère le token
        const token = uid2(16);

        // Déclare un nouvel utilisateur
        const newUser = new User({
          email: email,
          account: {
            username: username,
          },
          token: token,
          hash: hash,
          salt: salt,
        });
        const userId = newUser.id;
        if (Object.keys(req.files).length > 0) {
          const avatar = req.files.avatar.path;
          const result = await cloudinary.uploader.upload(avatar, {
            folder: `vinted/users/${userId}`,
          });
          newUser.account.avatar = result;
        }
        await newUser.save();
        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(409).json({ message: "This email has already been used" });
      }
    } else {
      res.status(400).json({ message: "You must provide a username" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const userLoggingIn = await User.findOne({
      email: req.fields.email,
    });
    if (!userLoggingIn) {
      res.status(400).json({ message: "Email not found" });
    } else {
      const userLoggingInSalt = userLoggingIn.salt;
      const userLoggingInhash = userLoggingIn.hash;
      const newHash = SHA256(req.fields.password + userLoggingInSalt).toString(
        encBase64
      );
      if (userLoggingInhash === newHash) {
        res.status(200).json({
          _id: userLoggingIn._id,
          token: userLoggingIn.token,
          account: userLoggingIn.account,
        });
      } else {
        res.status(401).json({ message: "Wrong password" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
