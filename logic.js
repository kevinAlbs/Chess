/* class for analyzing state of any array of piece objects to see each of their optional moves
*/

CHESSAPP.Analyzer ={
	//information regarding whether the squares next to the kings are being attacked, which makes castling impossible
	castlingInfo: {
		W: {
			left: false,
			right: false
		},	
		B: {
			left: false,
			right: false
		}
	},

	/*
	   returns an array of option arrays all corresponding to each piece index
	   */
	makeAllOptions : function(settings){
		var stg = {
			pieces: null
		};

		//reset the castling info
		this.castlingInfo.B.left = false;
		this.castlingInfo.B.right = false;
		this.castlingInfo.W.left = false;
		this.castlingInfo.W.right = false;

		CHESSAPP.utils.extend(stg, settings);
		var pieces = stg.pieces;
		var max = pieces.length;
		var resp = {
			kingInCheck : false,
			allOptions : []
		};
		var r,
			whiteKingIndex,//temps for later
			blackKingIndex;
		for(var i = 0; i < pieces.length; i++){
			if(pieces[i] && pieces[i].pieceType == "king"){
				if(pieces[i].color == "W"){
					whiteKingIndex = i;
				}
				else{
					blackKingIndex = i;
				}
			}
			if(pieces[i] && CHESSAPP.GamePlay.getTurn() == pieces[i].color){//pieces can be null if taken
				pieces[i].justMoved = false;
			}
			r = this.getOptions({pieces: pieces, piece: pieces[i], checkTest : false});
			if(r && r.checkDetected){
				if(r.checkDetected){
					resp.kingInCheck = r.checkDetected;
				}
			}

			resp.allOptions.push(r.pieceOptions);
		}

		//now check for castling here. The reason being that we need to know whether or not the two spaces
		//on either side are being attacked. This is checked one by one for each piece, so the castling needs to be checked at the end

		if(resp.kingInCheck != "W"){
			//you cannot castle if you're in check
			r = this.getOptions({pieces: pieces, piece: pieces[whiteKingIndex], checkTest: false, castleTest: true});
			if(r && r.checkDetected){
				if(r.checkDetected){
					resp.kingInCheck = r.checkDetected;
				}
			}
			console.log("HERE : " , r);
			resp.allOptions[whiteKingIndex] = resp.allOptions[whiteKingIndex].concat(r.pieceOptions);
		}
		if(resp.kingInCheck != "B"){
			resp.allOptions.push(r.pieceOptions);
			r = this.getOptions({pieces: pieces, piece: pieces[blackKingIndex], checkTest: false, castleTest: true});
			if(r && r.checkDetected){
				if(r.checkDetected){
					resp.kingInCheck = r.checkDetected;
				}
			}
			resp.allOptions[blackKingIndex] = resp.allOptions[blackKingIndex].concat(r.pieceOptions);
		}

		resp.allOptions.push(r.pieceOptions);
		return resp;
	},
	/*
	   returns true or false if the king of the specified color (in the parameter object) is in check
	   */
	checkTest : function(settings){
		var stg = {
			pieces: null,
			color: 'W'
		};
		CHESSAPP.utils.extend(stg, settings);
		var pieces = stg.pieces,
		    color = stg.color;

		for(var i = 0; i < pieces.length; i++){
			var r = this.getOptions({pieces: pieces, piece: pieces[i], checkTest : color});   
			if(r && r.checkDetected == color){
				//console.log("Check detected");
				return true;
			}

		}
		return false;
	},
	/*
	 *gets the options for a single piece in the array pieces
	 *
	 */
	getOptions : function(settings){
		var stg = {
			pieces: null,
			piece: null,
			checkTest : false,
			castleTest: false
		};
		CHESSAPP.utils.extend(stg, settings);

		var piece = stg.piece,
		    pieces = stg.pieces;

		var resp = {
			checkDetected : false,
			pieceOptions: null
		};
		if(!piece){
			return resp;
		}
		var pieceOptions = [],
		    curx = parseInt(piece.x),
		    cury = parseInt(piece.y),
		    color = piece.color,
		    type = piece.pieceType;

		var checkFound = false;
		/* shortcut */
		var mk = function(x,y,m,a,s){
			var r =  CHESSAPP.Analyzer.makeOption({pieces: pieces, x: x, y: y, piece: piece, canMove: m, canAttack: a, checkTest: stg.checkTest, special: s});
			if(r.checkDetected){
				resp.checkDetected = r.checkDetected;
			}
			if(r.valid){
				if(stg.castleTest){
					console.log("Adding castle", r);
				}
				if(!stg.checkTest){
					if(piece.color == "B"){
						if((x == 3 || x == 2) && y == 7){
							CHESSAPP.Analyzer.castlingInfo.W.left = true;
						}
						else if((x == 5 || x == 6) && y == 7){
							CHESSAPP.Analyzer.castlingInfo.W.right = true;
						}
					}
					else if(piece.color == "W"){
						if((x == 3 || x == 2)&& y == 0){
							CHESSAPP.Analyzer.castlingInfo.B.left = true;
						}
						else if((x == 5 || x == 6) && y == 0){
							CHESSAPP.Analyzer.castlingInfo.B.right = true;
						}
					}
				}
				pieceOptions.push(r);
			}
			return r.canMovePast;
		};

		var flip = (color == 'B') ? 1 : -1;

		switch(type){
			case "pawn": 

				var tmp = mk(curx,cury + 1 * flip, true, false);
				if(piece.numOfMoves == 0 && tmp){
					//if the pawn hasn't yet move, add the second space available
					mk(curx, cury + 2 * flip, true, false);
				}
				//check for en passant on both sides
				var rp = CHESSAPP.Analyzer.pieceExists({pieces: pieces, x: (curx + 1), y: cury});
				if(rp != null && rp.color != piece.color && rp.pieceType == "pawn" && rp.justMoved && rp.numOfMoves == 1 && (rp.y == 3 || rp.y == 4)){
					var special = {
						type: "en",
						enx : curx + 1,
						eny : cury
					};
					mk(curx+1, cury + 1 * flip, true, true, special);
				}
				//check for en passant on both sides
				rp = CHESSAPP.Analyzer.pieceExists({pieces: pieces, x: (curx - 1), y: cury});
				if(rp != null && rp.color != piece.color && rp.pieceType == "pawn" && rp.justMoved && rp.numOfMoves == 1 && (rp.y == 3 || rp.y == 4)){
					var special = {
						type: "en",
						enx : curx - 1,
						eny : cury
					};
					mk(curx+1, cury - 1 * flip, true, true, special);
				}

				//check if pieces in either attack location
				if(CHESSAPP.Analyzer.pieceExists({pieces: pieces, x: (curx + 1), y: (cury + 1 * flip)})){
					mk(curx + 1,cury + 1 * flip, false, true);
				}
				if(CHESSAPP.Analyzer.pieceExists({pieces: pieces, x: (curx - 1), y: (cury + 1 * flip)})){
					mk(curx - 1,cury + 1 * flip, false, true);
				}
				break;
			case "king":
			if(stg.castleTest){
					//check for castling...

					var leftCastle = true,
						rightCastle = true;

					//king has moved
					if(piece.numOfMoves > 0 || CHESSAPP.GamePlay.kingInCheck == piece.color){
						leftCastle = false;
						rightCastle = false;
					}
					else{
						//check left side

						//check if those spaces are being attacked
						if(this.castlingInfo[piece.color].left){
							//piece is attacking left side, this is invalid
							leftCastle = false;
						}
						else{
							//check that spaces are empty and find the rooks on both sides
							var leftP;//will hold rook
							for(var i = 1; i <= 4; i++){
								leftP = CHESSAPP.Analyzer.pieceExists({pieces: pieces, x: (curx - i), y : cury});
								if(i < 4 && leftP != null){
									//not possible, piece in the way
									leftCastle = false;
								}
							}
							//leftP should hold the left most piece
							if(leftP != null && leftP.pieceType == "rook" && leftP.color == piece.color && leftP.numOfMoves == 0){
								//valid
							}
							else{
								leftCastle = false;
							}
						}
						//check right side
						//check if those spaces are being attacked
						if(this.castlingInfo[piece.color].right){
							//piece is attacking left side, this is invalid
							rightCastle = false;
						}
						else{
							//check that spaces are empty and find the rooks on both sides
							var rightP;//will hold rook
							for(var i = 1; i <= 3; i++){
								rightP = CHESSAPP.Analyzer.pieceExists({pieces: pieces, x: (curx + i), y : cury});
								if(i < 3 && rightP != null){
									//not possible, piece in the way
									rightCastle = false;
								}
							}
							//rightP should hold the right most piece
							if(rightP != null && rightP.pieceType == "rook" && rightP.color == piece.color && rightP.numOfMoves == 0){
								//valid
							}
							else{
								rightCastle = false;
							}
						}
						
					}
					if(leftCastle){
						//should be valid
						//now make that move
						var special = {
							type:"castle",
							side: "left",
							rookx : curx - 4,
							rooky : cury,
							rooktox : curx - 1,
							rooktoy : cury
						};
						mk(curx - 2, cury, true, false, special);
					}
					if(rightCastle){
						//should be valid
						//now make that move
						var special = {
							type:"castle",
							side: "right",
							rookx : curx + 3,
							rooky : cury,
							rooktox : curx + 1,
							rooktoy : cury
						};
						mk(curx + 2, cury, true, false, special);
					}
					if(leftCastle && !stg.checkTest){
							console.log(leftCastle + " for castling color " + piece.color + " left");
					}
					else if(!leftCastle && !stg.checkTest){
							console.log(leftCastle + " for castling color " + piece.color + " left"); 
					}

					if(rightCastle && !stg.checkTest){
							console.log(rightCastle + " for castling color " + piece.color + " right");
					}
					else if(!rightCastle && !stg.checkTest){
							console.log(rightCastle + " for castling color " + piece.color + " right"); 
					}
				}
				else{
					//normal checks
					mk(curx - 1, cury + 1, true, true);
					mk(curx - 1, cury, true, true);
					mk(curx - 1, cury - 1, true, true);
					mk(curx + 1, cury + 1, true, true);
					mk(curx + 1, cury, true, true);
					mk(curx + 1, cury - 1, true, true);
					mk(curx, cury + 1, true, true);
					mk(curx, cury - 1, true, true);
				}

				break;
			case "knight":
				mk(curx - 1, cury + 2, true, true);
				mk(curx - 1, cury - 2, true, true);
				mk(curx + 1, cury + 2, true, true);
				mk(curx + 1, cury - 2, true, true);
				mk(curx - 2, cury + 1, true, true);
				mk(curx - 2, cury - 1, true, true);
				mk(curx + 2, cury + 1, true, true);
				mk(curx + 2, cury - 1, true, true);
				break;
			case "bishop":
			case "rook":
			case "queen":
				//this is only horizontal and vertical (applies only to bishop and rook)
				if(type != "bishop"){
					//horizontal
					for(var i = curx - 1; i >= 0; i--){
						if(!mk(i,cury, true, true)){
							break;}              
					}
					for(var j = curx + 1; j <= 7; j++){
						if(!mk(j,cury,true, true)){
							break;
						}          
					}
					//vertical
					for(var k = cury - 1; k >= 0; k--){
						if(!mk(curx,k,true, true)){
							break;
						}               
					}
					for(var l = cury + 1; l <= 7; l++){
						if(!mk(curx,l,true, true)){
							break;
						}              
					}
				}
				//applies only to queen and bishop
				if(type != "rook"){
					//top left
					for(var i = 1; i <= Math.min(curx, cury); i++){
						if(!mk(curx - i,cury - i, true, true)){
							break;}
					}
					//bottom left
					for(var i = 1; i <= 7 - Math.max(curx, cury); i++){
						if(!mk(curx + i,cury + i, true, true)){
							break;}
					}
					//top right
					for(var i = 1; i <= Math.min(7 - curx, cury); i++){
						if(!mk(curx + i,cury - i, true, true)){
							break;}
					}
					//bottom right
					for(var i = 1; i <= Math.min(curx, 7 - cury); i++){
						if(!mk(curx - i,cury + i, true, true)){
							break;}
					}
				}
				break;
		}

		if(stg.checkTest){
			//this is only a check test, we don't need the actual options
			return resp;
		}
		resp.pieceOptions = pieceOptions;
		return resp;
	},
	withinBounds : function(x,y){
		return ((x >= 0 && x <= 7) && (y >= 0 && y <= 7));
	},
	/*
	 * When making an option for a piece, it checks if making that move would leave the players king in check.
	 * Therefore, for each option a piece has, every permutation of moves on the opponents team must be checked to see
	 * if it would leave that players king in check. If it would, then it is an invalid move
	 */
	makeOption : function(settings){
		var stg = {
			pieces: null,//set of pieces
			piece: null,//current piece
			canAttack: true,
			canMove: true,
			checkTest: false,
			x: -1,
			y: -1,
			special: null
		};
		CHESSAPP.utils.extend(stg, settings);
		var x = stg.x, y = stg.y, piece = stg.piece, pieces = stg.pieces, special = stg.special;

		var resp = {
			x: x,
			y: y,
			valid : true, //same as saying (attackable || movable) says whether piece can actually move (with or without attacking)
			attackable : false,
			movable: false,
			canMovePast : true,
			checkDetected : false,
			special: special
		};

		if(!this.withinBounds(x,y)){
			resp.valid = false;
			return resp;
		}
		var pieceExists = null;//piece to be attackec
		if(special == null){
			//normal move
	       		pieceExists = this.pieceExists({pieces: pieces, x : x, y : y, checkTest: stg.checkTest});
		}
		else if(special.type == "en"){
			//en passant	
			
			pieceExists = this.pieceExists({pieces: pieces, x : special.enx, y : special.eny, checkTest: stg.checkTest});
			if(!stg.checkTest){
				console.log("Checking en passant piece");
				console.log(pieceExists);
			}
		}
		else if(special.type == "castle"){
			//the checkTest is not necessary because checks have already been made for if the squares to this castling side are
			//being attacked, and moving cannot introduce any new attacks since this is on the edge of the board
			//therefore nothing to do here :P
			resp.movable = true;
			return resp;
		}
		if(pieceExists){
			//check if this is a valid location for possible option
			//pieceExists should refer to the actual piece
			if(stg.piece.color == pieceExists.color){
				//ignore same color
				resp.valid = false;
				resp.canMovePast = false; //it cannot move past a piece of its own color
			}
			else{
				if(stg.canAttack){
					resp.attackable = true;
					if(pieceExists.pieceType == "king")
					{
						//if it is a check test, only set it equal if the color is equal to the color being looked for
						if((stg.checkTest && stg.checkTest == pieceExists.color) || !stg.checkTest){
							resp.checkDetected = pieceExists.color;
							return resp; //return early, because more piece checking is unnecessary
						}
						else{
							resp.checkDetected = pieceExists.color;
						}              
					}

					resp.canMovePast = false;//can't move past it if it's attacking it
				}
				else{
					//it will never be able to move on an occupied space if it can't attack it
					resp.valid = false;
					resp.canMovePast = false; //it cannot move past a piece it can't attack
				}
			}
		}
		if(stg.canMove && resp.valid){
			resp.movable = true;
		}

		resp.valid = resp.attackable || resp.movable;

		if(!stg.checkTest && resp.valid){

			var pieceObj = {
				pieceType: piece.pieceType,
				color: piece.color,
				x: x,
				y: y
			};
			//if this is not a check test, check if this possible move would leave the own king in check
			//final check, see if this would leave the king of the own color in check
			var pieceOverrides = 
				[
				{
					pieceIndex: pieces.indexOf(piece), 
					val: pieceObj
				}
			];      

			if(resp.attackable){
				//add override
				pieceOverrides.push({
					pieceIndex: pieces.indexOf(pieceExists),
					val: null
				});
			}


			var newPieces = this.copyAndReplace({pieces: pieces, overrides: pieceOverrides});
			//console.log(newPieces);

			if(this.checkTest({pieces: newPieces, color: piece.color})){
				//invalid move because it leaves the king in check
				//	console.log("YOUR ARGUMENT IS INVALID");
				resp.valid = false;
			}


		}

		return resp;
	},

	pieceExists : function(settings){
		var stg = {
			checkTest: false,
			pieces: null,
			x: -1,
			y: -1
		};

		CHESSAPP.utils.extend(stg, settings);

		var pieces = stg.pieces,
		    x = stg.x,
		    y = stg.y;
		if(!this.withinBounds(x,y)){
			return null;
		}
		for(var i = 0; i < pieces.length; i++){
			if(pieces[i]){
				if(pieces[i].x == x && pieces[i].y == y){
					return pieces[i];
				}
			}
		}
		return null;
	},

	copyAndReplace : function(settings){
		var stg = {
			pieces: null,
			overrides: null
		},
		newArray,
		max,
		max_o;

		CHESSAPP.utils.extend(stg, settings);

		max = stg.pieces.length;
		max_o = stg.overrides.length;

		newArray = new Array(max);
		for(var i = 0; i < max; i++){        
			newArray[i] = CHESSAPP.utils.shallowCopy(stg.pieces[i]);
		}
		for(var j = 0; j < max_o; j++){
			var index = stg.overrides[j].pieceIndex;
			newArray[index] = null;
			newArray[index] = stg.overrides[j].val;
		}



		return newArray;
	}
};

