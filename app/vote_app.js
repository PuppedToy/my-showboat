var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var config = require('./config');
var tools = require('../lib/api-tools');

module.exports = function(server, ticket_factory, vote_factory) {

	var io = require('socket.io')(server);

	io.on('connection', function(socket) {

		console.log("New anonymous connection!");

		var my_vote = null, my_guest = null;
		var my_hosted_vote = null;

		socket.on('create_vote', function(user_id, ticket, event_id) {
			createVote(user_id, ticket, event_id, function(new_vote) {
				socket.emit('create_vote_response', new_vote.id, new_vote.characters_left, new_vote.event.characters.length);
				my_hosted_vote = new_vote;
				console.log("A new vote with id \"" + new_vote.id + "\" has been created!");
			});
		});

		socket.on('introduce_code', function(code) {
			let {vote, guest} = vote_factory.addGuest(socket, code);
			if(!vote) {
				error("The code does not exist");
			}
			else {
				my_vote = vote;
				my_guest = guest;
				socket.emit('successful_introduce_code', my_vote.id, my_vote.characters_left, my_vote.event.characters);
				console.log("New guest " + guest.id + " has connected to vote " + vote.id);
			}
		});

		socket.on('select_characters', function(selected_characters) {

			if (vote_factory.associateCharacters(my_vote.id, my_guest.id, selected_characters)) {
				socket.emit('successful_select_characters');
			} else {
				error("An error has ocurred. Please, repeat the step");
			}

			my_vote.broadcast_guests(my_guest, 'refresh', my_vote.characters_left);

		});

		socket.on('send_vote', function(character_id, votes) {

			console.log("Guest " + my_guest.id + " has voted as character " + character_id + " with votes:");
			console.log(votes);
			if(my_vote.addVote(character_id, votes)) {
				socket.emit('successful_send_vote');
				my_vote.emit_host('refresh', my_vote.characters_left, my_vote.event.characters.length);
			}
			else fatal_error('Internal error when processing your vote.');

		});

		socket.on('disconnect', function(data) {
			
			if(my_hosted_vote) {
				my_hosted_vote.socket = null;
				console.log("The host of vote " + my_hosted_vote.id + " has disconnected!");
				console.log("WARNING: If it does not reconnect in one hour, the vote will be deleted");
				my_hosted_vote.timer = setTimeout(function() {
					if(my_hosted_vote.host == null) {
						my_hosted_vote.broadcast_guests(null, 'app_fatal_error', "The vote has been deleted");
					}
				}, 3600);
			} else if(my_vote && my_guest) {
				my_vote.deleteGuest(my_guest);
				my_vote.broadcast_guests(null, 'refresh', my_vote.characters_left);
				console.log("Guest " + my_guest.id + " has disconnected from vote " + my_vote.id);
			} else if(my_vote) {
				console.log("Someone has disconnected from vote " + my_vote.id);
				console.log("WARNING: This disconnection should have been identified. BUG?");
			} else if(my_guest) {
				console.log("Guest " + my_guest.id + " has disconnected from some vote");
				console.log("WARNING: This disconnection should have been identified. BUG?");
			} else {
				console.log("An anonymous user has disconnected");
			}

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

				var new_vote = vote_factory.newVote(event, user_found, ticket_factory.get_ticket(ticket), socket);
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