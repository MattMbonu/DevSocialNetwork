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

//@route  GET api/posts
//@desc Get all Posts
//@access Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@route  GET api/posts/:post_id
//@desc Get a Post by Id
//@access Private
router.get("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.post_id });
    if (!post) {
      return res.status(404).json({ msg: "Post not Found" });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not Found" });
    }
    return res.status(500).send("Server Error");
  }
});

//@route  DELETE api/posts/:post_id
//@desc Delete a Post by Id
//@access Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.post_id });
    if (!post) {
      return res.status(404).json({ msg: "Post not Found" });
    }
    //Check to ensure User
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    await post.remove();
    res.json({ msg: "Post Deleted" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not Found" });
    }
    return res.status(500).send("Server Error");
  }
});

//@route  PUT api/posts/like/:id
//@desc Like a Post
//@access Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.id });
    //check if post has been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: "Post already Liked" });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@route  PUT api/posts/unlike/:id
//@desc Like a Post
//@access Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.id });
    //check if post has been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: "Post Hasn't Been Liked" });
    }
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@route  POST api/posts/comment/:id
//@desc Comment on a post
//@access Private

router.post(
  "/comment/:id",
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
      const post = await Post.findById({ _id: req.params.id });
      const user = await User.findById({ _id: req.user.id }).select(
        "-password"
      );
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

//@route  DELETE api/posts/:post_id
//@desc Delete a Post by Id
//@access Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.post_id });
    if (!post) {
      return res.status(404).json({ msg: "Post not Found" });
    }
    //Check to ensure User
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    await post.remove();
    res.json({ msg: "Post Deleted" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not Found" });
    }
    return res.status(500).send("Server Error");
  }
});

//@route  DELETE api/posts/comment/:id/:comment_id
//@desc Delete a Comment from a Post
//@access Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById({ _id: req.params.id });
    // pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    const removeIndex = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});
module.exports = router;
