var fs = require('fs-extra');
const path = require('path');
var base_url, vote_factory;
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var config = require('./config');
var responses = require('../lib/api-responses');
var tools = require('../lib/api-tools');
var md5 = require('md5');
var TicketFactory = require('../lib/ticket-factory');
var ticket_factory = new TicketFactory();
var isImage = require('is-image');

// TODO Clean up this code please. It's messy as hell

function Controller(url, vote_factory) {

	base_url = url;
	vote_factory = vote_factory;

};


Controller.prototype.render_index = function(request, response) {

	response.sendFile( path.join( base_url, 'public', 'index.html' ) );

}

Controller.prototype.render_login = function(request, response) {

	response.sendFile( path.join( base_url, 'public', 'login.html'));

}

Controller.prototype.render_event_list = function(request, response) {

	response.sendFile( path.join( base_url, 'public', 'event_list.html'));

}


Controller.prototype.render_edit_event = function(request, response) {

	var step = request.query.step || 1;

	response.sendFile( path.join( base_url, 'public', 'edit_event_step_' + step + '.html'));

}

Controller.prototype.render_vote = function(request, response) {

	response.sendFile( path.join( base_url, 'public', 'vote.html'));

}

Controller.prototype.render_host_vote = function(request, response) {

	response.sendFile( path.join( base_url, 'public', 'host_vote.html'));

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

				var ticket = ticket_factory.add_ticket(user.name, instered_object._id);
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
				var ticket = ticket_factory.add_ticket(user.name, user_found._id);
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
		responses.ok(response, {name: ticket.name, id: ticket.user_id});
	} else {
		responses.not_found(response, "Ticket does not exist");
	}

}

Controller.prototype.get_eventlist = function(request, response) {

	authenticateWithTicket(request, response, function(db, client, user_found) {

		if(!user_found.events) {
			responses.ok(response, {events: []});
		} else {
			var eventlist = [];

			user_found.events.forEach(function(event) {
				eventlist.push({
					name: event.name,
					uri: tools.get_base_uri(request) + "/api/users/" + request.params.userId + "/events/" + event._id,
					id: event._id
				});
			});

			responses.ok(response, {events: eventlist});
		}

		client.close();

	});
	
}


Controller.prototype.create_event = function(request, response) {

	authenticateWithTicket(request, response, function(db, client, user_found) {

		if(!user_found.events) user_found.events = [];
		var new_id = 1;
		if(user_found.events.length > 0) new_id = user_found.events[user_found.events.length - 1]._id + 1;
		var new_event = {_id: new_id, name: "My Event " + new_id};
		user_found.events.push(new_event);

		db.collection('users').updateOne({_id: user_found._id}, {$set: user_found}, function(err) {

			if(err) {
				console.log(err);
				responses.database_error(response);
				client.close();
				return;		
			} else {
				responses.created(response, {id: new_event._id, name: new_event.name});
				client.close();
				return;
			}

		});

	});
	
}


Controller.prototype.get_event = function(request, response) {

	authenticateWithTicket(request, response, function(db, client, user_found) {

		var event_found = searchEvent(user_found, request.params.eventId);

		if(event_found) {
			responses.ok(response, event_found);
		} else {
			responses.not_found(response, "Event requested has not been found");
		}

		client.close();

	});
	
}


Controller.prototype.edit_event = function(request, response) {

	authenticateWithTicket(request, response, function(db, client, user_found) {

		var event_found = searchEvent(user_found, request.params.eventId);

		if(request.body.update) {
			for(var key in request.body.update) {
				event_found[key] = request.body.update[key];
			}
		}

		if(event_found) {
			db.collection('users').updateOne({_id: user_found._id}, {$set: user_found}, function(err) {
				if(err) {
					console.log(err);
					responses.database_error(response);
					client.close();
					return;		
				}

				responses.ok(response);
			});
		} else {
			responses.not_found(response, "Event requested has not been found");
		}

		client.close();

	});
	
}


Controller.prototype.delete_event = function(request, response) {

	// TODO remove images of all characters involved. 
	// How can I the image of a deleted character if the call is edit? Must think about it
	
	authenticateWithTicket(request, response, function(db, client, user_found) {

		if(!user_found.events) user_found.events = [];

		var deleted = false;

		for(var i = 0; !deleted && i < user_found.events.length; i++) {
			if(user_found.events[i]._id == request.params.eventId) {
				deleted = true;
				user_found.events.splice(i, 1);
			}
		}

		if(deleted) {
			db.collection('users').updateOne({_id: user_found._id}, {$set: user_found}, function(err) {

				if(err) {
					console.log(err);
					responses.database_error(response);
					client.close();
					return;
				} else {
					responses.ok(response);
					client.close();
					return;
				}

			});
		} else {
			responses.not_found(response, "Event requested has not been found");
			client.close();
		}		

	});

}

