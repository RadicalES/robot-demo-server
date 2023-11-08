const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const corsOptions = require('./config/corsOptions');
const simLatency = require('express-simulate-latency');
const simLag = simLatency({ min: 500, max: 1000});
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/server.json');
const PORT = config.server.port || process.env.PORT || 3500;
const IPADDRESS = config.server.ipAddress || 'localhost';

// custom middleware logger
app.use(logger);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// To parse URL encoded data
app.use(bodyParser.urlencoded({ extended: false }));

// To parse json data
app.use(bodyParser.json());

// To parse cookies
app.use(cookieParser());

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json 
app.use(express.json());

// simulate network latency
app.use(simLag);

//serve static files
app.use('/', express.static(path.join(__dirname, '/public')));

// routes
app.use('/', require('./routes/root'));
app.use('/api/robots/', require('./routes/api/robots'));

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
      res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
      res.json({ "error": "404 Not Found" });
  } else {
      res.type('txt').send("404 Not Found");
  }
});

app.use(errorHandler);

app.listen(PORT, IPADDRESS, () => console.log(`Server running on port ${PORT} @ ${IPADDRESS}`));