(function($) {

	var socket = io(), current_event;


	$(document).ready(function() {

		setupLogout();

		current_event = Cookies.get("current_event");
		ticket = Cookies.get("ticket");
		console.log(ticket);
		console.log(current_event);

		// TODO connect trough ticket
		
		socket.emit("create_vote", current_event, ticket);
		
	});


})(jQuery);