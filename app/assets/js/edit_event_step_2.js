(function($) {

	var ticket, current_event, user_id, characters, selected_character;

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
					characters = response.characters || [];
					characters.forEach(function(character) {
						if(!("group" in character)) {
							character.group = -1;
						}
					});
					console.log(characters);
					// Save can finish at any time. We can draw now
					save_characters();
					draw_characters();
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

			$("#prev_arrow").on("click", function() {
				window.location.href = "/edit_event";
			});

		}, function() {
			disconnect();
		});
	});

	function draw_characters() {

		var sorted_characters = characters.slice();
		var html = "";
		sorted_characters.sort( function (character1, character2) {
			return character2.group - character1.group;
		});

		characters.forEach(function(character) {
			if(character.group < 0) {
				html += "<div class='character' id='character-" + character._id + "'><div class='character-image'></div><div class='character-name'></div></div>";
			}
		});

		$(".images-container").html(html);

		characters.forEach(function(character) {
			$("#character-" + character._id + " .character-image").css("background-image", "url(\"" + character.img + "\")");
			$("#character-" + character._id + " .character-name").html(character.name);
		});

		$(".character").draggable();
		$(".character").droppable( {
			drop: function( event, ui ) {
				// TODO
		    	console.log(event);
		    	console.log(ui);    
		    }
		});

	}

	function get_selected_character() {
		return get_character(selected_character);
	}

	function get_character(i) {
		for(var j in characters) {
			if(characters[j]._id === i) return characters[j];
		}
		return null;
	}

	function save_characters(callback) {
		$.ajax({
			type: "PUT",
			url: "/api/users/" + user_id + "/events/" + current_event,
			data: JSON.stringify({ ticket: ticket, update: {characters: characters} }),
			contentType: "application/json; charset=utf-8",
			dataType: "html",
			success: function() {
				if(callback) callback();
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
	}

})(jQuery);