/* This class holds logic for calculating check/checkmate, available moves
 *
 */
CHESSAPP.GamePlay = (function(){
	var that = {}, 
	pieceGettingPromoted = null;

that.pieces = []; 
that.cells;
that.moveList = [];


var _settings;//private variable which stores information about the player and state of the game

var options = [],//array of options for every piece on actual board
	overrides = {},//object with keys of indexes corresponding to actual pieces, and values of their theoretical location
	selectedPieceIndex = -1;

var toFile = function(num){
	//returns letter A-H since A is number 65 in unicode
	console.log(65+num);
	return String.fromCharCode(96+parseInt(num));
};


var toAbbr = function(pieceType){
	switch(pieceType){
		case "pawn":
			return "";
			break;
		case "queen":
			return "Q";
			break;
		case "king":
			return "K";
			break;
		case "bishop":
			return "B";
			break;
		case "rook":
			return "R";
			break;
		case "knight":
			return "N";
			break;
	}
};

that.getTurn = function(){
	return _settings.turn;
}
/*
 * adds the move specified to the public moveList array, and updates the UI with the new move
 * @param move
 * an object that should have the following data:
 * {
 fromX: <number>
 toX: <number>
 toY: <number>
 pieceType: <string>
 killed: <boolean>
 promoted: <string>
 }
 */
that.addToMoveList = function(move){
	var tos = "";

	that.moveList.push(move);

	if(move.promotion){
		console.log("HERE");
		tos += toFile(parseInt(move.fromX)+1);
		tos += (8 - (parseInt(move.toY)));
		tos += "=";
		tos += toAbbr(move.pieceType);//was recently promoted to the type it is at now
	}
	else{
		tos = toAbbr(move.pieceType);

		if(move.killed){
			if(tos == ""){
				//add pawn file
				tos += toFile(parseInt(move.fromX)+1);
			}
			tos += "x";
		}

		tos += toFile(parseInt(move.toX)+1);
		tos += (8 - (parseInt(move.toY)));
	}
	CHESSAPP.ui.addMove(tos);
	console.log("Move notation: " + tos);
};
that.statusUpdate = function(stg){
	CHESSAPP.ui.statusUpdate(stg);
}
that.setOnlineColor = function(color){
	if(color == 'W' || color == 'B'){
		_settings.onlineColor = color;
	}
};
that.sendMove = function(move){
	if(_settings.online && move){
		//if this is online play, let the other player know
		CHESSAPP.onlinePlay.sendMove(move);
	}
};

that.switchTurn = function(){
	if(_settings.turn == "W"){
		_settings.turn = "B";
	}else{
		_settings.turn = "W";
	}
};

that.pieceClicked = function(piece){ 
	var color = piece.color;
	//if the color does not match the current one playing, exit this function
	if(color != _settings.turn){return;}
	//if this is an online game, ignore clicks if the local color does not match the turn
	if(_settings.online && (_settings.onlineColor != _settings.turn)){return;}

	that.clearAllOptionStyles();
	selectedPieceIndex = that.pieces.indexOf(piece);

	var pieceOptions = options[selectedPieceIndex];

	for(var i = 0; i < pieceOptions.length; i++){
		var opt = pieceOptions[i];
		CHESSAPP.ui.addOptionStyles(that.cells[opt.x][opt.y], opt);
	}

	//clear all option classes (remove movable, attackable, and selected classes)
	// that.clearAllOptionStyles();

};

that.cellClicked = function(x,y){

	var cell = that.cells[x][y];
	if(selectedPieceIndex != -1){
		var piece = that.pieces[selectedPieceIndex];
		var opt = that.isOption(piece, cell);
		if(opt){
			var moveOptions = {
				piece: piece,
				x: x,
				y: y,
				local: true,
				special: opt.special
			}
			that.movePieceTo(moveOptions);
		}       
	}
};

that.isOption = function(piece, cell){
	var index = that.pieces.indexOf(piece);
	var pieceOptions = options[index],
	    cellX = cell.x,
	    cellY = cell.y;

	for(var i =0; i < pieceOptions.length; i++){
		if(pieceOptions[i].x == cellX && pieceOptions[i].y == cellY){
			return pieceOptions[i];
		}
	}
	return false;
};




that.inCheck = function(overrides){
	var inCheck = false;
	for(var i = 0; i < that.pieces.length; i++){
		that.getOptions(that.pieces[i], null);
	}
	return inCheck;
};


that.init = function(userSettings){
	_settings = {
		containerID : "chessboard",
		online: false,
		preferredColor: false,
		turn : "W",
		onlineColor : false,//this is the color if the player is playing online
		locked: false //says whether user can move or not
	};

	//override default settings with user settings
	CHESSAPP.utils.extend(_settings, userSettings);
	var container = document.getElementById(_settings['containerID']);
	if(container == null){
		console.log("container element not found with id: " + _settings['containerID']);
		return false;
	}

	/* initialize the user interface */
	var p = {
		container: container,
		online: _settings.online
	};

	that.cells = CHESSAPP.ui.init(p);
	//get initial setting information from user
	that.lock();
	//wait for user to pick a color and online/offline play
	CHESSAPP.ui.onInitialChoice(function(pref){
		console.log(pref);
		if(pref.hasOwnProperty("color")){
			_settings.preferredColor = pref.color;
		}
		if(pref.hasOwnProperty("online")){
			_settings.online = pref.online;
		}
		console.log(_settings);
		//now check if local or online connect
		if(_settings.online){
			console.log("connecting...");
			CHESSAPP.onlinePlay.connect(_settings, function(){
				that.setUpBoard.apply(that);
			});
		} 
		else{
			CHESSAPP.ui.statusUpdate({type: "fb", msg: "Playing locally"});
			that.setUpBoard();
		}
	});

};

/*
 *this funciton locks out certain features until unlocked
 *TODO implement
 *
 */
that.lock = function(stg){

};

that.setUpBoard = function(){
	if(that.pieces){
		//reset pieces
		delete that.pieces;
	}
	//create pieces
	that.pieces = [
	{
			x: 0,
			y: 0,
			color: 'B',
			pieceType: "rook"
	},
	{
		x: 0,
		y: 7,
		color: 'W',
		pieceType: "rook"
	},
	{
		x: 7,
		y: 0,
		color: 'B',
		pieceType: "rook"
	},
	{
		x: 7,
		y: 7,
		color: 'W',
		pieceType: "rook"
	},
	{
		x: 4,
		y: 7,
		color: 'W',
		pieceType: "king"
	},
	{
		x: 4,
		y: 0,
		color: 'B',
		pieceType: "king"
	},
	{
		x: 6,
		y: 0,
		color: 'B',
		pieceType: "knight"
	},
	{
		x: 1,
		y: 0,
		color: 'B',
		pieceType: "knight"
	},
	{
		x: 6,
		y: 7,
		color: 'W',
		pieceType: "knight"
	},
	{
		x: 1,
		y: 7,
		color: 'W',
		pieceType: "knight"
	},
	{
		x: 5,
		y: 0,
		color: 'B',
		pieceType: "bishop"
	},
	{
		x: 2,
		y: 0,
		color: 'B',
		pieceType: "bishop"
	},
	{
		x: 5,
		y: 7,
		color: 'W',
		pieceType: "bishop"
	},
	{
		x: 2,
		y: 7,
		color: 'W',
		pieceType: "bishop"
	},
	{
		x: 3,
		y: 0,
		color: 'B',
		pieceType: "queen"
	},	
	{
		x: 3,
		y: 7,
		color: 'W',
		pieceType: "queen"
	}
	];
	//add pawns
	for(var p = 0; p < 8; p++)
	{
		that.pieces.push({
			x : p,
			y: 1,
			color: 'B',
			pieceType: "pawn"
		});
	}
	for(var p = 0; p < 8; p++)
	{
		that.pieces.push({
			x : p,
			y: 6,
			color: 'W',
			pieceType: "pawn"
		});
	}
	//set initial numOfMoves to 0
	for(var i = 0; i < that.pieces.length; i++){
		that.pieces[i].numOfMoves = 0;

	}
	CHESSAPP.ui.drawPieces(that.pieces,that.cells);
	that.updateOptions();
};
that.clearAllOptionStyles = function(){
	for(var y = 0; y < 8; y++){     
		for(var x = 0; x < 8; x++){
			CHESSAPP.ui.clearOptionStyles(that.cells[x][y]);
		}
	}
};
that.updateOptions = function(){
	var response = CHESSAPP.Analyzer.makeAllOptions({pieces: that.pieces}),
	    currentColor = _settings.turn, //check all of the options of the other player, if they have none, they could be in stalemate
	    stalemate = currentColor, //originally true, but set to false as soon as options found
	    check = false,
	    checkmate = false; //in reality, just stalemate and check together

	options = response.allOptions;
	//console.log("Options recieved: ");
	//console.log(options);

	for(var i = 0; i < options.length; i++){
		//check if corresponding piece is this color
		if(!that.pieces[i]){
			continue;
		}
		if(that.pieces[i].color == currentColor){
			if(options[i].length == 0){
				continue;
			}
			else{
				stalemate = false;
			}
		}
	}
	
	if(response.kingInCheck){
		check = response.kingInCheck;

	}
	if(stalemate && check){
		checkmate = check;
	}


	var local = (currentColor == _settings.onlineColor),
	    msg = "",
	    type = "fb";

	if(checkmate){
		if(local){
			msg = "You are in checkmate. Your opponent wins";
			type = "e";
		}
		else{
			msg = "Your opponent is in checkmate. You win";
			type = "s";
		}
	}
	else if(stalemate){
		msg = "You are in stalemate";
		type = "f";
	}
	else if(check){
		if(local){
			msg = "You are in check";
			type = "e";
		}
		else{
			msg = "Your opponent is in check";
			type = "s";
		}
	}
	if(check || checkmate || stalemate){
		that.statusUpdate({msg : msg, type : type});
	}
	/*console.log("Status : ");
	  console.log("Check : " + check);
	  console.log("Stalemate : " + stalemate);
	  console.log("Checkmate : " + checkmate);*/

}
/*
 * stg params:
 * x
 * y
 * piece
 * moveType: (null means regular, "en" means enpassant, "ca" means castle)
 * 
 */
that.movePieceTo = function(stg){

	var piece = stg.piece,
	    x = stg.x,
	    y = stg.y,
	    cell = that.cells[x][y],
	    pieceAtLocation = (stg.special == null) ? CHESSAPP.Analyzer.pieceExists({pieces: that.pieces, x:x, y:y}) : null,//wait if special
	    callback = stg.callback,
	    moveData =  {
		    pieceType: piece.pieceType,
		    fromX: piece.x,
		    toX: x,
		    toY: y
	    };//data to be sent to update movelist function

	if(_settings.locked == true){
		//all moving is locked
		return false;
	}
	if(!that.isOption(piece, cell)){
		//this is not a valid option
		return false;
	}


	if(stg.local){
		//check if this is a promotion
		if(piece.pieceType == "pawn" && (y == 0 || y == 7)){
			var cb = function(){
				stg.promotion = true;
				that.movePieceTo(stg);
			};
			//show the promotion selection, and wait until user selects a piece,
			//then call the movePieceTo method again with the newly promoted selection
			that.showPromotion({piece: piece, callback : cb});
			return;
		}
	}
	if(stg.special != null){
		//special move
		console.log("Special move!", stg.special);
		if(stg.special.type=="en"){
			//get the en passant piece
			pieceAtLocation = CHESSAPP.Analyzer.pieceExists({pieces:that.pieces, x:stg.special.enx, y:stg.special.eny});
		}
		else if(stg.special.type=="castle"){
			console.log("Castling");
			//move that rook
			var rook = CHESSAPP.Analyzer.pieceExists({pieces:that.pieces, x:stg.special.rookx, y:stg.special.rooky});

			rook.y =  stg.special.rooktoy;
			rook.x = stg.special.rooktox;
			rook.numOfMoves++;
			rook.justMoved = true;
			CHESSAPP.ui.addPiece(rook, that.cells[rook.x][rook.y]);

		}
	}
	//check if there is a piece of the opposing color occupying this space
	if(pieceAtLocation != null){           
		if(pieceAtLocation.color != piece.color)
		{
			moveData.killed = true;
			//remove this piece (it was taken)
			that.killPiece(pieceAtLocation);         
		}
		else{
			//you can't move on the same space as another piece of that color
			console.log("Invalid move cannot move on another piece of same color");
			return;
		}
	}

	if(stg.local){
		//send move to remote player
		var params = {pieceX: piece.x, pieceY: piece.y, newX: x, newY: y, special: stg.special};
		if(stg.promotion){//user just promoted this piece
			params.promotion = piece.pieceType;
		}
		that.sendMove(params);
	}

	if(stg.promotion){
		moveData.promotion = stg.promotion;
	}

	piece.y = y;
	piece.x = x;
	piece.numOfMoves++;
	piece.justMoved = true;

	that.switchTurn(); //switch the turn
	that.addToMoveList(moveData);//add the move to the move list
	that.clearAllOptionStyles();//clear all of the option styles
	selectedPieceIndex = -1;
	CHESSAPP.ui.addPiece(piece, cell);
	that.updateOptions();//update all of the options here

}; 
that.killPiece = function(piece){
	that.removePieceFromDom(piece);
	that.removePieceFromList(piece);
}
that.removePieceFromDom = function(piece){

	var parent = piece.reference.parentNode;
	if(parent != null){
		//remove from existing position
		parent.removeChild(piece.reference);
	}
};

that.removePieceFromList = function(piece){
	that.pieces[that.pieces.indexOf(piece)] = null;//don't delete because we need it to be blank so it matches options array
};
that.showPromotion = function(stg){
	_settings.locked = true;
	stg.val = true;
	CHESSAPP.ui.setSelectionVisible(stg);
},
	that.promote = function(stg){
		var type = stg.pieceType,
		pieceGettingPromoted = stg.piece;
		if(pieceGettingPromoted){
			var local = pieceGettingPromoted.color == _settings.onlineColor;
			if(local || !_settings.online){
				that.statusUpdate({msg: "You have promoted", type: "s"});
			}
			else{
				that.statusUpdate({msg: "Your opponent has been promoted", type: "e"});
			}
			pieceGettingPromoted.pieceType = type;//change pawn to new type
			CHESSAPP.ui.updatePiece(pieceGettingPromoted); //update piece image
			CHESSAPP.ui.setSelectionVisible({val: false});//hide selection
			_settings.locked = false;//unlock moving
			if(stg.callback){
				stg.callback();//this calls the movePieceTo method again with the original data
			}       
		}
	};
//gets a move made from the opposing player online
//makes it locally to match
that.onlineMove = function(data){
	console.log(data);
	//get the piece that moved
	var pieceMoved = CHESSAPP.Analyzer.pieceExists({pieces: that.pieces, x: data.pieceX, y: data.pieceY});
	if(pieceMoved){
		if(data.promotion){
			that.promote({piece: pieceMoved, pieceType: data.promotion});
		}
		that.movePieceTo({piece: pieceMoved, x: data.newX, y: data.newY, promotion: data.promotion, special: data.special});
	}
}

that.chatMessage = function(stg){
	if(!stg.msg){
		return;//no message
	}          
	if(stg.local){
		//add the color of the local player
		stg.color = _settings.onlineColor;
		//send to other player
		CHESSAPP.onlinePlay.sendChat(stg);
	}
	CHESSAPP.ui.addChatMessage(stg);
}
return that;
})();

