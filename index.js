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
//

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
            response.status(500).json({ done: false, message: 'Something went wrong...' })
        });
})

application.post('/score', (request, response) => {
    let quizTaker = request.body.quizTaker;
    let quizName = request.body.quizName;
    let score = request.body.score;
    let date = request.body.date;

    store.addScore(quizTaker, quizName, score, date);
    response.status(200).json({ done: true, message: 'Score added successfully' });
})

application.get('/scores/:quiztaker/:quizname', (request, response) => {
    let quizTaker = request.params.quiztaker;
    let quizName = request.params.quizname;
    let result = store.getScore(quizTaker, quizName);

    if (result.done) {
        response.status(200).json({ done: true, result: result.result, message: 'Score(s) returned successfully.' });
    } else {
        response.status(404).json({ done: false, message: result.message });
    }
})

application.listen(port, () => {
    console.log(`Listening to port ${port} `);
})