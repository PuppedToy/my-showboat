(function($) {

	var ticket;

	$(document).ready(function() {
		checkConnection(function() {
			ticket = Cookies.get("ticket");
			setupLogout();
		}, function() {
			window.location.href = "/";	
		});


		
		
	});

})(jQuery);