var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var config = require('./config');
var tools = require('../lib/api-tools');

module.exports = function(server, ticket_factory, vote_factory) {

	var io = require('socket.io')(server);

	io.on('connection', function(socket) {

		console.log("New anonymous connection!");

		socket.on('test', function (data) {
			console.log("Working connection!");
			console.log(data);
		});

		socket.on('create_vote', function(user_id, ticket, event_id) {
			createVote(user_id, ticket, event_id, function(new_vote) {
				console.log(new_vote.event.characters.length);
				socket.emit('create_vote_response', new_vote.id, new_vote.characters_left, new_vote.event.characters.length);
			});
		});

		socket.on('introduce_code', function(code) {
			if(!vote_factory.addGuest(socket, code)) {
				error("The code does not exist");
			}
		});

		socket.on('disconnect', function(data) {
			
			// TODO

		});

		function error(msg) {
			socket.emit('app_error', msg);
		}

		function fatal_error(msg) {
			socket.emit('app_fatal_error', msg);
			socket.disconnect();
		}

		function createVote(user_id, ticket, event_id, cb) {

			authenticateWithTicket(user_id, ticket, function(db, client, user_found) {

				var event = tools.searchEvent(user_found, event_id);

				if(!event) {
					error("Could not find event " + event_id);
					return;
				}

				var new_vote = vote_factory.newVote(event, user_found, ticket, socket);
				if(!new_vote) {
					error("Could not create new vote for event " + event_id);
					return;	
				}

				if(cb) cb(new_vote);

			});

		}

		function authenticateWithTicket(user_id, ticket, success_cb, error_cb) {

			ticket = ticket_factory.get_ticket(ticket);

			if(!ticket) {
				fatal_error("Ticket given is not valid or has expired");
				return;
			}

			var object_id;
			try {
				object_id = new mongo.ObjectId(user_id);
			} catch (err) {
				fatal_error("The user id is not valid");
				return;
			}

			MongoClient.connect(config.mongo_url, function(err, client) {

				if(err) {
					console.log(err);
					fatal_error("Database broken. Please, contact the administrator or try it later.");
					if(error_cb) error_cb();
					return;		
				}		

				var db = client.db(config.mongo_name);

				db.collection('users').findOne({_id: object_id}, function(err, user_found) {
					if(err) {
						console.log(err);
						fatal_error("Database broken. Please, contact the administrator or try it later.");
						client.close();
						if(error_cb) error_cb();
						return;		
					}

					if(!user_found) {
						fatal_error("User given does not exist");
						client.close();
						if(error_cb) error_cb();
						return;
					}

					if(ticket.name !== user_found.name) {
						fatal_error("Ticket given is not valid or has expired");
						client.close();
						if(error_cb) error_cb();
						return;
					}

					if(success_cb) success_cb(db, client, user_found);
					else {
						console.log("Successful authentication. Did you forget to add a callback?")
						responses.ok(response);
						client.close();
					}

				});

			});

		}

	});

}