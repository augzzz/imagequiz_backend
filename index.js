const express = require('express');
const cors = require('cors');
var passport = require('passport');
var LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);
const { store } = require('./data_access/store');

let backendURL = 'http://localhost:4002';
let frontEndURL = 'http://localhost:3000';
// let frontEndURL = 'https://augzzz.github.io';     

const application = express();
const port = process.env.PORT || 4002;


// MIDDLEWARE //
application.use(cors({
    origin: frontEndURL,
    credentials: true
}));


application.use(express.json());

application.use((request, response, next) => {

    console.log(`request url: ${request.url}`);
    console.log(`request method: ${request.method}`);
    // only 4 debugging. remove when submitting.
    console.log(`request body:`); //
    console.log(request.body); //
    next();
})

// verification 
passport.use(
    new LocalStrategy({ usernameField: 'email' }, function verify(username, password, cb) {
        store.login(username, password)
            .then(x => {
                if (x.valid) {
                    return cb(null, x.user);
                } else {
                    return cb(null, false, { message: 'Incorrect username or password.' });
                }
            })
            .catch(error => {
                console.log(error);
                cb('Soemthing went wrong...');
            });
    }));

// google authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${backendURL}/auth/google/callback`,
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        console.log('in Google strategy:');
        //console.log(profile);
        store.findOrCreateNonLocalCustomer(profile.displayName, profile.email, profile.id, profile.provider)
            .then(x => done(null, x))
            .catch(e => {
                console.log(e);
                return done('Something went wrong.');
            });

    }));

// session authentication
application.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: 'sessions.db', dir: './sessions' })
}));

application.use(passport.authenticate('session'));

// serialize / deserialize users
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
//

// METHODS //
application.get('/', (request, response) => {
    response.status(200).json({ done: true, message: 'Welcome to imagequiz_backend.' });
});

application.post('/register', (request, response) => {
    let name = request.body.name;
    let email = request.body.email;
    let password = request.body.password;

    store.addCustomer(name, email, password)
        .then(x => response.status(200).json({ done: true, message: 'Customer added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Customer was not added due to an error.' })
        });
});

application.post('/login', passport.authenticate('local', {
    successRedirect: '/login/succeeded',
    failureRedirect: '/login/failed'
}));

application.get('/login/succeeded', (request, response) => {
    response.status(200).json({ done: true, message: 'Customer logged in successfully.' });
});

application.get('/login/failed', (request, response) => {
    response.status(401).json({ done: false, message: 'Invalid credentials.' });
});

application.get('/auth/google',
    passport.authenticate('google', {
        scope:
            ['email', 'profile']
    }
    ));

application.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/google/failure'
    }));

application.get('/auth/google/success', (request, response) => {
    console.log('/auth/google/success');
    console.log(request.user);
    response.redirect(`${frontEndURL}/#/google/${request.user.username}/${request.user.name}`);
});

application.get('/auth/google/failure', (request, response) => {
    console.log('/auth/google/failure');
    response.redirect(`${frontEndURL}/#/google/failed`);
});

application.get('/isloggedin', (request, response) => {
    if (request.isAuthenticated()) {
        response.status(200).json({ done: true, result: true });
    } else {
        response.status(410).json({ done: false, result: false });
    }
});

application.post('/logout', (request, response) => {
    request.logout();
    response.json({ done: true, message: 'Customer signed out successfully.' })
});



application.get('/flowers', (request, response) => {
    store.getFlowers()
        .then(x => {
            if (x.done) {
                response.status(200).json({ done: true, result: x.result });
            } else {
                response.status(500).json({ done: false, message: result.message });
            }
        })
});

application.get('/quiz/:name', (request, response) => {
    if (!request.isAuthenticated()) {
        response.status(401).json({ done: false, message: 'Please log in first.' });
    }

    let name = request.params.name;

    store.getQuiz(name)
        .then(x => {
            if (x.id) {
                response.status(200).json({ done: true, result: x });
            } else {
                response.status(404).json({ done: false, message: result.message });
            }
        })
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Something went wrong...' });
        });
});



application.post('/score', (request, response) => {
    let quizTaker = request.body.quizTaker;
    let quizName = request.body.quizName;
    let score = request.body.score;
    let date = new Date();

    store.addScore(quizName, quizTaker, score, date)
        .then(x => response.status(200).json({ done: true, message: 'Score added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Score was not added due to an error.' })
        });
});


application.get('/scores/:quizTaker/:quizName', (request, response) => {
    let quizTaker = request.params.quizTaker;
    let quizName = request.params.quizName;

    store.getScore(quizTaker, quizName)
        .then(x => {
            if (x.done) {
                response.status(200).json({ done: true, result: x.result, message: result.message });
            } else {
                response.status(404).json({ done: false, message: result.message });
            }
        })
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Something went wrong...' });
        });
});







application.listen(port, () => {
    console.log(`Listening to port ${port} `);
});

//
//