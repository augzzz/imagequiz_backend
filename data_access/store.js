const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();
let { quizzes } = require('../temp-store/data');

const connectionString =
    `postgres://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`

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

    login: (email, password) => {
        return pool.query('SELECT name, email, password FROM imagequiz.customer WHERE email = $1', [email])
            .then(x => {
                if (x.rows.length == 1) {
                    let valid = bcrypt.compareSync(password, x.rows[0].password);
                    if (valid) {
                        return { valid: true };
                    } else {
                        return { valid: false, message: 'Credentials are not valid.' };
                    }
                } else {
                    return { valid: false, message: 'Email not found.' };
                }
            });
    },

    getQuiz: (name) => {
        let query = ` select q.id as quiz_id, q2.* from imagequiz.quiz q join imagequiz.quiz_question qq on q.id = qq.quiz_id 
            join imagequiz.question q2 on qq.question_id = q2.id
            where lower(q.name) = $1 `;

        return pool.query(query, [name.toLowerCase()])
            .then(x => {
                //console.log(x);
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

    addScore: (quizName, quizTaker, score) => {
        return pool.query(`INSERT INTO imagequiz.score (quiz_id, customer_id, score, date) VALUES ($1, $2, $3, $4) `, [quizName, quizTaker, score, '04/20/2022']);
    },

    getScore: (quizTaker, quizName) => {
        let result = [];
        let query = `select score from imagequiz.score where quiz_id = $1 and customer_id = $2`;

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