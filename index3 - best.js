const express = require('express')
const { Issuer } = require('openid-client');
const session = require('express-session');

const app = express()
const port = 3000

app.use(session({
    secret: 'your-secret',
    resave: false,
    saveUninitialized: false,
}));

const main = async () => {
    const baseAuthURL = "http://localhost:8080"
    const baseApiUrl = "http://localhost:3000"

    const issuer = await Issuer.discover(baseAuthURL + '/realms/fit')

    const client = new issuer.Client({
        client_id: 'api-node',
        client_secret: 'NHpU9z5Q8OJdIiw4efOT0E04zAzcFttR',
        redirect_uris: [baseApiUrl + '/callback'],
    });

    const authorizationUrl = client.authorizationUrl({
        redirect_uri: baseApiUrl + '/callback',
        scope: 'openid',
    });

    const authenticateMiddleware = (req, res, next) => {
        if (!req.session.accessToken) {
            // User is not authenticated, redirect to Keycloak login
            req.session.redirectTo = req.originalUrl; // Store the originally requested URL
            res.redirect(authorizationUrl);
            return;
        }

        // Verify the access token using the client object created previously
        client.introspect(req.session.accessToken)
            .then((result) => {
                if (result.active) {
                    // User is authenticated, proceed to the next middleware or route handler
                    next();
                } else {
                    // Token is invalid, redirect to Keycloak login
                    req.session.redirectTo = req.originalUrl; // Store the originally requested URL
                    res.redirect(authorizationUrl);
                }
            })
            .catch((error) => {
                console.error('Error occurred during token introspection', error);
                res.status(500).send('Internal Server Error');
            });
    };

    app.get('/', authenticateMiddleware, async (req, res) => {
        const userInfo = await client.userinfo(req.session.accessToken)
        res.send(JSON.stringify(userInfo));
    });

    app.get('/public', (req, res) => {
        res.send('public!')
    })

    // Assuming you are using Express.js
    app.get('/callback', (req, res) => {
        const params = client.callbackParams(req);

        client.callback(baseApiUrl + '/callback', params, {})
            .then((tokenSet) => {
                // Store the access token in the session
                req.session.accessToken = tokenSet?.access_token;

                // Redirect the user to the originally requested route (stored in session or a default route)
                const redirectTo = req.session?.redirectTo || '/default-route';
                delete req.session?.redirectTo;
                res.redirect(redirectTo);
            })
            .catch((error) => {
                console.error('Error occurred during authentication callback', error);
                res.status(500).send('Internal Server Error');
            });
    });

    app.get('/protected', authenticateMiddleware, (req, res) => {
        res.send('protected fon!')
    })

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}
console.clear()
main()