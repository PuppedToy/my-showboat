(function($) {

	var ticket, current_event_id, current_event, user_id;
	var profiles = ["man-1.png", "woman-1.png"];

	$(document).ready(function() {
		checkConnection(function(response) {
			ticket = Cookies.get("ticket");
			setupLogout();
			user_id = response.id;

			current_event_id = Cookies.get("current_event");

			$.ajax({
				type: "POST",
				url: "/api/users/" + user_id + "/events/" + current_event_id,
				data: JSON.stringify({ ticket: ticket }),
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function(response){
					current_event = response;
				},
				error: function(response) {
					if(response.status == 401) {
						// unauthorized
						alert("Connection lost. Please, log in again");
						disconnect();
					} else if(response.status == 500) {
						alert("Internal server error. Please, contact the adminsitrator or try it later");
						disconnect();
					}
				}
			});

		}, function() {
			window.location.href = "/";	
		});
	});

})(jQuery);