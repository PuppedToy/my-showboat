(function($) {

	var socket = io();

	socket.emit("test", "stuff");

	$(document).ready(function() {
		

		
	});


})(jQuery);