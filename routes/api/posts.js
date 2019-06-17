const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const Post = require("../../models/Post");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const request = require("request");
const config = require("config");

//@route  POST api/posts
//@desc create a post
//@access Private

router.post(
  "/",
  [
    auth,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById({ _id: req.user.id }).select(
        "-password"
      );
      const newPost = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };
      const post = new Post(newPost);
      await post.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
