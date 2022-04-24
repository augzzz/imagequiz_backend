const express = require('express');
const cors = require('cors');

var passport = require('passport');
var LocalStrategy = require('passport-local');
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);

const { store } = require('./data_access/store');

const application = express();
const port = process.env.PORT || 4002;

// MIDDLEWARE
//
application.use(express.json());
application.use(cors());

application.use((request, response, next) => {
    console.log(`request url: ${request.url}`);
    console.log(`request method: ${request.method}`);
    // only 4 debugging. remove when submitting.
    console.log(`request body:`); //
    console.log(request.body); //
    next();
})

// verification 
passport.use(new LocalStrategy({ usernameField: 'email' }, function verify(username, password, cb) {
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
//

// METHODS
//
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




application.get('/flowers', (request, response) => {
    let flowers = store.getFlowers();

    if (flowers) {
        response.status(200).json({ done: true, result: flowers, message: 'Returned flowers list successfully' });
    } else {
        response.status(404).json({ done: false, message: 'Flowers not found.' });
    }
})



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
})



application.get('/scores/:quizTaker/:quizName', (request, response) => {
    let quizTaker = request.params.quizTaker;
    let quizName = request.params.quizName;

    store.getScore(quizTaker, quizName)
        .then(x => {
            if (x.done) {
                response.status(200).json({ done: true, result: x.result, message: 'Score(s) returned successfully.' });
            } else {
                response.status(404).json({ done: false, message: result.message });
            }
        })
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Something went wrong...' });
        });
})



application.post('/score', (request, response) => {
    let quizTaker = request.body.quizTaker;
    let quizName = request.body.quizName;
    let score = request.body.score;

    store.addScore(quizName, quizTaker, score)
        .then(x => response.status(200).json({ done: true, message: 'Score added successfully.' }))
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Score was not added due to an error.' })
        });
})






application.listen(port, () => {
    console.log(`Listening to port ${port} `);
})

//
//