var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var config = require('./config');
var VoteFactory = require('../lib/vote_factory');

module.exports = function(server, vote_factory) {

	var io = require('socket.io')(server);

	io.on('connection', function(socket) {

		console.log("New anonymous connection!");

		socket.on('test', function (data) {
			console.log("Working connection!");
			console.log(data);
		});

		socket.on('create_vote', function(event_id) {
			createVote(socket, event_id);
		});

		socket.on('disconnect', function(data) {
			console.log("Anonymous disconnection!");
		});

	});

}

function error(socket, msg, fatal) {
	socket.emit('error', msg);
}

function fatal_error(socket, msg) {
	socket.emit('fatal_error', msg);
}

function createVote(socket, event_id) {
	MongoClient.connect(config.mongo_url, function(err, client) {

		var db = client.db(config.mongo_name);

		if(err) {
			console.log(err);
			fatal_error(socket, "Internal server error");
			return;
		}

		

	});
}