module.exports = {
	database_error: function(response) {

		response.status(500).send("Database broken. Please, contact the administrator or try it later.");

	}

	bad_request: function(response, message) {

		response.status(400).send(message);

	}

	error: function(response, status, message) {

		response.status(status).send(message);

	}

}