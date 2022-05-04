const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

let { quizzes } = require('../temp-store/data');

const connectionString =
    `postgres://kfolofaokafnjn:${process.env.PASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`

const connection = {
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: { rejectUnauthorized: false }
}

const pool = new Pool(connection);

let store = {

    addCustomer: (name, email, password) => {
        const hash = bcrypt.hashSync(password, 10);

        return pool.query(`INSERT INTO imagequiz.customer (name, email, password) VALUES ($1, $2, $3) `, [name, email, hash]);
    },

    findNonLocalCustomer: (email, provider) => {
        return pool.query('SELECT * FROM imagequiz.customer WHERE local = $1 AND email = $2 AND provider = $3', ['f', email, provider])
            .then(x => {
                if (x.rows.length == 1) {
                    return { found: true, user: { id: x.rows[0].id, username: x.rows[0].email, name: x.rows[0].name } };
                } else {
                    return { found: false };
                }
            })
    },

    findOrCreateNonLocalCustomer: async (name, email, password, provider) => {
        console.log('in findOrCreateNonLocalCustomer');
        console.log(name, email, password, provider);
        search = await store.findNonLocalCustomer(email, provider);
        if (search.found) {
            return search.user;
        }
        return pool.query('INSERT INTO imagequiz.customer (name, email, password, local, provider) VALUES ($1 , $2, $3, $4, $5)', [name, email, password, 'f', provider])
            .then(x => {
                return { done: true, user: { id: name, username: email, name: name } };
            });
    },

    login: (email, password) => {
        return pool.query('SELECT id, name, email, password FROM imagequiz.customer WHERE email = $1', [email])
            .then(x => {
                if (x.rows.length == 1) {
                    let valid = bcrypt.compareSync(password, x.rows[0].password);
                    if (valid) {
                        return { valid: true, user: { id: x.rows[0].name, username: x.rows[0].email } };
                    } else {
                        return { valid: false, message: 'Credentials are not valid.' };
                    }
                } else {
                    return { valid: false, message: 'Email not found.' };
                }
            });
    },

    getFlowers: () => {
        return pool.query(`SELECT * FROM imagequiz.flowers`)
            .then(x => {
                let flowers = [];
                if (x.rows.length > 0) {
                    flowers = x.rows.map(y => {
                        return { name: y.name, picture: y.picture }
                    })
                    return { done: true, result: flowers };
                } else {
                    return { done: false, message: 'No flowers were found.' };
                }
            })
    },

    getQuiz: (name) => {
        let query = `SELECT q.id AS quiz_id, q2.* FROM imagequiz.quiz q JOIN imagequiz.quiz_question qq ON q.id = qq.quiz_id 
            JOIN imagequiz.question q2 ON qq.question_id = q2.id 
            WHERE lower(q.name) = $1`;


        return pool.query(query, [name.toLowerCase()])
            .then(x => {
                console.log(x);
                let quiz = {};
                if (x.rows.length > 0) {
                    quiz = {
                        id: x.rows[0].quiz_id,
                        questions: x.rows.map(y => {
                            return { id: y.id, picture: y.picture, choices: y.choices, answer: y.answer }
                        })
                    };
                }
                return quiz;
            });
    },

    //
    addScore: (quizName, quizTaker, score) => {
        return pool.query(`INSERT INTO imagequiz.score (quiz_id, customer_id, score, date) VALUES ($1, $2, $3, $4)`, [quizName, quizTaker, score, '04/20/2022']);
    },
    //

    getScore: (quizTaker, quizName) => {
        let result = [];
        let query = `SELECT score FROM imagequiz.score WHERE quiz_id = $1 AND customer_id = $2`;

        return pool.query(query, [quizName, quizTaker])
            .then(x => {
                if (x.rows.length > 0) {
                    for (var i = 0; i < x.rows.length; i++) {
                        result.push(x.rows[i].score)
                    }
                    return { done: true, result: result };
                } else {
                    return { done: false, message: 'No score was found for this quiz taker for the specified quiz' };
                }
            })
    }
}

module.exports = { store }; 