/* helper class for status scrolling
   stg is expected to have 
   elem - element of container holding window
   maxLines - the number of lines shown at any time in the element
   */
var statusScroller = function(stg){
	if(this == window){
		//enforce new
		return new statusScroller(stg);
	}
	var lineHeight = 0,
	    offset = 0,
	    maxLines = stg.maxLines,
	    totalLines = 0,
	    containerElem = stg.elem,
	    windowElem = document.createElement("div");

	windowElem.style.position = "relative";
	containerElem.appendChild(windowElem);

	this.updateClasses = function(){
		return;
		CHESSAPP.utils.removeClass(containerElem, "upDisabled");
		CHESSAPP.utils.removeClass(containerElem, "downDisabled");
		if(totalLines < maxLines){
			CHESSAPP.utils.addClass(containerElem, "upDisabled");
			CHESSAPP.utils.addClass(containerElem, "downDisabled");
		}
		else if(offset == (maxLines - totalLines) - 1){
			CHESSAPP.utils.addClass(containerElem, "downDisabled");
		}
		else if(offset == 0){
			CHESSAPP.utils.addClass(containerElem, "upDisabled");
		}
	}
	this.move = function(up){
		if(stg.scroll){return;}//this is only for non scrolling
		if(totalLines <= maxLines){
			return;
		}
		if(up){
			if(offset >= 0){
				return;
			}
			else{
				offset++;
			}             
		}
		else{
			if(offset <= (maxLines - totalLines) - 1){
				return;
			}
			else{
				offset--;
			}
		}
		windowElem.style.top = (offset * lineHeight) + "px";
		this.updateClasses();
	};
	this.goToBottom = function(){
		if(stg.scroll){
			containerElem.scrollTop = containerElem.scrollHeight;
		}
		else{
			if(totalLines > maxLines){
				offset = (maxLines - totalLines);
				windowElem.style.top = (offset * lineHeight) + "px";
			}
		}
		this.updateClasses();
	};
	this.add = function(stg){
		var def = {
			msg : "",
			type : "fb", //fb - feedback, e - error, s - success, W - white, B - black (chat messgae)
			showTime: false
		},
		    textNode,
		    textNode2,
		    p = document.createElement("p"),       
		    time = new Date(),//get the current time
		    timetext = time.toLocaleTimeString(),
		    timeEl = document.createElement("time");

		CHESSAPP.utils.extend(def, stg);

		if(def.msg == null){
			return false;
		}


		//show feedback
		textNode = document.createTextNode(timetext);
		timeEl.appendChild(textNode);
		p.appendChild(timeEl);

		textNode2 = document.createTextNode(stg.msg);      
		p.appendChild(textNode2);
		p.setAttribute("class", def.type);
		windowElem.appendChild(p);

		//set the position to hide messages that are two lines old
		totalLines++;
		lineHeight = p.offsetHeight;
		this.goToBottom();
	}
};



