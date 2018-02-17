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
					$("#event_info").html("No event selected");
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

			$("#edit_button").on("click", function() {
				if(selected_event === undefined) {
					alert("There is no event selected to edit!");
					return;
				}
				Cookies.set("current_event", selected_event, {expires: 1});
				window.location.href = "/edit_event";
			});

			$("#vote_button").on("click", function() {
				if(selected_event === undefined) {
					alert("There is no event selected to edit!");
					return;
				}
				Cookies.set("current_event", selected_event, {expires: 1});
				window.location.href = "/host_vote";
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
				$(".list").css("background-image", "none");
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
		$("#event_info").html("");
		$("#event_info").css("background-image", "url(/assets/images/loading.gif)");

		// AJAX al evento elegido para obtener informacion
		if(selected_event != undefined) {
			$.ajax({
				type: "POST",
				url: "/api/users/" + user_id + "/events/" + selected_event,
				data: JSON.stringify({ ticket: ticket }),
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function(response){

					if(!response.characters) response.characters = [];

					var html = "<p><strong>Name: </strong>" + response.name + "</p>";
					html += "<p><strong>Characters: </strong>" + response.characters.map(function(char) {
						return char.name
					}).join(", ") + "</p>";

					$("#event_info").css("background-image", "none");
					$("#event_info").html(html);

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
		}

		drawEvents();

	}

	function setupInputFiles() {
		$( '.inputfile' ).each( function()
		{
			var $input	 = $( this ),
				$label	 = $input.next( 'label' ),
				labelVal = $label.html();

			$input.on( 'change', function( e )
			{
				var fileName = '';

				if( this.files && e.target.value )
					fileName = e.target.value.split( '\\' ).pop();

				if( fileName )
					$label.find( 'span' ).html( fileName );
				else
					$label.html( labelVal );
			});

			// Firefox bug fix
			$input
			.on( 'focus', function(){ $input.addClass( 'has-focus' ); })
			.on( 'blur', function(){ $input.removeClass( 'has-focus' ); });
		});
	}

})(jQuery);