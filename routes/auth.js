/**
 * Authentication related routes.
 */
import express from "express";
import passport from "passport";
import LocalStrategy from "passport-local";
import crypto from "crypto"; // NodeJS built-in module.
import db from "../db.js"; // SQLite3 database for the application.

var router = express.Router();

// Configure the LocalStrategy.
// Configures the LocalStrategy to fetch the user record from the app's database and
// verify the hashed password against the password submitted by the user. If that
// succeeds, the password is valid and the user is authenticated.
passport.use(
  new LocalStrategy(function verify(username, password, cb) {
    db.get("SELECT * FROM users WHERE username = ?", [username], function (err, row) {
      if (err) {
        return cb(err);
      }
      if (!row) {
        return cb(null, false, { message: "Incorrect username or password." });
      }

      crypto.pbkdf2(password, row.salt, 310000, 32, "sha256", function (err, hashedPassword) {
        if (err) {
          return cb(err);
        }
        if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
          return cb(null, false, { message: "Incorrect username or password." });
        }
        return cb(null, row);
      });
    });
  })
);

//---------------------------------
// Configure Passport to persist user information in the login session
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
//---------------------------------

// Render sign in page.
router.post(
  "/login/password",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/signup", function (req, res, next) {
  res.render("signup");
});

// Creates a new user record in the app's database, storing the username and hashed password. Once the record is created, the user is logged in.
router.post("/signup", function (req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, "sha256", function (err, hashedPassword) {
    if (err) {
      return next(err);
    }
    db.run("INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)", [req.body.username, hashedPassword, salt], function (err) {
      if (err) {
        return next(err);
      }
      var user = {
        id: this.lastID,
        username: req.body.username,
      };
      req.login(user, function (err) {
        if (err) {
          return next(err);
        }
        res.redirect("/");
      });
    });
  });
});

export default router;
