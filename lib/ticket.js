// Tickets will expire after 1 hour
const EXPIRTATION_TIME_MILLI = 3600000;

function Ticket(name, id) {
	
	this.name = name;
	this.id = id;
	this.generate_expiration_date();

}

Ticket.prototype.generate_expiration_date = function() {

	var expiration_date = new Date();
	expiration_date.setTime(expiration_date.getTime() + EXPIRTATION_TIME_MILLI);
	this.expiration_date = expiration_date;

}

Ticket.prototype.expired = function() {

	return (new Date()).getTime() >= this.expiration_date.getTime();

}

Ticket.prototype.renew = function() {
	this.generate_expiration_date();
}

module.exports = Ticket;