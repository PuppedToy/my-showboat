(function($) {

	var ticket, current_event, user_id, characters, selected_character;
	var profiles = ["man-1.png", "woman-1.png"];

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

					if(characters.length == 0) {
						add_random_character();
					} else {
						draw_characters();
					}

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

			$("#character_list").on("click", function(e) {
				if(e.target === e.currentTarget) {
					selected_character = undefined;
					draw_characters();
				}
			});

			$("#prev_arrow").on("click", function() {
				Cookies.remove("current_event");
				window.location.href = "/event_list";
			});

			$("#add_button").on("click", function() {
				add_random_character();
			});

			$("#remove_button").on("click", function() {
				if(selected_character === undefined) alert("There is no character selected");

				var confirmation = confirm("Are you sure you want to delete character \"" + get_character(selected_character).name + "\"?");

				if(!confirmation) return;

				for(var i = 0; i < characters.length; i++) {
					if(characters[i]._id === selected_character) {
						characters.splice(i, 1);
						save_characters(function() {
							var deleted_character = selected_character;
							for(var i = 0; i < characters.length; i++) {
								if(characters[i]._id < deleted_character) selected_character = characters[i]._id;
							}
							draw_characters();
						});
						break;
					}
				}
			});

		}, function() {
			disconnect();
		});
	});

	function draw_characters() {
		$(".character").off();

		var html = "";
		characters.forEach(function(character) {
			if(selected_character != character._id) html += "<div id='character-" + character._id + "' class='list-element character'>" + character.name + "</div>";
			else html += "<div id='character-" + character._id + "' class='list-element character list-element-selected'>" + character.name + "</div>";
		});

		$("#character_list").html(html);
		$(".character").on("click", function() {
			character_click(this);
		});

		if(selected_character !== undefined) {
			var my_character = get_character(selected_character);
			$("#character_picture").attr("src", my_character.img);
			$("#character_picture").show();
			$("#character_name").val(my_character.name);
			$(".file_selector").attr("disabled", false);
		} else {
			$("#character_picture").hide();
			$("#character_name").val("");
			$(".file_selector").attr("disabled", true);
		}

	}

	function get_character(i) {
		for(var j in characters) {
			if(characters[j]._id === i) return characters[j];
		}
		return null;
	}

	function character_click(self) {

		selected_character = parseInt($(self).attr("id").replace("character-", ""));

		// AJAX al evento elegido para obtener informacion

		draw_characters();

	}

	function add_random_character() {
		var new_id = 1;
		if(characters.length > 0) {
			new_id = characters[characters.length-1]._id + 1;
		}
		characters.push({
			_id: new_id,
			name: "Character " + new_id,
			img: "/assets/images/" + sample(profiles)
		});

		save_characters(function() {
			selected_character = new_id;
			draw_characters();
		});
	}

	function save_characters(callback) {
		$.ajax({
			type: "PUT",
			url: "/api/users/" + user_id + "/events/" + current_event,
			data: JSON.stringify({ ticket: ticket, update: {characters: characters} }),
			contentType: "application/json; charset=utf-8",
			dataType: "html",
			success: function() {
				callback();
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

function test() {
	console.log($(".file_selector")[0].files);
}