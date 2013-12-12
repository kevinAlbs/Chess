/* 
 * This class takes care of the setup of the pieces and is the bridge between the ui and logic
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
