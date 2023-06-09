const express = require("express");
const session = require("express-session");
const cors = require("cors");
const app = express();

require("dotenv").config();

const passport = require("passport");
require("./passport/passport");

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

// MongoDB 연결
const mongodb = require("./db/db");
mongodb.connect();

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("home", { user: req.user });
  } else {
    console.log("로그인으로 가");
    res.redirect("/login");
  }
});

// login
const login = require("./routes/Login/login");
app.use("/login", login);

// sign
const sign = require("./routes/Sign/sign");
app.use("/sign", sign);

// board
const board = require("./routes/Board/board");
app.use("/board", board);

// myPage
const myPage = require("./routes/MyPage/myPage");
app.use("/myPage", myPage);

// movie
const movie = require("./routes/Movie/movie");
app.use("/movie", movie);

// tv
const tv = require("./routes/Tv/tv");
app.use("/tv", tv);

app.listen(process.env.PORT, () => {
  console.log("Server started on port" + process.env.PORT);
});
