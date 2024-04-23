const mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var config = require('../app/config');

let client;
let connectionPromise;

function connectDatabase() {
  if (connectionPromise) {
    return Promise.reject(new Error('The database was already connected'));
  }

  client = new MongoClient(
    config.mongo_url,
    { useNewUrlParser: true, useUnifiedTopology: true },
  );

  connectionPromise = client.connect()
    .then(() => client.db(config.mongo_name));

  return connectionPromise;
}

connectDatabase();

function getDatabase() {
	if (!connectionPromise) {
	  callback(new Error('The database is not connected'));
	}
  
	return connectionPromise;
}

module.exports = getDatabase;
