(function($) {

	var socket = io(), current_event, countdown = 10, countdown_interval, template, characters, present_character;

	$(document).ready(function() {

		checkConnection(function(response) {
			ticket = Cookies.get("ticket");
			setupLogout();
			user_id = response.id;

			current_event = Cookies.get("current_event");
			ticket = Cookies.get("ticket");
			
			socket.emit("create_vote", user_id, ticket, current_event);

		}, function() {
			disconnect();
		});

	});

	socket.on("create_vote_response", function(vote_id, characters_left, characters_, votes, event) {

		console.log(event);
		template = event.template;
		characters = event.characters;
		console.log(characters);
		$("#vote_code_input").val(vote_id);
		drawCharactersLeft(characters_left, characters, votes);

	});

	socket.on("refresh", function(characters_left, characters, votes) {
		drawCharactersLeft(characters_left, characters, votes);
	});

	function drawCharactersLeft(characters_left, characters, votes) {

		console.log(characters_left);

		if(characters_left.length <= 0) {
			prepareVote(votes);
			return;
		}

		$("#not_voted_title").html("Personajes que faltan por votar (" + characters_left.length + " / " + characters.length + "):");

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

	function prepareVote(votes) {
		$("#step1").hide();
		$("#step2").show();
		countdown_interval = setInterval(function() {
			if(--countdown <= 0) startVote(votes);
			$(".countdown").html(countdown);
		}, 1000);
	}

	function startVote(votes) {
		$("header").hide();
		$(".main").hide();
		$("#step3").show();
		clearInterval(countdown_interval);
		characters.forEach(function(character) {
			character.score = 0;
		});
		preview();
		scores = [];
		votes.forEach(function(character_vote) {
			console.log(character_vote);
			character_vote.votes.forEach(function(vote) {
				scores.push(vote);
			});
		});
		scores = shuffle(scores);
		var scores_interval = setInterval(function() {
			if(scores.length == 0) {
				present_character = -1;
				preview(false, true);
				clearInterval(scores_interval);
				return;
			}
			var next_score = scores.shift();
			get_character(next_score.character_id).score += next_score.vote;
			characters.sort(function(c1, c2) {
				if(c1 != c2) return c2.score - c1.score;
				else return sample([-1, 1]);
			});
			present_character = get_character_position(next_score.character_id);
			preview(next_score.vote);
		}, 4000);
	}

	function get_character(i) {
		for(var j in characters) {
			if(characters[j]._id === i) return characters[j];
		}
		return null;
	}

	function get_character_position(i) {
		for(var j in characters) {
			if(characters[j]._id === i) return (parseInt(j)+1);
		}
		return null;
	}

	function preview(vote, finished) {

		$(".main").css("padding", 0);

		$(".preview-column").html("");

		var $body = $(".preview-body").first();

		$body.css("background-color", template.background.color);
		if(template.background.link) {
			$body.css("background-image", "url(" + template.background.link + ")");
			if(!("type" in template.background)) template.background.type = "cover";
			console.log(template.background.type);
			switch(template.background.type) {
				case "repeat":
					$body.css("background-repeat", "repeat");
					$body.css("background-size", "auto");
				break;
				case "cover":
					$body.css("background-repeat", "no-repeat");
					$body.css("background-size", "cover");
				break;
				case "contain":
					$body.css("background-repeat", "no-repeat");
					$body.css("background-size", "contain");
				break;
				case "no_repeat":
					$body.css("background-repeat", "no-repeat");
					$body.css("background-size", "100% 100%");
				break;
				default:
				break;
			}
		}
		else $body.css("background-image", "none");
		if(finished) $(".preview-title").html(template.title_finished);
		else $(".preview-title").html(template.title);
		$(".preview-title").css("color", template.title_color || "#000");

		var number_characters = Math.min(template.number_characters, characters.length);

		var pos = 1;

		if(template.distribution_type == 'different' || (template.distribution_type == 'hybrid' && finished)) {
			for(var i = 0; i < Math.min(number_characters, 3); i++) {
				$("#preview-column-1").append(newPreviewElement(i));
				$(".preview-image").last().css("background-image", "url(" + characters[i].img + ")");
			}

			for(var i = 3; i < number_characters; i++) {
				$("#preview-column-2").append(newPreviewElement(i));
				$(".preview-image").last().css("background-image", "url(" + characters[i].img + ")");
			}

			$("#preview-column-2").css("padding-top", "30px");

			var rest_height = Math.min(parseInt(95/(number_characters-3)), 18);
			var winner_height = 34;
			var runnerup_height = 30;
			var third_height = 26;
			$(".preview-character").css("height", rest_height + "%");
			$("#preview-character-1").css("height", winner_height + "%");
			$("#preview-character-2").css("height", runnerup_height + "%");
			$("#preview-character-3").css("height", third_height + "%");
		} else {
			$("#preview-column-2").css("padding-top", "0");
			var column = 1;
			for(var i = 0; i < number_characters; i++) {
				if(i >= Math.ceil(number_characters/2)) column = 2;
				$("#preview-column-" + column).append(newPreviewElement(i));
				$(".preview-image").last().css("background-image", "url(" + characters[i].img + ")");
			}
			var rest_height = Math.min(parseInt(95/Math.ceil(number_characters/2)), 18);
			$(".preview-character").css("height", rest_height + "%");
		}

		$(".preview-character").css("font-size", Math.min(rest_height/3, 3) + "vh");
		$("#preview-character-1").css("font-size", Math.min(winner_height/3, 3) + "vh");
		$("#preview-character-2").css("font-size", Math.min(runnerup_height/3, 3) + "vh");
		$("#preview-character-3").css("font-size", Math.min(third_height/3, 3) + "vh");

		$(".preview-image-box").width($(".preview-image-box").last().height());
		$("#preview-image-box-1").width($("#preview-image-box-1").height());
		$("#preview-image-box-2").width($("#preview-image-box-2").height());
		$("#preview-image-box-3").width($("#preview-image-box-3").height());


		if(template.rest.border_opacity) {
			$(".preview-image").css("border-style", "solid");
			$(".preview-image").css("border-width", "1px");
			$(".preview-image").css("border-color", template.rest.color);
		}
		if(template.winner.border_opacity) {
			$("#preview-image-1").css("border-style", "solid");
			$("#preview-image-1").css("border-width", "3px");
			$("#preview-image-1").css("border-color", template.winner.color);
		}
		if(template.runnerup.border_opacity) {
			$("#preview-image-2").css("border-style", "solid");
			$("#preview-image-2").css("border-width", "3px");
			$("#preview-image-2").css("border-color", template.runnerup.color);
		}
		if(template.third.border_opacity) {
			$("#preview-image-3").css("border-style", "solid");
			$("#preview-image-3").css("border-width", "2px");
			$("#preview-image-3").css("border-color", template.third.color);
		}
		if(template.present.border_opacity) {
			$("#preview-image-" + present_character).css("border-style", "solid");
			$("#preview-image-" + present_character).css("border-width", "3px");
			$("#preview-image-" + present_character).css("border-color", template.present.color);
		}

		$(".preview-character").css("color", template.rest.color);
		$("#preview-character-1").css("color", template.winner.color);
		$("#preview-character-2").css("color", template.runnerup.color);
		$("#preview-character-3").css("color", template.third.color);
		$("#preview-character-" + present_character).css("color", template.present.color);

		if(vote) {
			var $adder = $("#adder");

			$adder.css("opacity", "1");
			$adder.css("color", template.present.color);
			$adder.css("top", ($("#preview-char-score-" + present_character).offset().top - 40) + "px");
			$adder.css("left", ($("#preview-char-score-" + present_character).offset().left - 20) + "px");

			$adder.html("+ " + vote);

			$adder.animate({
				top: ($("#preview-char-score-" + present_character).offset().top - 75) + "px",
				opacity: 0
			}, 2000);
			
		}

		function newPreviewElement(i) {
			return (
				"<div class='preview-character' id='preview-character-" + pos + "'>" + 
					pos + ". <div class='preview-image-box' id='preview-image-box-" + pos + "'>" + 
					 	"<div class='preview-image' id='preview-image-" + pos + "'></div>" + 
					"</div>" + 
				 	"<div class='preview-name' id='preview-name-" + pos + "'>" + 
				 		characters[i].name + 
				 	"</div>" + 
				 	"<div class='preview-char-score' id='preview-char-score-" + 
				 		(pos++) + "'>" + 
				 		characters[i].score + 
				 	"</div>" + 
				"</div>"
			);
		}

	}


})(jQuery);