const express = require('express');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

const router = express.Router();

router.use('/api', (req, res, next) => {
  next();
});

router.get('/api', (req, res) => {
  res.status(200).send({ message: 'Resource retrieved successfully' });
});

router.post('/api', (req, res) => {
  res.status(201).send({ message: 'Resource created successfully' });
});

router.use((req, res) => {
  res.status(404).send({ message: 'Not Found' });
});

module.exports = router;