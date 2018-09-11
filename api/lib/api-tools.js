module.exports = {

	validate_email: function(email) {
	    var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	    return regex.test(email.toLowerCase());
	},

	get_base_uri: function(request) {
		return request.protocol + '://' + request.get('host');
	},

	get_full_uri: function(request) {
		return request.protocol + '://' + request.get('host') + request.originalUrl;
	},

	sample: function(array) {
		return array[parseInt(Math.random()*array.length)];
	},

	searchEvent: function(user, event_id) {

		if(!user.events) user.events = [];
		event_found = null;

		for(var i = 0; !event_found && i < user.events.length; i++) {
			if(user.events[i]._id == event_id) {
				event_found = user.events[i];
			}
		}

		return event_found;

	},

	searchCharacter: function(event, character_id) {

		character_found = null;

		for(var i = 0; !character_found && i < event.characters.length; i++) {
			if(event.characters[i]._id == character_id) {
				character_found = event.characters[i];
			}
		}

		return character_found;

	}

}