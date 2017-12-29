var Ticket = require('./ticket');
var tools = require('./api-tools');

var dicc = "áéíóúàèìòùÁÉÍÓÚÀÈÌÒÙabcdefghijklmnñopqrstuvwxyzABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789@#!?$€%&()=|-_.,:;{}[]^=+*¿¡/\\'\"".split("");

function TicketFactory() {
	
	this.tickets = [];

}

TicketFactory.prototype.get_ticket = function(id, search_by) {

	// By default, search will be done with the ticket's id. But it can be done with the name
	search_by = search_by || "id";

	for(var i = 0; i < this.tickets.length; i++) {
		if(this.tickets[i][search_by] === id) {
			if(this.tickets[i].expired()) {
				this.tickets.splice(i, 1);
				return null;
			}
			else return this.tickets[i];
		}
	}

	return null;

}

TicketFactory.prototype.add_ticket = function(name) {

	var ticket = this.get_ticket(name, "name");
	if(!ticket) {
		ticket = new Ticket(name, this.generate_id());
		this.tickets.push(ticket);
	}
	else ticket.renew();

	return ticket;

}

TicketFactory.prototype.remove_ticket = function(name) {

	for(var i = 0; i < this.tickets.length; i++) {
		if(this.tickets[i].name === name) {
			this.tickets.splice(i, 1);
			return;
		}
	}

}

TicketFactory.prototype.generate_id = function() {

	var new_id;

	do {
		new_id = "";
		for(i = 0; i < 32; i++) {
			new_id += tools.sample(dicc);
		}
		var unique = true;

		this.tickets.forEach(function(ticket) {
			unique = unique && ticket.id !== new_id;
		});
	} while(!unique);

	return new_id;

}

module.exports = TicketFactory;