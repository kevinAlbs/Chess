CHESSAPP.ui = {
      chessboard: null, //element where chessboard is :P
      selection : null, //element where promotion selection box is
      overlay: null, //overlay element
      overlayScreens : {}, //list of overlay screens, selection, settings, etc. overlay screen object has these props: elem, onShow, onHide
      status : null,//element where status updates are shown
      statusWindow : null,//inner area in status where text actually is
      lineSize: 0,//size of each paragraph line (for scrolling in status)
      promotion_data : null,//stores the piece to be promoted, and the callback while the user is choosing a piece
      chatWindow : null,
      chatInput: null,
      initSub: null,//subscriber to the initial
      elementsCreated : false,//tells whether the necessary elements are in place (at first no, but created in init)
      init : function(stg){
        this.container = stg.container;
	if(!this.elementsCreated){
		//create the UI here... ugh
		this.createStatus();
        	this.createOverlay();
		if(stg.online){
	          this.createChat();
       		 }
		elementsCreated = true;
	}
	this.toggleOverlay(true, "initial");
        return this.drawCells(); //not sure what to do about this right now
      },
      //UI creation methods follow
        createChat: function(chatID){
          this.chatContainer = document.createElement("div");
          this.chatContainer.className = "chat";
          this.chatInput = document.createElement("input");
          this.chatWindow = document.createElement("div");
          this.chatWindow.className = "chatContainer";
          
          var cw = this.chatWindow,
              ci = this.chatInput,
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

          this.chatContainer.appendChild(header);
          this.chatContainer.appendChild(cw);
          this.chatContainer.appendChild(ci);

          this.container.appendChild(this.chatContainer);
        },

     createOverlay : function(){
        var overlay = document.createElement("div");
            overlay.className = "overlay";
        this.container.appendChild(overlay);
        this.overlay = overlay;
	//create overlay screens
	this.createSelection();
	this.createInitial();
      },
     createSelection : function(){
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
          this.overlay.appendChild(selection);

          CHESSAPP.utils.bind(selection, "click", CHESSAPP.ui.promotionClicked);

          this.selection = selection;
	  this.overlayScreens["selection"] = {elem: selection};
        },
     createInitial : function(){
	     var initial = document.createElement("div"),
	     frag = document.createDocumentFragment(),
	     a = document.createElement("a"),
	     a2 = document.createElement("a"),
	     a3 = document.createElement("a"),
	     a4 = document.createElement("a"),
	     h2 = document.createElement("h2"),
	     span = document.createElement("span");

	     initial.className = "initial overscreen";  

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

	     initial.appendChild(frag);
	     this.overlay.appendChild(initial);

             CHESSAPP.utils.bind(initial, "click", CHESSAPP.ui.preferredClicked);

	     this.initial = initial;
	     this.overlayScreens["initial"] = {elem: initial};


     },
	     
        setSelectionVisible : function(stg){
          var val = stg.val;
          if(val){
	    this.overlay.style.display = "block";
            this.promotion_data = stg;
            this.toggleOverlay(true, "selection");
          }
          else{
            this.promotion_data = null;
            this.toggleOverlay(false, "selection");
          }
        },
	preferredClicked : function(e){
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
				  initSub.apply(window, [{color: val}]);
			  }
		  }
		  //remember this isn't this :P
		  CHESSAPP.ui.toggleOverlay(false);
	  }
	},
	onInitialChoice: function(callback){
		initSub = callback;
	},
        promotionClicked : function(e){
          e.preventDefault();
          e.stopPropagation();
          e = e || window.event;
          src = e.target || e.srcElement;
          if(src.nodeName.toLowerCase() == "a"){
            //get the piece type selected
            var val = src.getAttribute("data-pieceType");
            if(val){
              console.log("User selected " + val);
              CHESSAPP.ui.promotion_data.pieceType = val;
              CHESSAPP.GamePlay.promote(CHESSAPP.ui.promotion_data);
            }
          }
          return false;
        },


        /* creates container for status and scrolling */
        createStatus : function(statusID){
          var status = document.createElement("div"),
              arrow_up = document.createElement("a"),
              arrow_down = document.createElement("a");

          status.className = "status";       
          arrow_up.className = "arrow_up";
          arrow_down.className = "arrow_down";

          this.statusWindow = new statusScroller({elem: status, maxLines: 2});
          CHESSAPP.utils.bind(arrow_up, "click", function(e){
            CHESSAPP.ui.statusWindow.move(true);
            e.preventDefault();
            return false;
          });
          CHESSAPP.utils.bind(arrow_down, "click", function(e){
            CHESSAPP.ui.statusWindow.move(false);
            e.preventDefault();
            return false;
          });
          

          status.appendChild(arrow_up);
          status.appendChild(arrow_down);
          this.container.appendChild(status);
          this.status = status;
        },
      toggleOverlay: function(val, screen){     
          this.overlay.style.display = val ? "block" : "none"; 
	  //hide all screens
	  for(var i in this.overlayScreens){
		  if(this.overlayScreens.hasOwnProperty(i)){
			this.overlayScreens[i].elem.style.display = "none";
		  }
	  }
	  //show screen if there is one
	  if(val && !!screen){
		  this.overlayScreens[screen].elem.style.display = "block";
	  }
      },
      //adds cells to the elem, returns an array of the cells
      drawCells : function(){
            var chessboard = document.createElement("div"),
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
             /* var coords = document.createElement("p");
              coords.innerHTML = x + " , " + y;
              cells[x][y].reference.appendChild(coords);*/
               frag.appendChild(clone);
             }


            }
            chessboard.appendChild(frag);
            
            //add chessboard to container
            this.container.appendChild(chessboard);
            CHESSAPP.utils.bind(chessboard, "click", CHESSAPP.ui.boardClicked);



            this.chessboard = chessboard;
          //returns list of cells
          return cells;
        },

       	addMove : function(txt){
	      console.log("Showing move:" + txt);
      	},
        drawPieces: function(pieces, cells){
          var i=0, max=pieces.length;
          for(; i<max ; i++){
            var p = pieces[i];
            var img = new Image();
            img.src = CHESSAPP.globalSettings.imageDir + p.color + "_" + p.pieceType + ".svg";
            p.reference = img;
            cells[p.x][p.y].reference.appendChild(img);
          }
        },
        updatePiece : function(piece){
          //this is only used when a pawn is promoted, to update the image
          var p = piece;
          p.reference.src = CHESSAPP.globalSettings.imageDir + p.color + "_" + p.pieceType + ".svg";
        },
        boardClicked : function(e){
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
        },
        addOptionStyles : function(cell, userSettings){
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
        },

        clearOptionStyles : function(cell){
          CHESSAPP.utils.removeClass(cell.reference,"movable");
          CHESSAPP.utils.removeClass(cell.reference,"attackable");
        },

        addPiece : function(piece, cell){
          cell.reference.appendChild(piece.reference);
        },
        

        /*
        this updates the status element with the user specified message
        */
        statusUpdate: function(stg){
          stg.showTime = true;
          this.statusWindow.add(stg);
        },

               addChatMessage : function(stg){
          var prefix = (stg.color == 'W') ? "White - " : (stg.color == "B") ? "Black - " : "",
              p = document.createElement("p"),
              textNode = document.createTextNode(prefix + stg.msg);
          p.appendChild(textNode);
          this.chatWindow.appendChild(p);
          this.chatWindow.scrollTop = this.chatWindow.scrollHeight;

        },

    };


