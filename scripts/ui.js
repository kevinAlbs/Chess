/**
Funcionality for user interface, creates dialogs, responds to click events, manages status bar, message box, and move box

@module ui
**/
CHESSAPP.ui = (function(){
	var that = {},
	chessboard= null, //element where chessboard is :P
	rightCol = null,
	selection = null, //element where promotion selection box is
	color = null, //element where color selection box is
	initial = null, //element where initial selection box is
	moveList = null,//table of moves
	moveListCurRow = null, //current row which move is being displayed
	rowCount = 1,//move row count
	overlay= null, //overlay element
	overlayScreens = {}, //list of overlay screens, selection, settings, etc. overlay screen object has these props: elem, onShow, onHide
	status = null,//element where status updates are shown
	statusWindow = null,//inner area in status where text actually is
	lineSize= 0,//size of each paragraph line (for scrolling in status)
	promotion_data = null,//stores the piece to be promoted, and the callback while the user is choosing a piece
	chatWindow = null,
	chatInput= null,
	online= false,
	preferredColor= "W",
	chatActive= false,
	initSub= null,//subscriber to the initial
	elementsCreated = false;//tells whether the necessary elements are in place (at first no, but created in init)

	var createRightCol = function(){
		rightCol = document.createElement("div");
		rightCol.className = "rightCol";
		container.appendChild(rightCol);
	};
	//UI creation methods follow
	var createChat= function(chatID){
		chatContainer = document.createElement("div");
		chatContainer.className = "chat";
		chatInput = document.createElement("input");
		chatWindow = document.createElement("div");
		chatWindow.className = "chatContainer";

		var cw = chatWindow,
		    ci = chatInput,
		    def = "type something and press enter";

		ci.value = def;   
		//remove the default text in the textbox when a user focuses       
		CHESSAPP.utils.bind(ci, "focus", function(e){
			if(ci.value == def){
				ci.value = "";
			}
		});
		//add it back if there is nothing in the textbox
		CHESSAPP.utils.bind(ci, "blur", function(e){
			if(ci.value == ""){
				ci.value = def;
			}
		});
		CHESSAPP.utils.bind(ci, "keypress", function(e){
			var key=(e.charCode)?e.charCode:((e.keyCode)?e.keyCode:((e.which)?e.which:0));
			if(key=="13"){
				CHESSAPP.GamePlay.chatMessage({msg : ci.value, local : true});
				ci.value = "";
			}
		});


		var header = document.createElement("h2");
		header.appendChild(document.createTextNode("chat"));

		chatContainer.appendChild(header);
		chatContainer.appendChild(cw);
		chatContainer.appendChild(ci);

		rightCol.appendChild(chatContainer);
	};
	var activateChat= function(){
		chatActive = true;
		CHESSAPP.utils.addClass(chatContainer, "active");
	};
	var deactivateChat= function(){
		chatActive = false;
		CHESSAPP.utils.removeClass(chatContainer, "active");
	};
	var createMovelist = function(){
		var moveListContainer = document.createElement("div"),
			moveListScroll = document.createElement("div"),
			header = document.createElement("h2");

		moveList = document.createElement("table");
		header.appendChild(document.createTextNode("moves"));
		moveListContainer.className = "movelist";
		moveListScroll.className = "scroll";
		moveListScroll.appendChild(moveList);
		moveListContainer.appendChild(header);
		moveListContainer.appendChild(moveListScroll);
		moveListCurRow = document.createElement("tr");
		moveList.appendChild(moveListCurRow);
		rightCol.appendChild(moveListContainer);
	};
	var createOverlay = function(){
		overlay = document.createElement("div");
		overlay.className = "overlay";
		container.appendChild(overlay);
		//create overlay screens
		createSelection();
		createColor();
		createInitial();
	};
	var createSelection = function(){
		var selection = document.createElement("div"),
		frag = document.createDocumentFragment(),
		a = document.createElement("a"),
		a2 = document.createElement("a"),
		a3 = document.createElement("a"),
		a4 = document.createElement("a");

		selection.className = "selection overscreen";  

		a.setAttribute("data-pieceType", "knight"); 
		a.appendChild(document.createTextNode("Knight"));       
		a2.setAttribute("data-pieceType", "bishop");    
		a2.appendChild(document.createTextNode("Bishop"));    
		a3.setAttribute("data-pieceType", "rook");
		a3.appendChild(document.createTextNode("Rook")); 
		a4.setAttribute("data-pieceType", "queen");
		a4.appendChild(document.createTextNode("Queen")); 


		frag.appendChild(a);
		frag.appendChild(a2);
		frag.appendChild(a3);
		frag.appendChild(a4);

		selection.appendChild(frag);
		overlay.appendChild(selection);

		CHESSAPP.utils.bind(selection, "click", that.promotionClicked);

		selection = selection;
		overlayScreens["selection"] = {elem: selection};
	};

	var createColor = function(){
		var color = document.createElement("div"),
		frag = document.createDocumentFragment(),
		a = document.createElement("a"),
		a2 = document.createElement("a"),
		a3 = document.createElement("a"),
		a4 = document.createElement("a"),
		h2 = document.createElement("h2"),
		span = document.createElement("span");

		color.className = "color overscreen";  

		h2.appendChild(document.createTextNode("Choose your preferred color"));
		a.setAttribute("data-color", "W"); 
		a.appendChild(document.createTextNode("White"));       
		a2.setAttribute("data-color", "B");    
		a2.appendChild(document.createTextNode("Black"));    
		a3.setAttribute("data-color", "U");
		a3.appendChild(document.createTextNode("Unspecified")); 
		span.appendChild(document.createTextNode("Matches up with anyone, either black or white player")); 
		a3.appendChild(span);

		frag.appendChild(h2);
		frag.appendChild(a);
		frag.appendChild(a2);
		frag.appendChild(a3);

		color.appendChild(frag);
		overlay.appendChild(color);

		CHESSAPP.utils.bind(color, "click", that.preferredClicked);

		color = color;
		overlayScreens["color"] = {elem: color};
	};
	createInitial = function(){
		var initial = document.createElement("div"),
		frag = document.createDocumentFragment(),
		a = document.createElement("a"),
		a2 = document.createElement("a"),
		h2 = document.createElement("h2");

		initial.className = "initial overscreen";  

		h2.appendChild(document.createTextNode("Choose your mode"));
		a.setAttribute("data-mode", "offline"); 
		a.appendChild(document.createTextNode("Offline Play"));       
		a2.setAttribute("data-mode", "online");    
		a2.appendChild(document.createTextNode("Online Play"));    

		frag.appendChild(h2);
		frag.appendChild(a);
		frag.appendChild(a2);

		initial.appendChild(frag);
		overlay.appendChild(initial);

		CHESSAPP.utils.bind(initial, "click", that.modeClicked);

		initial = initial;
		overlayScreens["initial"] = {elem: initial};
	};

	/* creates container for status and scrolling */
	var createStatus = function(statusID){
		status = document.createElement("div"),
		arrow_up = document.createElement("a"),
		arrow_down = document.createElement("a");

		status.className = "status";       
		arrow_up.className = "arrow_up";
		arrow_down.className = "arrow_down";

		statusWindow = new statusScroller({elem: status, maxLines: 2});
		CHESSAPP.utils.bind(arrow_up, "click", function(e){
			statusWindow.move(true);
			e.preventDefault();
			return false;
		});
		CHESSAPP.utils.bind(arrow_down, "click", function(e){
			statusWindow.move(false);
			e.preventDefault();
			return false;
		});


		status.appendChild(arrow_up);
		status.appendChild(arrow_down);
		container.appendChild(status);
	};

	

	var readyToPlay= function(){
		if(online){
			activateChat();
		}
		else{
			deactivateChat();
		}
		initSub.apply(window, [{color: preferredColor, online: online}]);
	};

	
	var toggleOverlay= function(val, screen){     
		overlay.style.display = val ? "block" : "none"; 
		//hide all screens
		for(var i in overlayScreens){
			if(overlayScreens.hasOwnProperty(i)){
				overlayScreens[i].elem.style.display = "none";
			}
		}
		//show screen if there is one
		if(val && !!screen){
			overlayScreens[screen].elem.style.display = "block";
		}
	};

	//adds cells to the elem, returns an array of the cells
	var drawCells = function(){
		chessboard = document.createElement("div"),
		frag = document.createDocumentFragment(),
		cellDiv = document.createElement("div"),
		cells = new Array(8);

		chessboard.className = "chessboard";
		/* the reason that the divs are created here is for performance, otherwise
		   the divs would normally be created in the Cell class */

		//create multi-dimensional array
		for(var x = 0; x < 8; x++){
			cells[x] = new Array(8);
		}
		//create board and cell references
		for(var y = 0; y < 8; y++){     
			for(var x = 0; x < 8; x++){
				var clone = cellDiv.cloneNode();
				if((x % 2 == 1 && y % 2 == 1) || (x % 2 == 0 && y % 2 == 0)){
					CHESSAPP.utils.addClass(clone, "W");
				}else{
					CHESSAPP.utils.addClass(clone, "B");
				}
				clone.setAttribute("data-x", x);
				clone.setAttribute("data-y", y);
				//create cell object
				cells[x][y] = {
					reference: clone,
					x: x,
					y: y
				};
				/* just for testing */
				if(CHESSAPP.globalSettings.debug){
				 var coords = document.createElement("p");
				   coords.innerHTML = x + " , " + y;
				   cells[x][y].reference.appendChild(coords);
				  }
				frag.appendChild(clone);
				
			}


		}
		chessboard.appendChild(frag);

		//add chessboard to container
		container.appendChild(chessboard);
		CHESSAPP.utils.bind(chessboard, "click", CHESSAPP.ui.boardClicked);

		//returns list of cells
		return cells;
	};





/*
 * Public Methods
 */
	that.init = function(stg){
		container = stg.container;
		if(!elementsCreated){
			//create the UI here... ugh
			createStatus();
			createOverlay();
			createRightCol();
			createChat();
			createMovelist();
			elementsCreated = true;
		}
		toggleOverlay(true, "initial");
		return drawCells(); //not sure what to do about this right now
	};
	that.addChatMessage = function(stg){
		var prefix = (stg.color == 'W') ? "White - " : (stg.color == "B") ? "Black - " : "",
		p = document.createElement("p"),
		textNode = document.createTextNode(prefix + stg.msg);
		p.appendChild(textNode);
		chatWindow.appendChild(p);
		chatWindow.scrollTop = chatWindow.scrollHeight;

	};
	that.addMove = function(txt){
		console.log("Showing move:" + txt);
		var cell = document.createElement("td");
		//create dom elements
		if(CHESSAPP.GamePlay.getTurn() == "B"){
			//this means that white just moved (first move on the row)
			//add move count and turn
			cell.appendChild(document.createTextNode("" + rowCount));
			moveListCurRow.appendChild(cell);
			cell = document.createElement("td");
			cell.appendChild(document.createTextNode(txt));
			moveListCurRow.appendChild(cell);
		}
		else{
			//end of row
			cell.appendChild(document.createTextNode(txt));
			moveListCurRow.appendChild(cell);
			rowCount++;
			//create next row
			moveListCurRow = document.createElement("tr");
			moveList.appendChild(moveListCurRow);
		}
	};
	/*
   this updates the status element with the user specified message
   */
	that.statusUpdate= function(stg){
		stg.showTime = true;
		statusWindow.add(stg);
	};
	that.drawPieces= function(pieces, cells){
		var i=0, max=pieces.length;
		for(; i<max ; i++){
			var p = pieces[i];
			var img = new Image();
			img.src = CHESSAPP.globalSettings.imageDir + p.color + "_" + p.pieceType + ".png";
			p.reference = img;
			cells[p.x][p.y].reference.appendChild(img);
		}
	};
	that.addPiece = function(piece, cell){
		cell.reference.appendChild(piece.reference);
	};
	that.updatePiece = function(piece){
		//this is only used when a pawn is promoted, to update the image
		var p = piece;
		p.reference.src = CHESSAPP.globalSettings.imageDir + p.color + "_" + p.pieceType + ".png";
	};
	that.addOptionStyles = function(cell, userSettings){
		var stg = {
			attackable: true,
			movable: true
		};        
		CHESSAPP.utils.extend(stg, userSettings);

		if(stg.attackable){
			CHESSAPP.utils.addClass(cell.reference, "attackable");
		}

		if(stg.movable){
			CHESSAPP.utils.addClass(cell.reference, "movable");
		}
	};
	that.clearOptionStyles = function(cell){
		CHESSAPP.utils.removeClass(cell.reference,"movable");
		CHESSAPP.utils.removeClass(cell.reference,"attackable");
	};
	that.onInitialChoice= function(callback){
		//allows CHESSAPP.GamePlay to hook onto event when user picks initial settings
		initSub = callback;
	};
	that.setSelectionVisible = function(stg){
		var val = stg.val;
		if(val){
			overlay.style.display = "block";
			promotion_data = stg;
			toggleOverlay(true, "selection");
		}
		else{
			promotion_data = null;
			toggleOverlay(false, "selection");
		}
	};
	that.modeClicked= function(e){
		e.preventDefault();
		e.stopPropagation();
		e = e || window.event;
		src = e.target || e.srcElement;
		if(src.nodeName.toLowerCase() == "a"){
			//get the color
			var val = src.getAttribute("data-mode");
			if(val == "offline"){
				online = false;
			}
			else if(val == "online"){
				online = true;
			}
		}
		if(online){
			//show preferredClicked
			toggleOverlay(true, "color");	
		}
		else{
			//send prompt to play
			toggleOverlay(false);	
			readyToPlay();
		}
	};

	that.preferredClicked = function(e){
		e.preventDefault();
		e.stopPropagation();
		e = e || window.event;
		src = e.target || e.srcElement;
		if(src.nodeName.toLowerCase() == "a"){
			//get the color
			var val = src.getAttribute("data-color");
			if(val){
				console.log(val + " color");
				//call subscriber
				if(initSub == null){
					console.log("Init sub is null");
				}
				else{
					preferredColor = val;
					readyToPlay();
				}
			}
			//remember this isn't this :P
			toggleOverlay(false);
		}
	};
	that.promotionClicked = function(e){
		e.preventDefault();
		e.stopPropagation();
		e = e || window.event;
		src = e.target || e.srcElement;
		if(src.nodeName.toLowerCase() == "a"){
			//get the piece type selected
			var val = src.getAttribute("data-pieceType");
			if(val){
				console.log("User selected " + val);
				promotion_data.pieceType = val;
				CHESSAPP.GamePlay.promote(promotion_data);
			}
		}
		return false;
	};


	that.boardClicked = function(e){
		var x,y, cellReference, pieceClicked = false;
		e = e || window.event;
		src = e.target || e.srcElement;
		if(src.nodeName.toLowerCase() == "img"){
			//it is a piece
			cellReference = src.parentNode;
		}
		else if(src.nodeName.toLowerCase() == "div"){
			//could be a cell
			cellReference = src;
		}
		if(cellReference){
			x = cellReference.getAttribute("data-x");
			y = cellReference.getAttribute("data-y");

			if(x && y){
				CHESSAPP.GamePlay.cellClicked(x,y);
				var piece = CHESSAPP.Analyzer.pieceExists({pieces: CHESSAPP.GamePlay.pieces, x:x,y:y});
				if(piece){
					CHESSAPP.GamePlay.pieceClicked(piece);
				}
			}
		}
	};
	return that;
}());


