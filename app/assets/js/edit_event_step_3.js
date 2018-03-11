(function($) {

	var ticket, current_event, user_id, characters, selected_character;
	var mouse_up = false;

	var groups = [];

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
				window.location.href = "/edit_event?step=2";
			});

			$("#next_arrow").on("click", function() {
				window.location.href = "/edit_event?step=4";
			});

		}, function() {
			disconnect();
		});
	});

	function draw_characters() {

		$("#images-supercontainer").html("<div class=\"images-container\"></div>");

		var sorted_characters = characters.slice();
		var html = "";
		sorted_characters.sort( function (character1, character2) {
			return character2.group - character1.group;
		});

		var present_group;

		console.log(sorted_characters);

		sorted_characters.forEach(function(character) {
			if(character.group >= 0 && present_group !== character.group) {
					if (present_group != undefined) {
						html += "</div>";
					}
					present_group = character.group;
					if(!groups[present_group]) {
						groups[present_group] = "rgba(" + randomInt(0, 255) + ", " + randomInt(0, 255) + ", " + randomInt(0, 255) + ", 0.6)";
					}
					html += "<div class='group' id='group-" + present_group + "'>";
			}
			if(character.group == -1 && present_group != undefined) {
				html += "</div>";
				present_group = undefined;
			}
			html += "<div class='character' id='character-" + character._id + "'><div class='character-image'></div><div class='character-name'></div></div>";
		});

		if(present_group != undefined) html += "</div>";

		$(".images-container").html(html);

		for(var i = 0; i < groups.length; i++) {
			if(groups[i]) $("#group-" + i).css("background-color", groups[i]);
		}

		characters.forEach(function(character) {
			$("#character-" + character._id + " .character-image").css("background-image", "url(\"" + character.img + "\")");
			$("#character-" + character._id + " .character-name").html(character.name);
		});

		// Listener to enable to check the next listeners
		$(".images-container").on("mouseup", function() {
			mouse_up = true;
		});

		// First listener, first executed
		$(".character").draggable();
		$(".character").droppable({
			drop: function( event, ui ) {

				if(!mouse_up) return;

				mouse_up = false;

		    	var host = get_character(parseInt($(this).attr("id").replace("character-", "")));
		    	var guest = get_character(parseInt($(ui.draggable[0]).attr("id").replace("character-", "")));

		    	join_group(host, guest);

		    }
		});

		// Second listener, second executed
		$(".group").droppable({
			drop: function( event, ui ) {

				if(!mouse_up) return;

				mouse_up = false;

				var host_group = parseInt($(this).attr("id").replace("group-", ""));
				var guest = get_character(parseInt($(ui.draggable[0]).attr("id").replace("character-", "")));

				guest.group = host_group;

				save_characters(function() {
					draw_characters();
				});

			}
		});

		// Third listener, third executed
		$(".images-container").droppable({
			drop: function( event, ui ) {

				if(!mouse_up) return;

				mouse_up = false;

				var guest = get_character(parseInt($(ui.draggable[0]).attr("id").replace("character-", "")));

				guest.group = -1;

				save_characters(function() {
					draw_characters();
				});

			} 
		});

	}

	// With host I mean the one who stayed fixed and with guest I mean the one who was dropped into the host
	function join_group(host, guest) {
		if(host.group === -1) {
			guest.group = -1;
			var taken_groups = [];

			characters.forEach(function(character) {
				if(!taken_groups.includes(character.group)) taken_groups.push(character.group);
			});

			taken_groups.sort(function(a,b) {
				return b-a;
			});

			host.group = taken_groups[0] + 1;
		}
		
		guest.group = host.group;

		save_characters(function() {
			draw_characters();
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

	function check_isolated_characters() {
		var groups_count = [];

		characters.forEach(function(character) {
			if(character.group != -1) {
				if(groups_count[character.group] == undefined) groups_count[character.group] = 0;
				groups_count[character.group]++;
			}
		});

		var removing_groups = [];

		for(var i = 0; i < groups_count.length; i++) {
			if(groups_count[i] != undefined && groups_count[i] <= 1) {
				characters.forEach(function(character) {
					if(character.group == i) character.group = -1;
				});
			}
		}
	}

	function save_characters(callback) {

		check_isolated_characters();

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