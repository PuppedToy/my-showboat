module.exports = {

	ok: function(response, message) {

		sendResponse(response, 200, message);

	},

	created: function(response, message) {

		sendResponse(response, 201, message);

	},

	database_error: function(response) {

		sendResponse(response, 500, "Database broken. Please, contact the administrator or try it later.");

	},

	bad_request: function(response, message) {

		sendResponse(response, 400, message);

	},

	unauthorized: function(response, message) {

		sendResponse(response, 401, message);

	},

	not_found: function(response, message) {

		sendResponse(response, 404, message);

	},

	conflict: function(response, message) {

		sendResponse(response, 409, message);

	},

	internal_server_error: function(response, message) {

		sendResponse(response, 500, message);

	},

	error: function(response, status, message) {

		sendResponse(response, status, message);

	}

}

function sendResponse(response, status, message) {

	message = message || "";
	response.status(status).send(message);

}