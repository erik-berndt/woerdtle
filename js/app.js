const loginForm = document.getElementById('login-form');
const logNameEl = document.getElementById('loginName');

const date = new Date().toLocaleDateString().slice(0,21);

let manualDisplay = false;

let userLoggedIn;
let session;
let users = {};

let text = ""; // user input
let j = 1;     // counting rounds

const minLength = 4;
const maxLength = 8;

// chose a language
// let langArray = lang["de1"]; //de1, de2, en1
const myLangs = {
	de1: "de1",
	de2: "de2",
	en1: "en1",
	lat: "lat"
}


// check session and local storage
if (sessionStorage.getItem("userSession")){
	session = JSON.parse(sessionStorage.getItem("userSession"));
}
if (!localStorage.getItem("users")) {
	let newUser = { 
		name: "Dingsbums",
		total_score: 0,
		total_plays: 0,
		date : date,
		scores: [],
		lang: "de1",
		num_letters: 0
	};
	users["Dingsbums"] = newUser;
	localStorage.setItem("users", JSON.stringify(users));
} 

users = JSON.parse(localStorage.getItem("users"));

// Start Session
function startSession() {
	if (!sessionStorage.getItem("userSession")) {
		login();		
	} else {
		session = JSON.parse(sessionStorage.getItem("userSession"));
		userLoggedIn = session.name;
		console.log(users[userLoggedIn].lang)
		langArray = lang[users[userLoggedIn].lang]
		let num_letters = users[userLoggedIn].num_letters
		// console.log(num_letters);
		if (num_letters !== 0) {
			console.log("True");
			langArray = langArray.filter((word) => {
				return word.length === num_letters;
			})
			console.log(langArray.slice(0, 20));
		}
		const rank = getRanking(userLoggedIn);
		const langSetting = users[userLoggedIn].lang;
		let letterSetting = num_letters;
		
		if (users[userLoggedIn].num_letters === 0) {
			letterSetting = "Zufall"
		};
		$(".player").text(`${userLoggedIn}, ${rank}. Platz`);
		$(".player-settings").html(`Sprache: <strong>${langSetting}</strong> | Buchstaben: <strong>${letterSetting}</strong>`);
		$(".login-modal").css("display", "none");
		game();
	}
};

$('#settings').click(() => {
	$('.settings-modal').css("display", "flex");
	for (let i = minLength; i <= maxLength; i++) {
		if (users[userLoggedIn].num_letters === i) {
			$('#num-letter').append(`<option name="letters${i}" value="${i}" selected>${i}</option>`);
		} else {
			$('#num-letter').append(`<option name="letters${i}" value="${i}">${i}</option>`);
		}
	}
	Object.keys(myLangs).forEach((lang) => {
		if (users[userLoggedIn].lang === lang) {
			$('#lang-select').append(`<option value="${lang}" selected>${myLangs[lang]}</option>`);
		} else {
			$('#lang-select').append(`<option value="${lang}">${myLangs[lang]}</option>`);
		}
		})
	$('#settings-abort').click(() => {
		$('.settings-modal').css("display", "none");
		location.reload();
		return false;
	})	
});

$('#settings-form').submit((e) => {
	// e.preventDefault();
	const newLang = $('#lang-select').val();
	const newNumLetters = parseInt($('#num-letter').val()); 
	users[userLoggedIn].lang = newLang;
	users[userLoggedIn].num_letters = newNumLetters;
	console.log(newLang, newNumLetters);
	localStorage.setItem("users", JSON.stringify(users));
	location.reload();
}) 

// Login
function login() {
	$(".login-modal").css("display", "flex");
	
	$("#playNow").click(() => {
		sessionStorage.setItem("userSession", JSON.stringify({name: 'Dingsbums'}));
		startSession();
	});
	loginForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const date = new Date().toLocaleDateString("de-De");
		
		if (!logNameEl.value) {
			$("#errorMessage").text("Anonym spielen:");
			$("#errorMessage2").text("Button oben drücken!");
			return false;
		}
		if (!users[logNameEl.value]) {
			users[logNameEl.value] = { 
				name: logNameEl.value,
				total_score: 0,
				total_plays: 0,
				date : date,
				scores: [],
				lang: "de1",
				num_letters: 0		
			};
			localStorage.setItem("users", JSON.stringify(users));
		}
		
		sessionStorage.setItem("userSession", JSON.stringify({name: logNameEl.value}));
		startSession();
	});
}

startSession();

