require("dotenv").config();
require("./config/database").connect();
const express = require("express");

const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

app.use(express.json());

const User = require("./model/user");

const auth = require("./middleware/auth");

//Welcome
app.get("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});

//Register
app.post("/register", async (req, res) => {
  try {
    // Register input
    const { first_name, last_name, email, password } = req.body;

    // Input validation
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }

    // Validate if in db
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    //Encrypt password
    encryptedPassword = await bcrypt.hash(password, 10);

    //Create new user in db
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    //Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    user.token = token;
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

//Login
app.post("/login", async (req, res) => {
  try {
    //Login input
    const { email, password } = req.body;

    //Input validation
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    //Validate if in db
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      user.token = token;
      res.status(200).json(user);
    } else {
      res.status(400).send("Invalid Credentials");
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = app;
