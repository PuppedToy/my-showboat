const tools = require('./api-tools');
const Vote = require('./vote');

const MAX_TRIES = 30000;
dicc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

function VoteFactory() {

	this.votes = [];

};

VoteFactory.prototype.newVote = function(event, host) {
	let new_id = this.generateId(), new_vote = null;
	if(new_id) {
		new_vote = new Vote(new_id, event);
		this.votes.push(new_vote);
	}
	return new_vote;
}

VoteFactory.prototype.existsId = function(id) {

	for(let i = 0; i < this.votes.length; i++) {
		if(this.votes[i].id === id) return true;
	}

	return false;

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

module.exports = VoteFactory;