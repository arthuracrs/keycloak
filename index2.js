const express = require('express')
const app = express()
const port = 3000

const { auth, requiresAuth } = require('express-openid-connect');

const config = {
  authRequired: true,
  secret: 'NHpU9z5Q8OJdIiw4efOT0E04zAzcFttR',
  baseURL: 'http://localhost:3000',
  clientID: 'api-node',
  issuerBaseURL: 'http://localhost:8080/realms/fit'
};

// const config = {
//   authRequired: false,
//   auth0Logout: true,
//   secret: 'a long, randomly-generated string stored in env',
//   baseURL: 'http://localhost:3000',
//   clientID: 'u7eZuH1KIofDLeNXXoFjjsV2l0Qc4d7R',
//   issuerBaseURL: 'https://arthuracrs.us.auth0.com'
// };

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

app.get('/public', (req, res) => {
    res.send('public!')
})

app.get('/callback', (req, res) => {
    res.send('public!')
})

app.get('/protected', requiresAuth(), (req, res) => {
    res.send('protected fon!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})