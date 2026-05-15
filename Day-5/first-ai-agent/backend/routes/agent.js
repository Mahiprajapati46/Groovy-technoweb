// Import necessary modules
const express = require('express');
const router = express.Router();

// Define routes for the agent
router.get('/', (req, res) => {
  res.send('Agent Route');
});

// Export the router
module.exports = router;