function checkConnection(callback, error_callback) {

	var ticket = Cookies.get("ticket");

	if(ticket) {
		$.ajax({
			type: "POST",
			url: "/api/check_ticket",
			data: JSON.stringify({ ticket: ticket }),
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function(response){
				$("#identity-header").html('Logged as&nbsp;<strong>' + response.name + '</strong>.&nbsp;<a id="logout-link">Log out</a>');
				if(callback) callback(response);
			},
			error: function(response) {
				Cookies.remove("ticket");
				$("#identity-header").html('Not connected.&nbsp;<a href="/login">Log in</a>');
				if(error_callback) error_callback(response);
			}
		});
	} else {
		$("#identity-header").html('Not connected.&nbsp;<a href="/login">Log in</a>');
		if(error_callback) error_callback(response);
	}

}

function setupLogout() {

	$("#logout-link").on("click", function() {

		var ticket = Cookies.get("ticket");
		if(!ticket) {
			window.location.href = "/";
			return;
		}

		$.ajax({
			type: "POST",
			url: "/api/logout",
			data: JSON.stringify({ ticket: ticket }),
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function(response){
				Cookies.remove("ticket");
				window.location.href = "/";
			},
			error: function(response) {
				Cookies.remove("ticket");
				window.location.href = "/";
			}
		});

	});

}