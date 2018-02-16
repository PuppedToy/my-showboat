module.exports = function(server, vote_factory) {

	var io = require('socket.io')(server);

	io.on('connection', function(socket) {

		console.log("New anonymous connection!");

		socket.on('test', function (data) {
			console.log("Working connection!");
			console.log(data);
		});

		socket.on('disconnect', function(data) {
			console.log("Anonymous disconnection!");
		});

	});

}