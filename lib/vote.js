function Guest(id, socket) {

	this.id = id;
	this.socket = socket;
	this.characters = [];

}

Guest.prototype.associateCharacters = function(selected_characters) {

	this.characters = selected_characters.slice();
	return this.characters;

} 

function Vote(id, event, host, ticket, socket) {

	this.id = id;
	this.event = event;
	this.host = host;
	this.ticket = ticket;
	this.socket = socket;

	this.id_count = 0;
	this.guests = [];

	this.characters_left = this.event.characters.slice();
	this.charaters_votes = [];

}

Vote.prototype.addVote = function(character_id, votes) {

	let valid = true;

	this.charaters_votes.forEach(vote => {
		if(vote.character_id == character_id) valid = false;
	});

	if(!valid) {
		console.log("WARNING (addVote): Not valid vote for character " + character_id + ". Dumping character_votes...");
		console.log(this.character_votes);
		return false;
	}

	this.character_votes.push({
		character_id: character_id,
		votes: votes
	});

	if(this.isCharacterLeft(character_id)) {
		console.log("WARNING: Character that has just finished voting should not be in characters_left. BUG?");
		for(let i = 0; i < this.characters_left.length; i++) {
			if(this.characters_left[i]._id == character_id) {
				this.characters_left.splice(i--, 1);
			}
		}
	}

	return true;

}

Vote.prototype.broadcast_guests = function(sender, event, ...args) {

	this.guests.forEach(guest => {
		if(!sender || guest.id !== sender.id) guest.socket.emit(event, ...args);
	});

}

Vote.prototype.deleteGuest = function(guest) {
	
	this.deassociateCharacters(guest.characters);

	for(let i = 0; i < this.guests.length; i++) {
		if(this.guests[i].id == guest.id) {
			this.guests.splice(i, 1);
			return true;
		}
	}

	return false;

}

Vote.prototype.setHost = function(host) {
	this.host = host;
}

Vote.prototype.setTicket = function(ticket) {
	this.ticket = ticket;
}

Vote.prototype.setSocket = function(socket) {
	this.socket = socket;
}

Vote.prototype.getGuest = function(value, key) {

	key = key || "id";

	for(let i = 0; i < this.guests.length; i++) {
		if(this.guests[i][key] == value) return this.guests[i];
	}

	return null;

}

Vote.prototype.addGuest = function(guest_socket) {

	let new_guest = this.getGuest(guest_socket, "socket");

	if(!new_guest) {
		new_guest = new Guest(this.id_count++, guest_socket);
		this.guests.push(new_guest);
	}

	return new_guest;

}

Vote.prototype.getCharacter = function(character_id) {

	for(let i = 0; i < this.event.characters; i++) {
		if(this.event.characters[i]._id == character_id) return this.event.characters[i];
	}

	return null;

}

Vote.prototype.isCharacterLeft = function(character_id) {

	return this.characters_left.map(character => character._id).includes(character_id);

}

Vote.prototype.deassociateCharacters = function(characters) {

	if(characters.length <= 0) return;

	characters.forEach(character_id => {
		if(!this.isCharacterLeft(character_id)) {
			this.characters_left.push(this.getCharacter(character_id));
		}
	});
	
}

Vote.prototype.associateCharacters = function(guest_id, selected_characters) {

	let guest = this.getGuest(guest_id), valid = true;

	if(!guest) return null;

	selected_characters.forEach(character_id => {
		if(!this.isCharacterLeft(character_id)) valid = false;
	});

	if(!valid) return null;

	this.deassociateCharacters(guest.characters);

	let characters = guest.associateCharacters(selected_characters);

	for(let i = 0; i < this.characters_left.length; i++) {
		if(guest.characters.includes(this.characters_left[i]._id)) {
			this.characters_left.splice(i--, 1);
		}
	}

	return characters;

}

module.exports = Vote;