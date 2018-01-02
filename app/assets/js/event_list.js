(function($) {

	var ticket, selected_event, events, user_id;

	$(document).ready(function() {
		checkConnection(function(response) {
			ticket = Cookies.get("ticket");
			setupLogout();
			user_id = response.id;

			getEventList();

			$("#event_list").on("click", function(e) {
				if(e.target === e.currentTarget) {
					selected_event = undefined;
					drawEvents();
				}
			});

			$("#add_button").on("click", function() {

				$.ajax({
					type: "POST",
					url: "/api/users/" + user_id + "/events",
					data: JSON.stringify({ ticket: ticket }),
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					success: function(response){
						selected_event = response.id;
						getEventList();
					},
					error: function(response) {
						if(response.status == 401) {
							// unauthorized
							alert("Connection lost. Please, log in again");
						} else {
							alert("Internal server error. Please, contact the adminsitrator or try it later");
						}
						disconnect();
					}
				});

			});

			$("#remove_button").on("click", function() {

				if(selected_event === undefined) return;

				var confirmation = confirm("Are you sure you want to delete event \"" + $("#event-" + selected_event).html().replace(/(?:<div.*?\>|<\/div\>)/g, "") + "\"?");

				if(!confirmation) return;

				$.ajax({
					type: "DELETE",
					url: "/api/users/" + user_id + "/events/" + selected_event,
					data: JSON.stringify({ ticket: ticket }),
					contentType: "application/json; charset=utf-8",
					dataType: "html",
					success: function(response){
						var deleted_event = selected_event;
						for(var i = 0; i < events.length; i++) {
							if(events[i].id < deleted_event) selected_event = events[i].id;
						}
						getEventList();
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

			});

		}, function() {
			window.location.href = "/";	
		});
	});

	function getEventList() {
		$.ajax({
			type: "POST",
			url: "/api/users/" + user_id + "/events/list",
			data: JSON.stringify({ ticket: ticket }),
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function(response){
				events = response.events;
				drawEvents();
			}
		});
	}

	function drawEvents() {

		$(".event").off();

		var html = "";
		events.forEach(function(event) {
			if(selected_event != event.id) html += "<div id='event-" + event.id + "' class='list-element event'>" + event.name + "</div>";
			else html += "<div id='event-" + event.id + "' class='list-element event list-element-selected'>" + event.name + "</div>";
		});

		$("#event_list").html(html);
		$(".event").on("click", function() {
			eventClick(this);
		});

	}

	function eventClick(self) {

		selected_event = parseInt($(self).attr("id").replace("event-", ""));

		// AJAX al evento elegido para obtener informacion

		drawEvents();

	}

})(jQuery);