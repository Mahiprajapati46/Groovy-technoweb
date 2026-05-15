const express = require('express');

const router = express.Router();

router.get('/api', (req, res) => {
  res.status(200).send({ message: 'Resource retrieved successfully' });
});

router.post('/api', (req, res) => {
  res.status(201).send({ message: 'Resource created successfully' });
});

module.exports = router;