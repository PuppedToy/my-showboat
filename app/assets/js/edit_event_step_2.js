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

					$(".list").css("background-image", "none");
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
					$(".list").css("background-image", "none");
				}
			});

			$("#character_list").on("click", function(e) {
				if(e.target === e.currentTarget) {
					selected_character = undefined;
					draw_characters();
				}
			});

			$("#prev_arrow").on("click", function() {
				window.location.href = "/edit_event";
			});

			$("#next_arrow").on("click", function() {
				window.location.href = "/edit_event?step=3";
			});

			$("#add_button").on("click", function() {
				add_random_character();
			});

			$("#remove_button").on("click", function() {
				if(selected_character === undefined) alert("There is no character selected");

				var confirmation = confirm("Are you sure you want to delete character \"" + get_selected_character().name + "\"?");

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

			$("#modalExtLinkButton").on("click", function() {

				if(selected_character === undefined) return;

				$("#extLinkInput").val("");

			});

			$("#uploadedFile").on("change", function() {

				if(!$(".file_selector").val()) {
					return;
				}

				$("#character_picture").css("background-image", "url(/assets/images/loading.gif)");

				var form = $('form')[0];
				var formData = new FormData(form);

				formData.append('character', selected_character);
				formData.append('ticket', ticket);

				$.ajax({
				    url: "/api/users/" + user_id + "/events/" + current_event + "/images",
				    data: formData,
				    type: 'POST',
				    contentType: false,
				    processData: false,
				    success: function(response) {
				    	console.log(response);
				    	characters = response.characters || [];
						draw_characters();
				    },
				    error: function(response) {
				    	if(response.status == 401) {
							// unauthorized
							alert("Connection lost. Please, log in again");
						} else if (response.status == 500) {
							alert("Internal server error. Please, contact the adminsitrator or try it later");
						} else if (response.status == 400) {
							alert("Bad request from the browser. Please, contact the admin.");
						} else {
							alert("Unknown error " + response.status);
						}
						disconnect();
				    }
				});
			});

			$("#extLinkButton").on("click", function() {
				
				$("#character_picture").css("background-image", "url(/assets/images/loading.gif)");

				$.ajax({
				    url: "/api/users/" + user_id + "/events/" + current_event + "/link_images",
				    data: JSON.stringify({ 
				    	ticket: ticket, 
				    	new_link: $("#extLinkInput").val(),
				    	character: selected_character
    	  			}),
				    type: 'POST',
					contentType: "application/json; charset=utf-8",
					dataType: "json",
				    success: function(response) {
				    	console.log(response);
				    	characters = response.characters || [];
						draw_characters();
				    },
				    error: function(response) {
				    	if(response.status == 401) {
							// unauthorized
							alert("Connection lost. Please, log in again");
						} else if (response.status == 500) {
							alert("Internal server error. Please, contact the adminsitrator or try it later");
						} else if (response.status == 400) {
							alert("Bad request from the browser. Please, contact the admin.");
						} else {
							alert("Unknown error " + response.status);
						}
						disconnect();
				    }
				});
			});

			$("#rename_button").on("click", function() {
				rename_character();
			});

			$("#character_name").on("keypress", function(e) {
				if(e.which === 13) {
					rename_character();
				}
			})

		}, function() {
			disconnect();
		});
	});

	function draw_characters() {
		$(".character-elem").off();
		$("#character_picture").css("background-image", "url(/assets/images/loading.gif)");


		var html = "";
		characters.forEach(function(character) {
			if(selected_character != character._id) html += "<div id='character-" + character._id + "' class='list-element character-elem'>" + character.name + "</div>";
			else html += "<div id='character-" + character._id + "' class='list-element character-elem list-element-selected'>" + character.name + "</div>";
		});

		$("#character_list").html(html);
		$(".character-elem").on("click", function() {
			character_click(this);
		});

		if(selected_character !== undefined) {
			var my_character = get_selected_character();
			$("#character_picture").css("background-image", "url(" + my_character.img + ")");
			$("#character_picture").show();
			$(".file_selector").attr("disabled", false);
			$(".disablable").removeClass('btn-disabled');
			$("#modalExtLinkButton").attr("data-toggle", "modal");
		} else {
			$("#character_picture").css("background-image", "none");
			$(".file_selector").attr("disabled", true);
			$(".disablable").addClass('btn-disabled');
			$("#modalExtLinkButton").removeAttr("data-toggle");
		}
		$("#character_name").val("");
		$(".file_selector").val("");

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

	function character_click(self) {

		var previous_character = selected_character;
		selected_character = parseInt($(self).attr("id").replace("character-", ""));

		// AJAX al evento elegido para obtener informacion

		if(previous_character !== selected_character) draw_characters();

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

	function rename_character() {
		if(selected_character == undefined) return;

		var name_field = $("#character_name");

		if(!name_field.val()) {
			// TODO custom alert
			alert("The name of this character can not be empty");
			return;
		}

		get_selected_character().name = name_field.val();

		save_characters(function() {
			draw_characters();
		});
	}

})(jQuery);