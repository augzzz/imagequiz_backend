const express = require('express');
const { store } = require('./temp-store/store');

const application = express();
const port = process.env.PORT || 4002;

// middleware
application.use(express.json());
//

application.get('/', (request, response) => {
    response.status(200).json( { done: true, message: 'All good.' } );
})

application.post('/register', (request, response) => {
    let name = request.body.name;
    let email = request.body.email;
    let password = request.body.password;

    store.addCustomer(name, email, password);
    response.status(200).json( { done: true, message: 'Customer added successfully.' } );
})

application.post('/login', (request, response) => {
    let email = request.body.email;
    let password = request.body.password;
    let result = store.login(email, password);
    if (result.valid) {
        response.status(200).json( {done: true, message: 'Customer logged in successfully.'} );
    } else {
        response.status(401).json( {done: false, message: result.message} );
    }
})

application.get('/quiz/:id', (request, response) => {
    let id = request.params.id;
    let result = store.getQuiz(id);
    if (result.done) {
        response.status(200).json( {done: true, result: result.quiz} );
    } else {
        response.status(404).json( {done: false, message: result.message} );
    }
})

application.listen(port, () => {
    console.log(`Listening to port ${port} `);
})