// get random word  
function game() {
	if (users[userLoggedIn].total_plays === 0) {
		console.log("noScore")
		$('.hideable').addClass('hide')
	} else {
		console.log("Score")
		$('.hideable').removeClass('hide')
	}
	let rand = Math.floor(Math.random() * langArray.length);
	const word = langArray[rand];	
	const limit = word.length;
	// Set dimension of Grid
	function checkLimit(limit) {
		if (limit < 8) {
			for (let i = 0; i < (8 - limit); i++) {
				$(".letter" + (7 - i)).css("display", "none");
			};
		};
	};
	checkLimit(limit);
	
	// Grid letter insertion
	function insertLetter(key) {
		if (text.length < limit && (key).match(/^[a-zA-ZäöüÄÖÜ]$/)) {
			var i = text.length % limit;
			text += key;
			$(".lb"+j+".letter" + i).text(key.toUpperCase());
		} else if (key === "Backspace" && text.length > 0) {
			text = text.slice(0, -1);
			i = (text.length) % limit;
			$(".lb" + j + ".letter" + i).text("");
		} else if (text.length === limit && key === "Enter") {
			isInWordlist(text);
			text = ""
			i = 0;
			j++
		}
	}
	
	// User input Keyboard 
	$(document).on("keydown", function(e) {
		insertLetter(e.key);
	});
	
	// User input touch, click 
	$(".abc").on("click", function() {
		if (this.innerHTML.slice(23,28) === "enter") {
			let key = "Enter";
			insertLetter(key)
		} else if (this.innerHTML.slice(23, 27) === "back") { 
			let key = "Backspace"
			insertLetter(key)
		} else {
			let key = this.innerHTML;
			insertLetter(key)
		}
	});	
	
	// Sleep function  
	function time(ms) {
		return new Promise((resolve, reject) => {
			setTimeout(resolve, ms);
		});
	}
	
	// Validation, flip colored letters
	async function showSuccess(guess) {
		await time(100);
		let guessL = guess.toLowerCase().split('');
		let guessLength = guess.length;
		let green = [];
		let yellow =[];
		for (let i = 0; i < guessLength; i++) {
			let regExLetter = new RegExp(guess[i], 'ig');
			if (guessL[i] === word[i].toLowerCase()) {
				$(".lb" + (j-1) + ".letter" + i).slideUp(250).addClass("checked exact").slideDown(250);
				$("." + guessL[i]).css("backgroundColor", "#6d8874");
				green.push(guessL[i]);
				await time(450);
				continue;
			} else if (word.match(regExLetter)) {
				let gLength = countOccurency(guessL, guessL[i]);
				let wLength = word.match(regExLetter).length;
				if ( gLength < wLength || gLength === wLength ) {	
					$(".lb" + (j-1) + ".letter" + i).slideUp(250).addClass("checked okay").slideDown(250);
					if (!green.includes(guessL[i])) {
						$("." + guessL[i]).css("backgroundColor", "#d7a86e");
						yellow.push(guessL[i]);
					}
					await time(450);
					continue;
				} else {
					$(".lb" + (j-1) + ".letter" + i).slideUp(250).addClass("checked nope").slideDown(250);
					if (!green.includes(guessL[i]) && !yellow.includes(guessL[i])) {
						$("." + guessL[i]).css("backgroundColor", "#444");
					}
					guessL[i] = "-";	
				}
			} else {
				$(".lb" + (j-1) + ".letter" + i).slideUp(250).addClass("checked nope").slideDown(250);
				$("." + guessL[i]).css("backgroundColor", "#444");
			};
			await time(450);
		};
	};
	
	// Wordlist incluedes guessed word ?
	async function isInWordlist(text) {
		text = text[0].toUpperCase() + text.slice(1).toLowerCase();
		if (text !== word) {
			if (langArray.includes(text)) {
				// Global j = 1
				if ( j === 6) {
					lastRound(text);
				}	else {
					showSuccess(text);
				}
			} else {
				await time(100);
				for (let k = 0; k < limit; k++) {
					$(`.lb${j-1}.letter${k}`).text('').fadeOut(200).fadeIn(200);
					await time(50);
				}
				j--;
			};
		} else {
			showSuccess(word);
			await time(word.length * 480)
			const newScore = word.length * (8-j);
			$('.keyboard-container').css('visibility', 'hidden');
			score(newScore, j);
		};
	};
	
	//  Last guess was worng  
	function lastRound(guess) {
		const guessL = guess.toLowerCase().split("");
		const guessLength = guess.length;
		for (let i = 0; i < guessLength; i++) {
			if (guessL[i] === word[i].toLowerCase()) {
				$(".lb" + (j) + ".letter" + i).addClass("exact");
				$("." + guessL[i]).css("backgroundColor", "#6d8874");
				continue;
			} else {
				$(".lb" + (j) + ".letter" + i).text(word[i].toUpperCase());
				$(".lb" + (j) + ".letter" + i).addClass("lose");
			}
		};
		score(-guessLength, j);
	};
	
	// Occurencies of letter in word (to avoid bad colorization)
	function countOccurency(word, letter) {
		let num = 0;
		for (item in word) {
			if (word[item] === letter) {
				num++;
			}
		}
		return num;
	};
	
	// Game Over
	function score(points, tries) {
		if ( points > 0 ) {
			$('.success-container.win').slideDown();
			rand = Math.floor(Math.random() * comments.length);
			comment = comments[rand].lob;
			$('.keyboard-container').css('visibility', 'hidden');
			$('#win').text(comment);
			$('#plus').text(`${points} Punkte für dich!`);
			tries--
		} else {
			$('.success-container.lose').slideDown();
			rand = Math.floor(Math.random() * comments.length);
			comment = comments[rand].tadel;
			$('.keyboard-container').css('visibility', 'hidden');
			$('#lose').text(comment);
			$('#minus').text(`Du kriegst ${Math.abs(points)} Punkte abgezogen!`);
			tries++
		}
		users[userLoggedIn].total_plays += 1;
		users[userLoggedIn].total_score += points;
		
		users[userLoggedIn].scores.push([points, tries, word, date]);
		localStorage.setItem('users', JSON.stringify(users));
		
		$('.success-container').click(() => {location.reload();});
		$(document).on('keydown', function() {
			location.reload();
		});
	}
	
	// Manual show/hide
	$('#manual').click(() => {
		if (manualDisplay === false) {
			$('.manual-container').slideDown();
			manualDisplay = true;
		} else {
			$('.manual-container').slideUp();
			$('.manual-container').click(() => {
				$('.manual-container').slideUp();
			});
			manualDisplay = false;
		}
	});	
}

