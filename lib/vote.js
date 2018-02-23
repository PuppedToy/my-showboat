function Guest(id, socket) {

	this.id = id;
	this.socket = socket;

}

Guest.prototype.associateCharacter = function(character) {



	this.character = character;

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

}

Vote.prototype.deleteGuest = function() {
	// TODO
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

Vote.prototype.associateCharacter = function(guest, character) {
	
}

module.exports = Vote;