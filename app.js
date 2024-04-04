"use strict";

const dotenv = await import("dotenv"); // npm i dotenv

import createError from "http-errors";

import bodyParser from "body-parser"; // npm i body-parser

import express from "express";
import path from "path";
const __dirname = path.resolve(); // built-in variable __dirname not available in ES6.

import cookieParser from "cookie-parser";
import logger from "morgan";

import passport from "passport";
import session from "express-session";

// connect-sqlite3 is a SQLite3 session store for Express.
// https://www.npmjs.com/package/connect-sqlite3
import oldSQLiteStore from "connect-sqlite3";
var SQLiteStore = oldSQLiteStore(session);

var app = express();
app.use(express.static(path.join(__dirname, "public")));

// Add session support to the app and then authenticate the session.
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: "sessions.db", dir: "./var/db" }),
    //    store: new_db,
  })
);
app.use(passport.authenticate("session"));

//app.use(express.json());  // This or body parser is required to parse data submitted from the client side in a post request.
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

// Routes
import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
app.use("/", indexRouter);
app.use("/", authRouter);

//app.locals.pluralize = require("pluralize");
import Pluralize from "pluralize";
app.locals.pluralize = Pluralize;

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
