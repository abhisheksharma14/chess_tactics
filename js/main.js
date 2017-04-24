// available tcatics
var tactics = [
	['6k1/5p1p/4p1p1/2p1P3/2P4P/3P2PK/R1Q3B1/1r1n2q1 b - - 0 1', '...Ra1 if Rxa1 Nf2+' ],
	['3r2k1/4qppp/p7/1pp1n3/4P3/BP6/P2R1PPP/3Q2K1 b - - 0 1', '...Nf3+ gxf3 Qg5+' ],
	['6k1/5p2/6p1/3Q4/3P1K1P/5P2/1P2r1q1/R7 b - - 0 1', '...Qh2+ if Kg5 Qg3+ Kf6 Qf4+' ],
	['3rnrk1/1b3pp1/1q2p1P1/p3P3/1p1N4/4Q3/PPP4P/2KR1R2 w - - 0 1', 'Qh3 fxg6 Rxf8+ Kxf8 Nxe6+'],
	['8/8/8/2Q5/8/3K4/1k6/q7 w - - 0 1', 'Qb4+ Ka2 Kc2 Qd1+ Kxd1 Ka1 Kc2 Ka2 Qb2#'],
	['r3k2r/4b2p/3pBp2/1bq5/1p2P3/3N4/PpP1Q1PP/1K1R1R2 w - - 0 1', 'Rf5 Qb6 Qh5+ Kd8 Rxb5'],
	['3r1k2/1b3p1p/p7/1pp4n/8/2PP1q1P/PPB2Q2/4RNK1 w - - 0 1','Qxc5+ Kg7 Qg5+'],
	['8/5b2/6p1/P6p/5k2/1PNn4/6P1/6K1 w - - 0 1','a6 if Be8 Nd5+ Ke5 Ne7'],
	['r2qkb1r/3bpp2/p1np1p2/1p3P2/3NP2p/2N5/PPPQB1PP/R4RK1 b kq - 0 1','...Bh6 Qd3 Qb6 if Rad1 Qxd4+'],
];

// this functions matches the player move with that in tactics. If the move matches return true else false.
// it checks for the index of current move with the moves available in tactics. If the index is found, it return true.
function checkSolution(){
	var tmpTact = currentTactic[1].replace('...','').split(" ");
	if (tmpTact.indexOf(currentMove.san) != -1){
		return true;
	}else{
		return false;
	}
};

// store current tactic in memory so that we update the available moves
var currentTactic = [];

// this functions update the loaded tactics in memory. It removes the moves that have taken place by user or bot.
function updateTacticOnMoveEnd(currentMove){
	// replace the ... if any and overwrite the current tactic array
	currentTactic[1] = currentTactic[1].replace('...','');
	// array of available moves (both players)
	var tmpMoves = currentTactic[1].split(" ");
	// find index of current move played
	var idxOfCrntMv = tmpMoves.indexOf(currentMove.san);
	// remove the moves that have taken place already from the current tactics
	if (tmpMoves[1] == 'if' || tmpMoves[1] == 'or') {
		var addIdx = 3;
	}else{
		var addIdx = 2;
	}
	tmpMoves = tmpMoves.splice(idxOfCrntMv+addIdx,tmpMoves.length);
	// convert array to string and overwrite currentTactic moves
	currentTactic[1] = tmpMoves.join(" ");
};

// global variable to store current move info
var currentMove = {};

function loadTactic(){
	if (tactics.length == 0) {
		alert("No more tactics to be solved. Refresh to try again.");
		return false;
	}
	var tacticSolved = false;
	var randNum = Math.floor(Math.random() * tactics.length);
	currentTactic = tactics[randNum];
	tactics.splice(randNum,1);
	var board,
		game = new Chess(currentTactic[0]),
    	statusEl = $('#status'),
		fenEl = $('#fen'),
		pgnEl = $('#pgn');

		// do not pick up pieces if the game is over
		// only pick up pieces for the side to move
	var onDragStart = function(source, piece, position, orientation) {
		if (tacticSolved){
			return false;
		}
		if (game.game_over() === true ||
			(game.turn() === 'w' && piece.search(/^b/) !== -1) ||
			(game.turn() === 'b' && piece.search(/^w/) !== -1)) {
			return false;
		}
	};

	//the tricky part
	var onDrop = function(source, target) {
		// see if the move is legal
		var move = game.move({
			from: source,
			to: target,
			promotion: 'q' // NOTE: always promote to a queen for example simplicity
		});
		currentMove = move;
		if (move === null){
			return 'snapback';
		} else if(checkSolution()) { // check if the move is according to the tactics or not.
			var tmpTact = currentTactic[1].replace('...','').split(" ");
			var pos = board.position();
			// loop through the tactic array to find the next move for bot.
			for (var t in tmpTact){
				// ignore cases like if, or, player current move (since the current tactic array has not been updated yet,
				// we need to ignore current move which is most likely to be present on the 0th index of array)
				if (tmpTact[t] == "if" || tmpTact[t] == "or" || tmpTact[t] == currentMove.san) {
					if (currentTactic[1].split(" ").length == 1) {
						tacticSolved = true;
						alert("Tactic Solved.Try another tactic.");
					}
					continue;
				}
				// (not sure why two boards are initialized here.  may be one for ui and other for library)
				board.move(tmpTact[t]); // the ui
				game.move(tmpTact[t]); // the library chess.js
				updateTacticOnMoveEnd(currentMove);
				break;
			}
		}else{
			// undo the step if not according to the tactics but valid
			game.undo();
			alert("Try another move.");
			return 'snapback';
		}
		updateStatus();
	};

	// update the board position after the piece snap 
	// for castling, en passant, pawn promotion
	var onSnapEnd = function() {
		board.position(game.fen());
	};

	var updateStatus = function() {
		var status = '';
		var moveColor = 'White';
		if (game.turn() === 'b') {
			moveColor = 'Black';
		}

		if (game.in_checkmate() === true) {
			status = 'Game over, ' + moveColor + ' is in checkmate.';
		} else if (game.in_draw() === true) {
			status = 'Game over, drawn position';
		} else {
			status = moveColor + ' to move';
			if (game.in_check() === true) {
				status += ', ' + moveColor + ' is in check';
			}
		}
		statusEl.html(status);
		fenEl.html(game.fen());
		pgnEl.html(game.pgn());
	};

	updateStatus();	
	var cfg = {
		draggable: true,
		position: currentTactic[0],
		onDragStart: onDragStart,
		onDrop: onDrop,
		onSnapEnd: onSnapEnd,
		dropOffBoard: 'snapback'
	};

	board = ChessBoard('board', cfg);
	position = board.position();
};

loadTactic();