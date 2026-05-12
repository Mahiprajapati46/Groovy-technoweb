const mongoose = require('mongoose');

/**
 * Connect to MongoDB and verify with { ping: 1 }.
 * @returns {Promise<import('mongoose').Connection>}
 */
async function connectMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri || !String(uri).trim()) {
        throw new Error(
            'MONGODB_URI is missing. Copy backend/.env.example to backend/.env and set your connection string.'
        );
    }

    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    await mongoose.connection.db.admin().command({ ping: 1 });
    return mongoose.connection;
}

module.exports = { connectMongo, mongoose };
