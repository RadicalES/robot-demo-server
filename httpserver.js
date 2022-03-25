/* (C) 2020 Radical Electronic Systems CC */

// importing setup
const config = require("./config.json");

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var simLatency = require('express-simulate-latency');
var simLag = simLatency({ min: 500, max: 1000});
var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(simLag);


// Require our routes into the application.
require('./robots')(app, config);

app.listen(config.server.port, () => {
    console.log("Server is listening on port: " + config.server.port);
});