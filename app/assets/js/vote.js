(function($) {

	var socket = io();
	var emitted = false;
	var my_characters = [];

	$(document).ready(function() {
		
		$("#vote-button").on("click", function() {

			if(emitted) return;
			emitted = true;

			socket.emit("introduce_code", $("#vote_code_input").val().toUpperCase());

		});

		$(".error").on("click", function() {
			$(this).fadeOut();
		});
		
	});

	socket.on("app_error", function(msg) {
		error(msg);
		emitted = false;
	});

	socket.on("successful_introduce_code", function(characters_left, characters) {
		$("#step1").hide();
		$("#step2").show();
		draw_characters(characters_left, characters);
	});

	function draw_characters(characters_left, characters) {

		var html = "";

		characters.forEach(function(character) {
			if(!is_my_character(character)) html += "<div class='character' id='character-" + character._id + "'><div class='character-image'></div><div class='character-name'></div></div>";
		});

		$("#character_container").html(html);

		characters.forEach(function(character) {
			$("#character-" + character._id + " .character-image").css("background-image", "url(\"" + character.img + "\")");
			$("#character-" + character._id + " .character-name").html(character.name);
		});

		$(".character").draggable(); // Drag & Drop not working for mobile --> http://touchpunch.furf.com

	}

	function is_my_character(character) {
		for(var i in my_characters) {
			if(my_characters[i]._id === character._id) return true;
		}
		return false;
	}

	function error(msg) {
		$(".error").html(msg);
		$(".error").slideDown();
		setTimeout(function() {
			$(".error").fadeOut();
		}, 5000);
	}

})(jQuery);