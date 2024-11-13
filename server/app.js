'use strict';
const config = require('./config');
const express = require('express');
const session = require('cookie-session');
const passport = require('passport');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const serviceAccount = config.getServiceAccount(process.env.ENV);

// Initialize firebase
admin.initializeApp(serviceAccount);

const app = express();
app.set('trust proxy', true);

// Set up the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Enable sessions using encrypted cookies
app.use(cookieParser(config.secret));
app.use(
  session({
    cookie: {maxAge: 60000},
    secret: config.secret,
    signed: true,
    resave: true,
  })
);

// Set up flash messages
app.use(flash());

// Set up useful middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport and restore any existing authentication state
app.use(passport.initialize());
app.use(passport.session());

// routes for vendor signup
app.use('/vendors', require('./routes/vendor'));
app.use('/vendors/stripe', require('./routes/stripe'));
app.use('/api/settings', require('./routes/api/settings'));


// Index page
app.get('/', (req, res) => {
  res.render('index');
});

// Respond to the Google Cloud health check
app.get('/_ah/health', (req, res) => {
  res.type('text').send('ok');
});

// Catch 404 errors and forward to error handler
app.use((req, res, next) => {
  res.status(404).render('404');
});

// Development error handler: will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}

// Production error handler: no stacktraces will be leaked to user
app.use((err, req, res) => {
  console.log(err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

// Start the server on the correct port
const server = app.listen(config.port, () => {
  console.log('Vendor console server started:', config.publicDomain);
});
