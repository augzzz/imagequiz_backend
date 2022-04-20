const express = require('express');
const { store } = require('./data_access/store');
const { flowers } = require('./temp-store/flowers');
const { response } = require('express');
const cors = require('cors');

const application = express();
const port = process.env.PORT || 4002;

// middleware
application.use(express.json());
application.use(cors());

application.use( (request, response, next) => {
    console.log(`request url: ${request.url}`);
    console.log(`request method: ${request.method}`);
    // only 4 debugging. remove when submitting.
    console.log(`request body:`); //
    console.log(request.body); //
    next();
})
//

// methods
application.get('/', (request, response) => {
    response.status(200).json({ done: true, message: 'Welcome to imagequiz_backend.' });
})

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
})

application.post('/login', (request, response) => {
    let email = request.body.email;
    let password = request.body.password;

    store.login(email, password)
        .then(x => {
            if (x.valid) {
                response.status(200).json({ done: true, message: 'Customer logged in successfully.' });
            } else {
                response.status(401).json({ done: false, message: x.message });
            }
        })
        .catch(error => {
            console.log(error);
            response.status(500).json({ done: false, message: 'Something went wrong...' })
        });
})

application.get('/flowers', (request, response) => {
    let result = flowers;
    if (result) {
        response.status(200).json({ done: true, result: flowers, message: 'Returned flowers list successfully' });
    } else {
        response.status(404).json({ done: false, message: 'Flowers not found.' });
    }
})

application.get('/quiz/:name', (request, response) => {
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

application.listen(port, () => {
    console.log(`Listening to port ${port} `);
})