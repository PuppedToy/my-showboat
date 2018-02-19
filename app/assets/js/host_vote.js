(function($) {

	var socket = io(), current_event;


	$(document).ready(function() {

		checkConnection(function(response) {
			ticket = Cookies.get("ticket");
			setupLogout();
			user_id = response.id;

			current_event = Cookies.get("current_event");
			ticket = Cookies.get("ticket");
			console.log(user_id);
			console.log(ticket);
			console.log(current_event);
			
			socket.emit("create_vote", user_id, ticket, current_event);

		}, function() {
			disconnect();
		});

	});

	socket.on("create_vote_response", function(vote_id, characters_left, total_characters) {
		$("#vote_code_input").val(vote_id);
		drawCharactersLeft(characters_left, total_characters);

	});

	function drawCharactersLeft(characters_left, total_characters) {

		$("#not_voted_title").html("Personajes que faltan por votar (" + characters_left.length + " / " + total_characters + "):");

		var html = "";

		characters_left.forEach(function(character) {
			html += "<div class='character character_left' id='character-" + character._id + "'><div class='character-image'></div><div class='character-name'></div></div>";
		});

		$(".not_voted_list").html(html);

		characters_left.forEach(function(character) {
			$("#character-" + character._id + " .character-image").css("background-image", "url(\"" + character.img + "\")");
			$("#character-" + character._id + " .character-name").html(character.name);
		});

	}


})(jQuery);