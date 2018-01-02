var fs = require('fs');
const path = require('path');
var base_url;
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var config = require('./config');
var responses = require('../lib/api-responses');
var tools = require('../lib/api-tools');
var md5 = require('md5');
var TicketFactory = require('../lib/ticket-factory');
var ticket_factory = new TicketFactory();

function Controller(url) {

	base_url = url;

};


Controller.prototype.index = function(request, response) {

	response.sendFile( path.join( base_url, 'public', 'index.html' ) );

}

Controller.prototype.login = function(request, response) {

	response.sendFile( path.join( base_url, 'public', 'login.html'));

}

Controller.prototype.event_list = function(request, response) {

	response.sendFile( path.join( base_url, 'public', 'event_list.html'));

}

Controller.prototype.get_userlist = function(request, response) {
	
	
	MongoClient.connect(config.mongo_url, function(err, client) {

		var db = client.db(config.mongo_name);

		if(err) {
			console.log(err);
			responses.database_error(response);
			return;
		}

		db.collection('users').find().toArray(function (err, users) {

			if(err) {
				console.log(err);
				responses.database_error(response);
				return;
			}

			var result = [];

			users.forEach(function(user) {
				result.push({
					name: user.name,
					uri: tools.get_full_uri(request) + "/" + user._id 
				});
			});

			responses.ok(response, result);

		});

	});
	
}

Controller.prototype.create_user = function(request, response) {

	var user = request.body;

	if(!user.name) {
		responses.bad_request(response, "Username is empty");
		return;
	}

	if(user.name.length < 3) {
		responses.bad_request(response, "Username must be greater than 2 characters");
		return;
	}

	if(user.name.length > 20) {
		responses.bad_request(response, "Username can't be greater than 20 characters");
		return;
	}

	if(!user.password) {
		responses.bad_request(response, "Password is empty");
		return;
	}

	if(user.password.length < 8) {
		responses.bad_request(response, "Password must be greater than 7 characters");
		return;
	}

	if(user.password.length > 20) {
		responses.bad_request(response, "Password can't be greater than 20 characters");
		return;
	}

	if(user.email && !tools.validate_email(user.email)) {
		responses.bad_request(response, "Email address is not valid");
		return;
	}

	MongoClient.connect(config.mongo_url, function(err, client) {

		var db = client.db(config.mongo_name);

		if(err) {
			console.log(err);
			responses.database_error(response);
			return;
		}

		db.collection('users').findOne({name: user.name}, function(err, entry) {
			if(entry != null) {
				responses.conflict(response, "Username already taken");
				return;
			}

			var instered_object = {
				name: user.name,
				password: md5(user.password)
			}

			if(user.email) instered_object.email = user.email;

			db.collection('users').insertOne(instered_object, function(err) {
				if(err) {
					console.log(err);
					responses.database_error(response);
					return;
				}

				var ticket = ticket_factory.add_ticket(user.name);
				responses.created(response, {ticket: ticket.id, id: instered_object._id});
			});
		});

	});
	
}


Controller.prototype.get_user = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.edit_user = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.delete_user = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.user_login = function(request, response) {
	
	MongoClient.connect(config.mongo_url, function(err, client) {

		var db = client.db(config.mongo_name);

		if(err) {
			console.log(err);
			responses.database_error(response);
			return;
		}

		var user = request.body;

		if(!user.name) {
			responses.bad_request(response, "Username is missing");
			return;
		}

		if(!user.password) {
			responses.bad_request(response, "Password is missing");
			return;
		}

		db.collection('users').findOne({name: user.name}, function(err, user_found) {

			if(err) {
				console.log(err);
				responses.database_error(response);
				return;		
			}

			if(!user_found) {
				responses.not_found(response, "User requested does not exist");
				return;
			}

			if(md5(user.password) === user_found.password) {
				var ticket = ticket_factory.add_ticket(user.name);
				responses.ok(response, {ticket: ticket.id, id: user_found._id});
			} else {
				responses.unauthorized(response);
			}

		});

	});
	
}

