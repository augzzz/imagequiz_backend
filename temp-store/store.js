const bcrypt = require('bcrypt');
const { hash } = require('bcrypt');
let { customers } = require('./customers');
let { quizzes } = require('./data');
let { scores } = require('./scores');

let store = {

    addCustomer: (name, email, password) => {
        const hash = bcrypt.hashSync(password, 10);
        customers.push( {id: 1, name: name, email: email, password: hash} );
    }, 

    login: (email, password) => {
        let customer = customers.find(x => x.email.toLowerCase() === email.toLowerCase());
        if (customer) {
            let valid = bcrypt.compareSync(password, customer.password);
            if (valid) {
                return { valid: true };
            } else {
                return { valid: false, message: 'Credentials are not valid.' }
            }
        } else {
            return { valid: false, message: 'Email not found.' }
        }
    },

    getQuiz: (id) => {
        let quiz = quizzes.find( x => x.name.toLowerCase() === id.toLowerCase() );
        if (quiz) {
            return { done: true, quiz };
        } else {
            return { done: false, message: 'No quiz with this name was not found.' };
        }
    },

    addScore: (name, id, score, date) => {
        scores.push( {quizTaker: name, quizName: id, score: score, date: date} );
    },

    getScore: (name, id) => {
        let scoreEntry = scores.find( x => x.quizTaker.toLowerCase() === name.toLowerCase() && x.quizName.toLowerCase() === id.toLowerCase() );
        if (scoreEntry) {
            return { done: true, scoreEntry };
        } else {
             return { done: false, message: 'No score was found for this quiz taker for the specified quiz' };
        } 
    }
}

module.exports = { store }; 