// Highscore
function getScore() {
	if (userLoggedIn !== 'Dingssbums') {
		let high = Object.keys(users).map((v) => [users[v].total_score, users[v].name])
		high = high.sort(function (a, b) {
			return b[0] - a[0];
		});
		
		for (let i = 0; i < high.length; i++) {
			let x = 1 + i;
			const user = high[i][1];
			if (user !== 'Dingssbums') {
				$('.rank' + (x)).append(`
				<div class='l'>${x}.</div>
				<div class='m'>${users[user].name}</div>
				<div class='re'>${users[user].total_score}
				<small>(${users[user].total_plays})</small>
				</div>`);
			} else {
				x--;
			}
		}
	} else {
		$('.score-container').css('display', 'none');
		$('#anonymous').css('display', 'block');
	}
};

$('#scoring').onload = getScore();

// Statistics
function getStatistics() {
	if (userLoggedIn === 'Dingssbums') {
		$('.statistics-container').css('display', 'none');
		$('#anonymous').css('display', 'block');
	} else if (userLoggedIn) {
		const allTries = [
			{ tries: [] },
			{ tries: [] },
			{ tries: [] },
			{ tries: [] },
			{ tries: [] },
			{ tries: [] },
			{ tries: [] }
		];
		
		let maxTries = 0;
		let vers;
		const result = users[userLoggedIn].scores;
		for (const game of result) {
			allTries[(game[1] - 1)].tries.push(game[2]);
			if (allTries[(game[1] - 1)].tries.length > maxTries) {
				maxTries = allTries[(game[1] - 1)].tries.length;
			}
			if (game[1] == 7) {
				vers = "x";
			} else {
				vers = game[1];
			}
			$("#show-total").after("<div class='wordlist'><div>" +
			game[2] + "</div><div class='smaller'>" +
			game[3] + " (" + vers + ")</div></div>");
		};
		
		const username = userLoggedIn;
		const total = users[userLoggedIn].total_plays;
		const score = users[userLoggedIn].total_score;
		const lose = allTries[6].tries.length;
		const win = total - lose;
		const actualTries = result[result.length - 1].tries;
		const factor = total / maxTries;
		
		$('.big-header').text(username);
		$('.entry_date').text(users[userLoggedIn].date);
		
		$('.big-header2').text(`${score} Punkte`);
		$('.plays').text(`${total} Spiele`);
		
		$('.try' + actualTries).css('backgroundColor', '#5FD068');
		
		allTries.forEach((key, index) => {
			if (index === 6) {
				const perc7 = (lose * 100 / total).toFixed(1);
				$('.try7').animate({ height: 100 - perc7 + '%' }, 1000);
				$('.percentage7').text(100 - perc7 + '%');
				$('.number7').text(total - lose + ' Gewonnen');
			} else {
				
				const perc = (key.tries.length * 100 / total).toFixed(1);
				const i = (index + 1).toString();
				$('.try' + i).animate({ height: factor * perc + '%' }, 1000);
				$('.number' + i).text(perc + '%');
				$('.percentage' + i).text(key.tries.length);
			}
		});
		rank = getRanking(username);
		$("#rank").text(`${rank}. Platz`);
	}	
};

$('#statistics').onload = getStatistics();


function getRanking(name) {
	
	let high = Object.keys(users).map((v) => [users[v].total_score, users[v].name])
	
	high = high.sort(function (a, b) {
		return b[0] - a[0];
	});
	
	const rank = high.findIndex(player => player[1] === name)
	return (rank + 1)
};	

$("#show-words").mouseover(function() {
	$("#show-words").text("Liste");
});

$("#show-words").mouseout(function() {
	$("#show-words").text("Gesamt");
});

$("#show-total").mouseover(function() {
	$("#show-total").text("Total");
});

$("#show-total").mouseout(function() {
	$("#show-total").text("Wortliste");
});

$("#total-tries").show();
$("#all-words").hide();

$("#show-words").click(function() {
	$("#total-tries").hide();
	$("#all-words").show();
});

$("#show-total").click(function() {
	$("#total-tries").show();
	$("#all-words").hide();
});

$(".logout").click(() => {
	console.log("logout clicked");
	sessionStorage.clear();
	location.href = "index.html";
	$(".player").text("?");
	startSession();
});
