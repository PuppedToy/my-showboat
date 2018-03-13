(function($) {

	var ticket, current_event, user_id, characters, selected_character, event;

	$(document).ready(function() {
		checkConnection(function(response) {
			ticket = Cookies.get("ticket");
			setupLogout();
			user_id = response.id;

			current_event = Cookies.get("current_event");
			if(current_event === undefined) window.location.href = "/event_list";

			$.ajax({
				type: "POST",
				url: "/api/users/" + user_id + "/events/" + current_event,
				data: JSON.stringify({ ticket: ticket }),
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function(response){
				
					event = response;
					console.log(event);

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

			$("select").html("<option>Upload image</option><option>Image from link</option><option>Color</option>");

			$("#prev_arrow").on("click", function() {
				window.location.href = "/edit_event?step=3";
			});

			$(".settings-save-btn").on("click", function() {

				if(!$("#event_name").val()) {
					error("Name can't be empty!");
					return;
				}

				$.ajax({
					type: "PUT",
					url: "/api/users/" + user_id + "/events/" + current_event,
					data: JSON.stringify({ ticket: ticket, update: {name: $("#event_name").val()} }),
					contentType: "application/json; charset=utf-8",
					dataType: "html",
					success: function() {
						$("#event_name").val("");
						success("Settings saved correctly");
					},
					error: function(response) {
						if(response.status == 401) {
							// unauthorized
							alert("Connection lost. Please, log in again");
							disconnect();
						} else if(response.status == 500) {
							alert("Internal server error. Please, contact the adminsitrator or try it later");
							disconnect();
						} else {
							console.log(response);
							error("Unknown error. Plase contact the adminsitrator or try it later");
						}
					}
				});
			});

		}, function() {
			disconnect();
		});
	});

	function error(msg) {
		if($(".success").css("display") != "none") $(".success").slideUp();
		$(".error").html(msg);
		$(".error").slideDown();
	}

	function success(msg) {
		if($(".error").css("display") != "none") $(".error").slideUp();
		$(".success").html(msg);
		$(".success").slideDown();
	}

})(jQuery);