Controller.prototype.upload_link_image = function(request, response) {

	authenticateWithTicket(request, response, function(db, client, user_found) {

		var event_found = searchEvent(user_found, request.params.eventId);

		if(!event_found) {
			responses.not_found(response, "Event requested has not been found");
			client.close();
			return;
		}

		var character_found = searchCharacter(event_found, request.body.character);

		if(!character_found) {
			responses.not_found(response, "The character requested does not exist");
			client.close();
			return;
		}

		var new_link = request.body.new_link;

		if(!new_link) {
			responses.bad_request(response, "Missing \"new_link\"");
			client.close();
			return;
		}

		if(!deleteImage(character_found, response, client)) return;

		character_found.img = new_link;

		db.collection('users').updateOne({_id: user_found._id}, {$set: user_found}, function(err) {
			if(err) {
				console.log(err);
				responses.database_error(response);
				client.close();
				return;		
			}

			responses.ok(response, event_found);
			client.close();
		});

	});

}

Controller.prototype.upload_image = function(request, response) {

	authenticateWithTicket(request, response, function(db, client, user_found) {

		var event_found = searchEvent(user_found, request.params.eventId);

		if(!event_found) {
			responses.not_found(response, "Event requested has not been found");
			client.close();
			return;
		}

		var character_found = searchCharacter(event_found, request.body.character);

		if(!character_found) {
			responses.not_found(response, "The character requested does not exist");
			client.close();
			return;
		}

		if(!request.files || !request.files.uploadedFile) {
			responses.bad_request(response, 'No files were uploaded.');
			client.close();
			return;
		}

		var uploadedFile = request.files.uploadedFile;

		if(!isImage(uploadedFile.name)) { // Dunno if this works
			responses.bad_request(response, 'The file uploaded is not an image.');
			client.close();
			return;
		}

		var image_name = request.params.userId + "-" + request.params.eventId + "-" + character_found._id + "-" + parseInt(Math.random()*35000) + ".png";
		var image_path = path.join(path.resolve('./public/assets/custom_images/'), image_name);
		console.log(image_path);
		var image_uri = '/assets/custom_images/' + image_name;

		if(!deleteImage(character_found, response, client)) return;

		uploadedFile.mv(image_path, function(err) {
		    if (err) {
		  		console.log(err);
				responses.internal_server_error(response, "Error when uploading image. Please contact the admin.");
				client.close();
				return;
		    }

		    character_found.img = image_uri;

		    db.collection('users').updateOne({_id: user_found._id}, {$set: user_found}, function(err) {
				if(err) {
					console.log(err);
					responses.database_error(response);
					client.close();
					return;		
				}

				responses.ok(response, event_found);
				client.close();
			});
		});
	});

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

function deleteImage(character, response, client) {

	if(character.img && character.img.indexOf('/assets/custom_images') === 0) {
		try {
			fs.ensureDirSync("./public/assets/custom_images");
		} catch(err) {
			console.log(err);
			responses.internal_server_error(response, "Error when uploading image. Please contact the admin.");
			client.close();
			character.img = "/assets/images/man-1.png";			
			return false;
		}

		try {
			fs.unlinkSync(character.img.replace('/assets/custom_images', path.resolve('./public/assets/custom_images')));
			character.img = "/assets/images/man-1.png";			
			return true;
		} catch (err) {
			console.log(err);
			responses.internal_server_error(response, "Error when uploading image. Please contact the admin.");
			client.close();
			character.img = "/assets/images/man-1.png";			
			return false;
		}
	} 

	return true;
}

function searchCharacter(event, character_id) {

	character_found = null;

	for(var i = 0; !character_found && i < event.characters.length; i++) {
		if(event.characters[i]._id == character_id) {
			character_found = event.characters[i];
		}
	}

	return character_found;

}

function searchEvent(user, event_id) {

	if(!user.events) user.events = [];
	event_found = null;

	for(var i = 0; !event_found && i < user.events.length; i++) {
		if(user.events[i]._id == event_id) {
			event_found = user.events[i];
		}
	}

	return event_found;

}

function authenticateWithTicket(request, response, success_cb, error_cb) {

	var user_id = request.params.userId;
	var event_id = request.params.eventId;
	var ticket = ticket_factory.get_ticket(request.body.ticket);

	if(!ticket) {
		responses.unauthorized(response, "Ticket given is not valid or has expired");
		return;
	}

	var object_id;
	try {
		object_id = new mongo.ObjectId(user_id);
	} catch (err) {
		responses.bad_request(response, "The user id is not valid");
		return;
	}

	MongoClient.connect(config.mongo_url, function(err, client) {

		if(err) {
			console.log(err);
			responses.database_error(response);
			if(error_cb) error_cb();
			return;		
		}		

		var db = client.db(config.mongo_name);

		db.collection('users').findOne({_id: object_id}, function(err, user_found) {
			if(err) {
				console.log(err);
				responses.database_error(response);
				client.close();
				if(error_cb) error_cb();
				return;		
			}

			if(!user_found) {
				responses.not_found(response, "User given does not exist");
				client.close();
				if(error_cb) error_cb();
				return;
			}

			if(ticket.name !== user_found.name) {
				responses.unauthorized(response, "Ticket given is not valid or has expired");
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

