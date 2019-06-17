const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const User = require("../../models/User");
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const request = require("request");
const config = require("config");

//@route  GET api/profile
//@desc Get all profiles
//@access public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@route  GET api/profile/me
//@desc Get Logged in User Profile
//@access Private

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      return res.status(400).json({ msg: "there is no profile for this user" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("server error");
  }
});

//@route  POST api/profile
//@desc Create or Update user profile
//@access Private

router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is Required")
        .not()
        .isEmpty(),
      check("skills", "Skills are Required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubusername,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram
    } = req.body;
    //Build my Profile Object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (skills) {
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    }
    if (bio) profileFields.bio = bio;
    if (githubusername) profileFields.githubusername = githubusername;
    const social = {};
    if (youtube) social.youtube = youtube;
    if (twitter) social.twitter = twitter;
    if (facebook) social.facebook = facebook;
    if (linkedin) social.linkedin = linkedin;
    if (instagram) social.instagram = instagram;
    profileFields.social = social;
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("server error");
    }
  }
);

//@route  GET api/profile/user/user_id
//@desc Get a Users Profiles by ID
//@access public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ msg: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    } else {
      return res.status(500).send("Server Error");
    }
  }
});

//@route  DELETE api/profile
//@desc Delete a User
//@access Private
router.delete("/", auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User Account and Profile Deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@route  PUT api/profile
//@desc Add Experience
//@access Private
router.put("/experience", [
  auth,
  [
    check("title", "Title is required")
      .not()
      .isEmpty(),
    check("company", "Company is required")
      .not()
      .isEmpty(),
    check("from", 'The "from" date is required')
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;
    const newXp = { title, company, location, from, to, current, description };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newXp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
]);

//@route  DELETE api/profile/experience/exp_id
//@desc Add Experience
//@access Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience
      .map(exp => exp.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@route  PUT api/profile/education
//@desc Add Experience
//@access Private
router.put("/education", [
  auth,
  [
    check("school", "School is required")
      .not()
      .isEmpty(),
    check("degree", "Degree is required")
      .not()
      .isEmpty(),
    check("fieldofstudy", "Field of Study is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { school, degree, fieldofstudy, from, to, description } = req.body;
    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      description
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
]);

//@route  DELETE api/profile/education/edu_id
//@desc Add Experience
//@access Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education
      .map(edu => edu.id)
      .indexOf(req.params.edu_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

//@route  GET api/profile/github/:username
//@desc Get User Repos
//@access public

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" }
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      }
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No Github profile found" });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});
module.exports = router;