CHESSAPP.onlinePlay = {
	sk : null,
	/*
	   connects to websocket server, and sets up events for when a matched player is found
	   */
	connect: function(stg, callback){
		var op = CHESSAPP.onlinePlay;
		var hostPort = "http://localhost:8000";
		if(true){
			hostPort = "http://livechess.herokuapp.com:46164");
		}
		this.sk = io.connect(hostPort);
		CHESSAPP.ui.statusUpdate({type: 'fb', msg: 'Searching for partner...'});
		this.sk.emit('setup', {color: stg.preferredColor});
		this.sk.on("chat", function(data){
			CHESSAPP.GamePlay.chatMessage(data);
		});
		this.sk.on("partnerDisconnect", function(){
			CHESSAPP.GamePlay.statusUpdate({type: 'e', msg: 'Your partner has disconnected'});
			//CHESSAPP.GamePlay.showSplash();
		});
		this.sk.on("disconnect", function(){
			CHESSAPP.GamePlay.statusUpdate({type: 'e', msg: 'The server seems to be down. Please refresh the page to try again. We are sorry for the inconvenience.'});
		});
		this.sk.on('matchfound', function (data) {

			CHESSAPP.GamePlay.statusUpdate({type: 'fb', msg: 'Partner found, game has begun'});
			CHESSAPP.GamePlay.statusUpdate({type: 'fb', msg : 'Playing as ' + (data.color == 'W' ? "white" : 'black')})
			CHESSAPP.GamePlay.setOnlineColor(data.color); //maybe change this to decouple
		callback();
		});
		this.sk.on('opposing_move', function(data){
			CHESSAPP.GamePlay.onlineMove(data);
		});
	},
	sendMove: function(stg){
		this.sk.emit('movemade', stg);
	},
	sendChat: function(stg){
		stg.local = false;//because the recieved message will not be local
		this.sk.emit('chat', stg);
	},
	handleMsg : function(e){
		var resp = JSON.parse(e.data);
		console.log(resp);
	}
};