Controller.prototype.user_logout = function(request, response) {

	var ticket = request.body;

	if(!ticket.ticket) {
		responses.bad_request(response, "Ticket is missing");
		return;
	}

	if(ticket_factory.remove_ticket(ticket.ticket)) {
		responses.ok(response);
	} else {
		responses.not_found(response, "Ticket does not exist");
	}

}

Controller.prototype.check_ticket = function(request, response) {

	var ticket = request.body;

	if(!ticket.ticket) {
		responses.bad_request(response, "Ticket is missing");
		return;
	}

	ticket = ticket_factory.get_ticket(ticket.ticket);
	if(ticket) {
		responses.ok(response, {name: ticket.name});
	} else {
		responses.not_found(response, "Ticket does not exist");
	}

}

Controller.prototype.get_eventlist = function(request, response) {
	
	var user_id = request.params.userId;
	var ticket = ticket_factory.get_ticket(request.body.ticket);

	if(!ticket) {
		responses.unauthorized(response, "Ticket given is not valid or has expired");
		return;
	}

	MongoClient.connect(config.mongo_url, function(err, client) {

		if(err) {
			console.log(err);
			responses.database_error(response);
			return;		
		}

		var db = client.db(config.mongo_name);

		db.collection('users').findOne({_id: new mongo.ObjectId(user_id)}, function(err, user_found) {
			if(err) {
				console.log(err);
				responses.database_error(response);
				client.close();
				return;		
			}

			if(!user_found) {
				responses.not_found(response, "User given does not exist");
				client.close();
				return;
			}

			if(ticket.name !== user_found.name) {
				responses.unauthorized(response, "Ticket given is not valid or has expired");
				client.close();
				return;
			}

			var eventlist = [];

			user_found.events.forEach(function(event) {
				eventlist.push({
					name: event.name,
					uri: tools.get_base_uri(request) + "/api/users/" + user_id + "/events/" + event._id;
				})
			});

			if(user_found.events) responses.ok(response, {events: eventlist});
			else responses.ok(response, {events: []});

			client.close();

		});

	});
	
}


Controller.prototype.create_event = function(request, response) {
	
	var user_id = request.params.userId;
	var ticket = ticket_factory.get_ticket(request.body.ticket);

	if(!ticket) {
		responses.unauthorized(response, "Ticket given is not valid or has expired");
		return;
	}

	MongoClient.connect(config.mongo_url, function(err, client) {

		if(err) {
			console.log(err);
			responses.database_error(response);
			return;		
		}

		var db = client.db(config.mongo_name);

		db.collection('users').findOne({_id: new mongo.ObjectId(user_id)}, function(err, user_found) {
			if(err) {
				console.log(err);
				responses.database_error(response);
				client.close();
				return;		
			}

			if(!user_found) {
				responses.not_found(response, "User given does not exist");
				client.close();
				return;
			}

			if(ticket.name !== user_found.name) {
				responses.unauthorized(response, "Ticket given is not valid or has expired");
				client.close();
				return;
			}

			if(!user_found.events) user_found.events = [];
			if(!user_found.event_id_count) user_found.event_id_count = 0;
			var new_event = {_id: user_found.event_id_count++, name: "My New Event"};
			user_found.events.push(new_event);

			db.collection('users').updateOne({_id: user_found._id}, {$set: user_found}, function(err) {

				if(err) {
					console.log(err);
					responses.database_error(response);
					client.close();
					return;		
				} else {
					responses.ok(response, {id: new_event._id, name: new_event.name});
					client.close();
					return;
				}

			});

		});

	});
	
}


Controller.prototype.get_event = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.edit_event = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.delete_event = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.get_loglist = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.create_log = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.get_log = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.edit_log = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.delete_log = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.get_votelist = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.create_vote = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.get_vote = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.edit_vote = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}


Controller.prototype.delete_vote = function(request, response) {
	
	// TODO
	response.sendFile( path.join( base_url, 'public', 'under_construction.html'));
	
}

module.exports = Controller;