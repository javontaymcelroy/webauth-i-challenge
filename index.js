// ================= DEPENDANCIES ================== //
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
var bcrypt = require('bcryptjs');
const server = express();
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

server.post('/api/register', (req, res) => {
  let user = req.body;

  const hash = (user.password = bcrypt.hashSync(user.password, 10));
  user.password = hash;

  users
    .add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

server.post('/api/post', (req, res) => {
  let { username, password } = req.body;

  User.findBy({ username })
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

server.get('/api/user', (req, res) => {
  users('users')
    .then(users => {
      res.status(200).json(users);
    })
    .catch(err => res.send(err));
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
