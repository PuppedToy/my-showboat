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

	function Votes(votes) {
		var self = this;
		available_coins.forEach(function(coin) {
			self[coin] = (votes ? votes[coin] : null);
		});
	}

	Votes.prototype.isCompleted = function() {

		for(var i = 0; i < available_coins.length; i++) {
			if(!this[available_coins[i]]) return false;
		}

		return true;

	};

	Votes.prototype.getCoin = function(id) {

		for(var i = 0; i < available_coins.length; i++) {
			if(this[available_coins[i]] && this[available_coins[i]]._id == id) return available_coins[i];
		}

		return null;

	}

	Votes.prototype.parseToSend = function() {

		var result = [];

		for(var i = 0; i < available_coins.length; i++) {
			if(this[available_coins[i]]) {
				result.push({
					character_id: this[available_coins[i]]._id,
					vote: available_coins[i]
				});
			}
		}

		return result;

	}

	$(document).ready(function() {

		check_cookies();
		
		$("#start-button").on("click", function() {
			vote_start($("#vote_code_input").val().toUpperCase());
		});

		$("#vote-button").on("click", function() {
			vote_send_characters();
		});

		$("#finish-button").on("click", function() {
			vote_finish();
		});

		$(".error").on("click", function() {
			$(this).fadeOut();
		});
		
	});

	socket.on("app_error", function(msg) {
		error(msg);
		emitted = false;
	});

	socket.on("app_fatal_error", function(msg) {
		alert(msg);
		remove_cookies();
	});

	socket.on("successful_introduce_code", function(code, characters_left, character_list) {

		Cookies.set("vote_code", code, {expires: 1});
		step = 2;
		$("#step1").hide();
		$("#step2").show();
		characters = character_list;
		draw_characters(characters_left);
		emitted = false;
		var selected_characters = Cookies.get("vote_selected_characters");


		if(selected_characters) {
			my_characters = JSON.parse(selected_characters);
			vote_send_characters();
		} else {

		}
	});

	socket.on("successful_select_characters", function() {
		Cookies.set("vote_selected_characters", JSON.stringify(my_characters), {expires: 1});
		step = 3;
		$("#character_container").html("");
		$("#step2").hide();

		next_character();

		var coins = Cookies.get("vote_coins");
		if(coins) {
			my_votes = new Votes(JSON.parse(coins));
		}

		$("#step3").show();
		draw_characters();
		emitted = false;
	});

	socket.on("successful_send_vote", function() {
		next_character();
		draw_characters();
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
			html += "<div class='character' id='character-" + character._id + "'><div class='character-image'></div><div class='character-name'></div><div class='character-complement'></div></div>";
		});

		if(step === 2) {
			$("#character_container").html(html);
			draw_characters_step2(characters_left);
		}
		else if(step === 3) {
			$("#character_container_s3").html(html);
			draw_characters_step3();
		}

	}

	function draw_characters_step2(characters_left) {

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

	function draw_characters_step3() {

		characters.forEach(function(character) {
			
			$("#character-" + character._id + " .character-image").css("background-image", "url(\"" + character.img + "\")");	
			$("#character-" + character._id + " .character-name").html(character.name);
			$("#character-" + character._id).attr("data-togle", "modal");
			$("#character-" + character._id).attr("data-target", "#vote_modal");

			if(is_in_my_group(character)) {
				$("#character-" + character._id).addClass("character-disabled");
			}

			var character_coin = my_votes.getCoin(character._id);
			if(character_coin != null) {
				$("#character-" + character._id + " .character-complement").addClass("coin");
				$("#character-" + character._id + " .character-complement").html(character_coin);
			}
			
			if(my_votes.isCompleted()) $("#finish-button").removeClass("btn-disabled");

		});

		$(".character").attr("data-toggle", "modal");
		$(".character").attr("data-target", "#vote_modal");

		$(".coin").off("click");

		$(".character").on("click", function() {
			
			var id = get_character_id_from_jquery_object($(this));
			var character = get_character(id);

			$(".modal-header").html("Elige la puntuación para " + character.name);

			var modal_html = "";

			available_coins.forEach(function(coin) {
				modal_html += "<div id='coin-" + coin + "' class='coin aligner'>" + coin + "</div>";
			});

			$(".modal-body").html(modal_html);

			$(".coin").attr("data-dismiss", "modal");
			$(".coin").on("click", function() {

				var coin_id = get_numeric_id_from_jquery_object($(this), "coin-");

				// TODO this not working. Characters
				var character_present_coin = my_votes.getCoin(id);
				if(character_present_coin != null) my_votes[character_present_coin] = null;
				my_votes[coin_id] = character;

				if(my_votes.isCompleted()) $("#finish-button").removeClass("btn-disabled");
				else $("#finish-button").addClass("btn-disabled");

				Cookies.set("vote_coins", JSON.stringify(my_votes), {expires: 1});

				draw_characters();

			});

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
			Cookies.set("vote_selected_characters", JSON.stringify(my_characters), {expires: 1});
			current_character = get_character(my_characters.shift());
			$("#title_step3").html("<strong>" + current_character.name + "</strong>, elige la puntuación para cada personaje.")
			set_available_coins();
			my_votes = new Votes();
			emitted = false;
			return true;
		} else {
			$("#step3").hide();
			$("#step4").show();
			remove_cookies();
			emitted = false;
			return false;
		}
	}

	function set_available_coins() {

		var total_coins = characters.length - 1; // We do not count ourselves
		available_coins = [];

		characters.forEach(function(character) {
			if(!is_in_my_group(character)) {
				available_coins.push(total_coins--);
			}
		});	

	}

	function vote_start(code) {
		if(emitted) return;
		emitted = true;

		socket.emit("introduce_code", code);
	}

	function vote_send_characters() {
		if(emitted) return;
		emitted = true;

		socket.emit("select_characters", my_characters);
	}

	function vote_finish() {
		if(emitted) return;
		emitted = true;

		socket.emit("send_vote", current_character._id, my_votes.parseToSend());
	}

	function check_cookies() {

		var code = Cookies.get('vote_code');
		if(code && confirm("Hemos detectado que tenías una votación a medias. ¿Deseas continuarla?")) vote_start(code);
		else remove_cookies();

	}

	function get_character(id) {
		for(var i = 0; i < characters.length; i++) {
			if(characters[i]._id == id) return characters[i];
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
		return get_numeric_id_from_jquery_object($object, "character-");
	}

	function get_numeric_id_from_jquery_object($object, replaced_part) {
		return parseInt($object.attr("id").replace(replaced_part, ""));
	}

	function remove_cookies() {
		Cookies.remove('vote_code');
		Cookies.remove('vote_selected_characters');
		Cookies.remove('vote_coins');
	}

	function error(msg) {
		$(".error").html(msg);
		$(".error").slideDown();
		setTimeout(function() {
			$(".error").fadeOut();
		}, 5000);
	}

	function info(msg) {
		
	}

})(jQuery);