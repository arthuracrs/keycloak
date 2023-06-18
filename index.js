const express = require('express');
const { Issuer, Strategy } = require('openid-client');
const passport = require('passport');
const expressSession = require('express-session');

const main = async () => {
    const app = express();

    const keycloakIssuer = await Issuer.discover('http://localhost:8080/realms/fit')
    // don't think I should be console.logging this but its only a demo app
    // nothing bad ever happens from following the docs :)
    console.log('Discovered issuer %s %O', keycloakIssuer.issuer, keycloakIssuer.metadata);

    const client = new keycloakIssuer.Client({
        client_id: 'api-node',
        client_secret: 'NHpU9z5Q8OJdIiw4efOT0E04zAzcFttR',
        redirect_uris: ['http://localhost:3000/auth/callback'],
        post_logout_redirect_uris: ['http://localhost:3000/logout/callback'],
        response_types: ['code'],
    });

    app.use(
        expressSession({
            secret: 'another_long_secret',
            resave: false,
            saveUninitialized: true,
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());
    
    passport.use('oidc', new Strategy({ client }, (tokenSet, userinfo, done) => {
        return done(null, tokenSet.claims());
    })
    )

    passport.serializeUser(function (user, done) {
        done(null, user);
    });
    passport.deserializeUser(function (user, done) {
        done(null, user);
    });

    // callback always routes to test 
    app.get('/auth/callback', (req, res, next) => {
        passport.authenticate('oidc', {
            successRedirect: '/protected',
            failureRedirect: '/'
        })(req, res, next);
    });

    // function to check weather user is authenticated, req.isAuthenticated is populated by password.js
    // use this function to protect all routes
    var checkAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next()
        }
        passport.authenticate('oidc')(req, res, next);
    }

    app.get('/protected', checkAuthenticated, (req, res) => {
        res.send('protected');
    });

    //unprotected route
    app.get('/public', function (req, res) {
        res.send('public');
    });

    // start logout request
    app.get('/logout', (req, res) => {
        res.redirect(client.endSessionUrl());
    });

    // logout callback
    app.get('/logout/callback', (req, res) => {
        // clears the persisted user from the local storage
        req.logout();
        // redirects the user to a public route
        res.redirect('/');
    });

    app.listen(3000, function () {
        console.log('Listening at http://localhost:3000');
    });
}

main()