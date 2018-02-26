(function($) {

	// Global app variables

	var socket = io();
	var emitted = false;
	var characters = [];
	var my_characters = [];
	var step = 1;
	var current_character = null;
	var available_coins = [];

	var my_votes; // Type Votes

	function Votes() {
		available_coins.forEach(function(coin) {
			this[coin] = null;
		});
	}

	Votes.prototype.isCompleted = function() {

		for(var i = 0; i < available_coins.length; i++) {
			if(this[available_coins[i]] === null) return false;
		}

		return true;

	};

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

	socket.on("successful_introduce_code", function(characters_left, character_list) {
		step = 2;
		$("#step1").hide();
		$("#step2").show();
		characters = character_list;
		draw_characters(characters_left);
		emitted = false;
	});

	socket.on("successful_select_characters", function() {
		step = 3;
		$("#step2").hide();

		next_character();

		$("#step3").show();
		emitted = false;
	});

	socket.on("refresh", function(characters_left) {

		if(step !== 2 || emitted) return;

		var stolen_characters = [];

		var taken_characters = characters.slice();
		var characters_left_ids = characters_left.map(function(character) {
			return character._id;
		});

		characters.forEach(function(character) {
			if(characters_left_ids.includes(character._id)) taken_characters.splice(taken_characters.indexOf(character), 1);
		});

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

		draw_characters(characters_left);

	});

	function draw_characters(characters_left) {

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

		if(step === 2) setup_characters_step2(characters_left);
		else if(step === 3) setup_characters_step3(characters_left);

	}

	function setup_characters_step2(characters_left) {
		characters.forEach(function(character) {
			if(is_my_character(character)) {
				$("#character-" + character._id + " .character-image").css("background-image", "url(./assets/images/tick.png), url(" + character.img + ")");	
				$("#character-" + character._id).css("border-color", "#3FBF1F");
			} 
			else if(is_character_left(character._id, characters_left)) {
				$("#character-" + character._id + " .character-image").css("background-image", "url(\"" + character.img + "\")");	
			} else {
				$("#character-" + character._id + " .character-image").css("background-image", "url(./assets/images/taken.png), url(" + character.img + ")");	
				$("#character-" + character._id).addClass("character-disabled");
			}
			$("#character-" + character._id + " .character-name").html(character.name);
		});

		$(".character").on("click", function() {
			var id = get_character_id_from_jquery_object($(this));
			if(!is_character_left(id, characters_left)) return;
			var index = my_characters.indexOf(id);
			if(index < 0) {
				my_characters.push(id);
			} else {
				my_characters.splice(index, 1);
			}
			draw_characters(characters_left);
		});
	}

	function setup_characters_step3(characters_left) {

		characters.forEach(function(character) {
			
			$("#character-" + character._id + " .character-image").css("background-image", "url(\"" + character.img + "\")");	
			$("#character-" + character._id + " .character-name").html(character.name);

			if(is_in_my_group(character)) {
				$("#character-" + character._id).addClass("character-disabled");
			} 

		});

		$(".character").on("click", function() {

			var id = get_character_id_from_jquery_object($(this));

			// TODO Open modal with all the coins and select one

		});
	}

	function is_in_my_group(character) {
		return current_character && 
				(
					current_character._id == character._id || 
					(
						current_character.group !== -1 && 
						current_character.group != undefined && 
						current_character.group == character.group
					)
				);
	}

	function next_character() {
		if(my_characters.length > 0) {
			current_character = get_character(my_characters.shift());
			available_coins = set_available_coins();
		} else {
			// TODO when characters list finish go to step 4
		}
	}

	function set_available_coins() {

		var total_coins = characters.length - 1; // We do not count ourselves

		characters.forEach(function(character) {
			if(!is_in_my_group(character)) {
				available_coins.push(total_coins--);
			}
		});	

		my_votes = new Votes();
	}

	function get_character(id) {
		for(var i = 0; i < characters.length; i++) {
			if(characters[i]._id == id) return characters[id];
		}
		return null;
	}

	function is_character_left(id, characters_left) {
		return characters_left.map(function(char) {
			return char._id;
		}).includes(id);
	}

	function is_my_character(character) {

		return my_characters.includes(character._id);

	}

	function get_character_id_from_jquery_object($object) {
		return parseInt($object.attr("id").replace("character-", ""));
	}

	function error(msg) {
		$(".error").html(msg);
		$(".error").slideDown();
		setTimeout(function() {
			$(".error").fadeOut();
		}, 5000);
	}

})(jQuery);