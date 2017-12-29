module.exports = {

	ok: function(response, message) {

		message = message || "";
		response.status(200).send(message);

	},

	created: function(response, message) {

		message = message || "";
		response.status(201).send(message);

	},

	database_error: function(response) {

		response.status(500).send("Database broken. Please, contact the administrator or try it later.");

	},

	bad_request: function(response, message) {

		message = message || "";
		response.status(400).send(message);

	},

	conflict: function(response, message) {

		message = message || "";
		response.status(409).send(message);

	},

	error: function(response, status, message) {

		message = message || "";
		response.status(status).send(message);

	}

}