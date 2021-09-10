/**
 * Module dependencies.
 */
const express = require('express'),
  path = require('path'),
  fs = require('fs'),
  http = require('http'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  compression = require('compression'),
  cors = require('cors'),
  glob = require('glob'),
  healthcheck = require('healthcheck-middleware'),
  hbs = require('express-hbs'),
  logger = require('./api/core/logger'),
  morgan = require('morgan'),
  _ = require('lodash'),
  mailer = require(path.resolve('./api/core/mailer')),
  errorController = require(path.resolve('./api/core/errors.controller')),
  config = require(path.resolve('./config'))
  broker = require('./api/broker');

const app = express();

/**
 * Healthcheck API
 */
app.use('/api/health', healthcheck());

app.use(cookieParser());
// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false,
  verify: function (req, res, buf) {
    if (req.headers['hmac']) {
      req.rawBody = buf;
    }
  }
}));

// Should be placed before express.static
app.use(compression({
  filter: function (req, res) {
    return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
  },
  level: 9
}));

app.engine('html', hbs.express4({
  extname: '.html'
}));
app.set('view engine', '.html');
app.set('views', path.resolve('./api/'));

const indexHtmlPath = path.join(__dirname, 'dist/index.html');
const serveIndex = (req, res) => {
  res.sendFile(indexHtmlPath);
}

app.get('/', serveIndex);

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'static')));

if (process.env.ENABLE_CORS) {
  app.use(cors({
    credentials: true
  }));
}

// Use native promises
mongoose.Promise = global.Promise;

// Load models
const models = glob.sync(__dirname + '/api/**/*.model.js');
models.forEach((model) => {
  require(path.resolve(model));
});


// Set our api routes
const routes = glob.sync(__dirname + '/api/**/*.routes.js');
routes.forEach((route) => {
  require(route)(app);
});

const telegramBot = require('./api/telegram/bot');


app.get('/api', (req, res) => {
  res.json({
    service: "Users service Updated",
    time: new Date()
  })
})

// Catch all other routes and return the index file
app.get(/^\/(?!api).*/, serveIndex);


app.get('*', errorController.error404);


/**
 * Get port from environment and store in Express.
 */
const port = config.port;
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);
const interServer = http.createServer(app);

/**
 * Expose
 */

module.exports = app;

const listen = () => {
  server.listen(port, () => {
    logger.debug(`
    ------------
      Users Service Started!
      Express: http://localhost:${ port}
      Environment: ${ config.environment}
    ------------
  `);
  });
  interServer.listen(3443, () => {
    logger.debug(`
    ------------
      InterCommunication Users Service Started!
      Express: http://localhost:3443
      Environment: ${ config.environment}
    ------------
  `);
  });

  // init bot
  if (process.env.NODE_ENV === 'production') {
    telegramBot.init();
  }

}

const connect = () => {
  var options = config.db.options || {
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    bufferMaxEntries: 0,
    useNewUrlParser: true
  };
  var dbUri = config.db.uri;

  return mongoose.connect(dbUri, options, function (error) {
    if (error) {
      return logger.error('[DB Connect]', error);
    }
    listen();
    // Check error in initial connection. There is no 2nd param to the callback.
  });
}


mailer.init();
/**
 * Connect to Database and only then run app
 */
connect();

broker.start();
