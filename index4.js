const express = require('express');
const passport = require('passport');
const OpenIDStrategy = require('passport-openid').Strategy;
const session = require('express-session');

const baseAuthURL = "http://localhost:8080"

// Configure Passport with OpenID strategy
passport.use(new OpenIDStrategy({
    returnURL: 'http://localhost:3000/auth/openid/callback',
    realm: 'fit',
    providerURL: baseAuthURL ,
    stateless: true
},
    function (identifier, done) {
        // You can perform any necessary user lookup and validation here
        // For simplicity, we'll just return the identifier as the user
        return done(null, identifier);
    }
));

// Express setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure express-session middleware
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Serialize and deserialize user
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Routes
app.get('/', (req, res) => {
  res.send('Hello, welcome to the API!');
});

app.get('/auth/openid', passport.authenticate('openid'));

app.get('/auth/openid/callback',
  passport.authenticate('openid', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/user');
  }
);

app.get('/user', (req, res) => {
  if (req.user) {
    res.send(`Logged in user: ${req.user}`);
  } else {
    res.send('Not logged in');
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
