const express = require('express');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

const router = express.Router('/api');

router.get('/', (req, res) => {
  try {
    res.status(200).send({ message: 'GET method implemented' });
  } catch (error) {
    logger.error('Error handling GET request: %s', error);
    res.status(500).send({ error: 'Internal Server Error', message: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    res.status(201).send({ message: 'POST method implemented' });
  } catch (error) {
    logger.error('Error handling POST request: %s', error);
    res.status(500).send({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;