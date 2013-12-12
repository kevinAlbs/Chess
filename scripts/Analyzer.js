/* 
 singleton class for analyzing state of any array of piece objects to see each of their optional moves
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
	 @return an array of option arrays all corresponding to each piece index
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
	 gets the options for a single piece in the array pieces
	 @return 
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
		/* shortcut method for getting options of a single piece at a single square */
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

		//The following checks the possible moves based on the piece type (pawns can move forward but attack diagonally etc.)
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
	 * if it would leave that players king in check. If it would, then it is an invalid move.
	 *
	 * This function does the work of a virtual board checking if the potential new state of the board would leave the player's king in check
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