require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const knex = require('knex');
const {clarifaiRequest} = require('./api-clarifai')
const { json } = require('express');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Config knex for connect to Database

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : process.env.TOKEN_PASSWORD,
      database : 'faceai'
    }
});


app.get('/', (req, resp) => {
    resp.send('Im working');
})

app.post('/signin', (req, resp) => {
    const {email, password} = req.body; 

    if(!email || !password) return resp.status(400).json('do not correct signin');


    db.select('email', 'hash').from('login')
        .where('email', '=', email)
        .then(data => { 
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if(!isValid) return resp.status(400).json('wrong credential')

            db.select('*').from('users').where('email', '=', email)
            .then(user => resp.json(user[0]))
            .catch(err => resp.status(400).json('Unable to get user'))
        })
        .catch(err => resp.status(400).json('wrong credential'))

})


// Have new register

app.post('/register', (req, resp) => {
    const {email, name, password} = req.body;

    if(!email || !name || !password) return resp.status(400).json('unable to register');


    const hash = bcrypt.hashSync(password, 8);


    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                name: name,
                email: loginEmail[0].email,
                joined: new Date()
            })
            .then(user => resp.json(user[0])) 
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => resp.status(400).json('unable to register'))
});




app.get('/profile/:id', (req, resp) => {
    const {id} = req.params;

    db.select('*').from("users").where({id: id})
    .then(user => {
        if(!user.length) return resp.status(400).json('not found');

        resp.json(user[0]);
    })    


})


app.put('/image', (req, resp) => {
    const {id} = req.body;

    if(!id.toString()) return resp.json('Unable to get count');

    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries =>{
         resp.json(entries[0].entries)
    })
    .catch(err => resp.status(400).json('unable to get count'))
})



app.post('/clarifai', (req, resp) => clarifaiRequest(req, resp))



app.post('/checkUser', (req, resp) => {
    const {id, email, name} = req.body;

    if(!email || !name) return resp.json('do no correct register');

    db.select('email', "id", 'name').from('users')
    .where('email', '=', email)
    .then(data => {
        if(data[0].id !== id || data[0].name !== name) return resp.json('Wrong credential');
        resp.json('success');
    })
    .catch(err => resp.status(400).json('Wrong credential'))
})


app.listen(port, () => {
    console.log("Listen local host");
})