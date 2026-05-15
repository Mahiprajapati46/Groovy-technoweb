const express = require('express');

const app = express();

const router = express.Router();

router.get('/api', (req, res) => {
  res.status(200).send({ message: 'Resource retrieved successfully' });
});

router.post('/api', (req, res) => {
  res.status(201).send({ message: 'Resource created successfully' });
});

router.use((err, req, res, next) => {
  res.status(500).send({ message: 'Internal Server Error' });
});

module.exports = router;