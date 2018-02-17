function Guest(id, socket) {

	this.id = id;
	this.socket = socket;

}

function Vote(id, event, host) {

	this.id = id;
	this.event = event;
	this.host = host;

	this.id_count = 0;
	this.guests = [];

}

Vote.prototype.setHost = function(host_socket) {
	this.host = host_socket;
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

module.exports = Vote;