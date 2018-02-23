(function($) {

	var socket = io();
	var emitted = false;
	var my_characters = [];

	$(document).ready(function() {
		
		$("#start-button").on("click", function() {

			if(emitted) return;
			emitted = true;

			socket.emit("introduce_code", $("#vote_code_input").val().toUpperCase());

		});

		$("#vote-button").on("click", function() {

			if(emitted) return;
			emitted = true;

			socket.emit("select_characters", my_characters);

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
		emitted = false;
	});

	socket.on("successful_select_characters", function() {
		$("#step2").hide();
		$("#step3").show();
	});

	socket.on("refresh", function(characters_left, characters) {

		// TODO Check this

		var stolen_characters = [];

		var taken_characters = characters.slice();
		var characters_left_ids = characters_left.map(function(character) {
			return character._id;
		});

		characters.forEach(function(character) {
			if(characters_left_ids.includes(character._id)) taken_characters.splice(taken_characters.indexOf(character), 1);
		});

		console.log(taken_characters);

		taken_characters.forEach(function(character) {
			var index = my_characters.indexOf(character._id);
			if(index >= 0) {
				stolen_characters.push(character._id);
				my_characters.splice(index, 1);
			}
		});

		if(stolen_characters.length > 0) {
			alert("Otro votante ha elegido los siguientes personajes: " + stolen_characters.join(", "));
		}

		draw_characters(characters_left, characters);

	});

	function draw_characters(characters_left, characters) {

		if(my_characters.length === 0) {
			$("#vote-button").addClass("btn-disabled");
		} else {
			$("#vote-button").removeClass("btn-disabled");
		}

		$(".character").off("click");

		var html = "";

		characters.forEach(function(character) {
			html += "<div class='character' id='character-" + character._id + "'><div class='character-image'></div><div class='character-name'></div></div>";
		});

		$("#character_container").html(html);

		characters.forEach(function(character) {
			if(is_my_character(character)) {
				$("#character-" + character._id + " .character-image").css("background-image", "url(./assets/images/tick.png), url(" + character.img + ")");	
				$("#character-" + character._id).css("border-color", "#3FBF1F");
			} 
			else {
				$("#character-" + character._id + " .character-image").css("background-image", "url(\"" + character.img + "\")");	
				$("#character-" + character._id).css("border-color", "#000");
			}
			$("#character-" + character._id + " .character-name").html(character.name);
		});

		$(".character").on("click", function() {
			var id = parseInt($(this).attr("id").replace("character-", ""));
			if(!characters_left.map(function(char) {
				return char._id;
			}).includes(id)) return;
			var index = my_characters.indexOf(id);
			if(index < 0) {
				my_characters.push(id);
			} else {
				my_characters.splice(index, 1);
			}
			draw_characters(characters_left, characters);
		});

	}

	function is_my_character(character) {

		return my_characters.includes(character._id);

	}

	function error(msg) {
		$(".error").html(msg);
		$(".error").slideDown();
		setTimeout(function() {
			$(".error").fadeOut();
		}, 5000);
	}

})(jQuery);