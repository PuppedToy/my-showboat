const tools = require('./api-tools');
const Vote = require('./vote');

const MAX_TRIES = 30000;
dicc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

// IDEA: Associate a vote with a ticket, so it is only valid when the ticket is valid (1H)

function VoteFactory() {

	this.votes = [];

};

VoteFactory.prototype.searchVote = function(value, key) {

	key = key || "id";

	for(let i = 0; i < this.votes.length; i++) {
		if(this.votes[i][key] === value) return this.votes[i];
	}

	return null;

}

VoteFactory.prototype.searchVoteByHostId = function(host_id) {

	for(let i = 0; i < this.votes.length; i++) {
		if("" + this.votes[i].host._id == "" + host_id) return this.votes[i];
	}

	return null;

}

VoteFactory.prototype.deleteVote = function(vote) {

	for(let i = 0; i < this.votes.length; i++) {
		if(this.votes[i] == vote) {
			this.votes.splice(i, 1);
			return true;
		}
	}

	return false;

}

VoteFactory.prototype.newVote = function(event, host, ticket, socket) {

	let existing_vote = this.searchVote(ticket, "ticket");
	let new_vote = null;

	if(existing_vote && !existing_vote.ticket.expired()) {
		existing_vote.ticket.renew();
		existing_vote.setSocket(socket);
		if(existing_vote.timer) clearInterval(existing_vote.timer);
		new_vote = existing_vote;
	} else {
		if(existing_vote && existing_vote.ticket.expired() && !this.deleteVote(existing_vote)) {
			console.log("Error deleting vote " + existing_vote.id);
		}
		let new_id = this.generateId();
		if(new_id) {
			new_vote = new Vote(new_id, event, host, ticket, socket);
			this.votes.push(new_vote);
		}
	}

	return new_vote;
}

VoteFactory.prototype.existsId = function(id) {

	return this.searchVote(id) || false;

}

VoteFactory.prototype.generateId = function() {

	let tries = 0, new_id;

	do {

		new_id = "";

		for(let i = 0; i < 4; i++) {
			new_id += tools.sample(dicc);
		}

	} while(this.existsId(new_id) && tries++ < MAX_TRIES);

	if(tries >= MAX_TRIES) {
		console.log("WARNING: Max tries reached when generating vote ID!");
	}

	return new_id || null;

}

VoteFactory.prototype.addGuest = function(socket, vote_id) {

	let vote = this.searchVote(vote_id);

	if(!vote) {
		return {vote: null, guest: null};
	}

	let guest = vote.addGuest(socket);

	return {vote: vote, guest: guest};

}


VoteFactory.prototype.associateCharacters = function(vote_id, guest_id, selected_characters) {

	let vote = this.searchVote(vote_id);

	if(!vote) {
		return null;
	}

	return vote.associateCharacters(guest_id, selected_characters);

}

module.exports = VoteFactory;