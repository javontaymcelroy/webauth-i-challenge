// ================= DEPENDANCIES ================== //
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const server = express();
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const configuredKnex = require('./data/dbConfig.js');
// ================= IMPORTS ================== //
const users = require('./data/dbConfig.js');
// ================= USES ================== //
server.use(helmet());
server.use(express.json());
server.use(cors());
// ================= ENDPOINTS ================== //
server.get('/', (req, res) => {
  res.send('Server is active.');
});

const sessionConfig = {
  name: 'configuration',
  secret: 'Everyone has secrets. So whats yours? Girl on fire...',
  cookie: {
    maxAge: 1000 * 60 * 10,
    secure: false,
    httpOnly: true
  },
  resave: false,
  saveUninitialized: false,
  store: new KnexSessionStore({
    knex: configuredKnex,
    tablename: 'sessions',
    sidfieldname: 'sid',
    createtable: true,
    clearInterval: 1000 * 60 * 30
  })
};

server.post('/api/register', (req, res) => {
  let user = req.body;

  const hash = (user.password = bcrypt.hashSync(user.password, 10));
  user.password = hash;

  users('users')
    .insert(req.body)
    .then(ids => {
      const id = ids[0];
      users('users')
        .where({ id })
        .first()
        .then(user => {
          res.status(200).json(user);
        });
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post('/api/login', (req, res) => {
  let { username, password } = req.body;

  users('users')
    .where({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({ message: `Hello ${user.username}` });
      } else {
        res
          .status(401)
          .json({ message: 'Sorry, we could not find you in our systems' });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.get('/logout', (req, res) => {
  if (req.sesion) {
    req.session.destroy(err => {
      if (err) {
        res.status(500).json({ message: 'there was a problem.' });
      } else {
        res.status(200).json({ message: 'bye, thanks for coming!' });
      }
    });
  } else {
    res.status(200).json({ message: 'bye, thanks for coming!' });
  }
});

server.get('/api/user', restricted, (req, res) => {
  users('users')
    .then(users => {
      res.status(200).json(users);
    })
    .catch(err => res.send(err));
});

function restricted(req, res, next) {
  const { username, password } = req.headers;

  if (username && password) {
    users('users')
      .where({ username })
      .first()
      .then(user => {
        if (user && bcrypt.compareSync(password, user.password)) {
          next();
        } else {
          res.status(401).json({ message: 'Wrong creds' });
        }
      })
      .catch(error => {
        res.status(500).json(error);
      });
  } else {
    res.status(401).json({ message: 'Please enter some creds, please!' });
  }
}

server.use(session(sessionConfig));
const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
