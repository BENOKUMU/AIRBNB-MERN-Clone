const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const UserModel = require('./models/User');
const User = require('./models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

require('dotenv').config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10)
const jwtSecret = 'thequickbrownfoxjumpedoverthelazydogs';

app.use(express.json())

app.use(cookieParser())

app.use(
  cors({
    credentials: true,
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
  })
);


// console.log(process.env.MONGO_URL);

app.get('/test', (_req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  res.json('test ok');
  console.log('database connected');
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({email});
    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            jwt.sign({
              email:userDoc.email, 
              id:userDoc._id, 
              name:userDoc.name
            }, jwtSecret, {}, (err, token) => {
              if (err) throw err;
              res.cookie("token", token).json(userDoc);
            })
            
        } else {
            res.json('pass not ok');
        }
    } else {
        res.status(422).json('not found');
    }
});

app.get('/profile', (req, res) => {
  const {token} = req.cookies;
  if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if(err) throw err;
      const userDoc = await User.findById(userData.id);
      res.json(userData);
    });
  } else {
    res.json(null);
  }
});

app.listen(4000);

