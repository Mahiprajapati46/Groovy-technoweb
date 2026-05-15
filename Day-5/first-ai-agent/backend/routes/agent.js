// Import the agent object from another module
const httpAgent = require('./agent');

// Define the httpAgent object
const httpAgent = {
  get: (req, res) => {
    // Implement the get method
    res.send('GET method implemented');
  },
  post: (req, res) => {
    // Implement the post method
    res.send('POST method implemented');
  },
  put: (req, res) => {
    // Implement the put method
    res.send('PUT method implemented');
  },
  delete: (req, res) => {
    // Implement the delete method
    res.send('DELETE method implemented');
  },
  patch: (req, res) => {
    // Implement the patch method
    res.send('PATCH method implemented');
  },
  head: (req, res) => {
    // Implement the head method
    res.send('HEAD method implemented');
  },
  options: (req, res) => {
    // Implement the options method
    res.send('OPTIONS method implemented');
  },
  trace: (req, res) => {
    // Implement the trace method
    res.send('TRACE method implemented');
  },
};

// Remove the unnecessary methods
delete httpAgent.disconnect;
delete httpAgent.close;
delete httpAgent.pause;
delete httpAgent.resume;
delete httpAgent.cancel;
delete httpAgent.retry;
delete httpAgent.timeout;

// Export the httpAgent object
module.exports = httpAgent;