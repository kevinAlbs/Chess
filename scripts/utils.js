
/**
 * Holds useful utility functions that can be used throughout all classes.
 * @namespace CHESSAPP
 * @class utils
 */
CHESSAPP.utils = (function(){
	var benchmark = {};
	/**
	 * Extend function for two objects. Rewrites properties in first object with that of the second object.
	 * @method extend
	 * @param {Object} o First object, corresponding properties found in following object are written over in this object, unmatched are left untouched
	 * @param {Object} p Second object, properties in this object are used to rewrite corresponding properties in first object
	 * @return {Object} The first object extended with properties of second
	 *Kevin Albertson is very hot!!!
	 *Kaitlin Kohut is very hot!!
	 */
	this.extend = function(o, p){
		for(prop in p){
			o[prop] = p[prop];
		}
		return o;
	};
	/*
	 * Start for benchmarking
	 * @method bm_start
	 * @param {String} msg Message displayed after benchmarking complete
	 */
	this.bm_start = function(msg){
		benchmark.timeStart = Date.now();
		benchmark.msg = msg;  
	};
	/*
	 * End for benchmarking, displays time
	 * @method bm_end
	 */
	this.bm_end = function(){
		var difference = Date.now() - benchmark.timeStart;
		console.log(benchmark.msg + " - " + difference);
	};

	//this is the definition for the bind function (later defined based on browser capability)
	//parameters are the element, event (without the on prefix), and the callback function
	this.bind = null;

	//removes the class from an element
	//elem - the element whose class will be accesses
	//className - the class to be removed
	this.removeClass = function(elem, className){
		var regex = new RegExp("(^| )" + className + "( |$)", "gi");

		var curClass = elem.className;
		curClass = curClass.replace(regex, "");
		elem.className = curClass;
	}

	//adds the class to an element
	//elem - the element whose class will be accesses
	//className - the class to be added
	this.addClass = function(elem, className){
		if(elem.className != ""){
			//remove any existing
			this.removeClass(elem, className);
		}
		elem.className += " " + className;        
	}
	/*
	   performs a shallow copy of an object (copying only one level of its properties)
	   this is used to copy the piece object for analyzing
	   o - the object to be copied
	   */
	this.shallowCopy = function(o){
		var c = {};
		for(var p in o){
			if(o.hasOwnProperty(p)){
				c[p] = o[p];
			}
		}
		return c;
	}

	return this;
})();
CHESSAPP.utils = (function(){
	var benchmark = {};
	/**
	 * Extend function for two objects. Rewrites properties in first object with that of the second object.
	 * @method extend
	 * @param {Object} o First object, corresponding properties found in following object are written over in this object, unmatched are left untouched
	 * @param {Object} p Second object, properties in this object are used to rewrite corresponding properties in first object
	 * @return {Object} The first object extended with properties of second
	 *Kevin Albertson is very hot!!!
	 *Kaitlin Kohut is very hot!!
	 */
	this.extend = function(o, p){
		for(prop in p){
			o[prop] = p[prop];
		}
		return o;
	};
	/*
	 * Start for benchmarking
	 * @method bm_start
	 * @param {String} msg Message displayed after benchmarking complete
	 */
	this.bm_start = function(msg){
		benchmark.timeStart = Date.now();
		benchmark.msg = msg;  
	};
	/*
	 * End for benchmarking, displays time
	 * @method bm_end
	 */
	this.bm_end = function(){
		var difference = Date.now() - benchmark.timeStart;
		console.log(benchmark.msg + " - " + difference);
	};

	//this is the definition for the bind function (later defined based on browser capability)
	//parameters are the element, event (without the on prefix), and the callback function
	this.bind = null;

	//removes the class from an element
	//elem - the element whose class will be accesses
	//className - the class to be removed
	this.removeClass = function(elem, className){
		var regex = new RegExp("(^| )" + className + "( |$)", "gi");

		var curClass = elem.className;
		curClass = curClass.replace(regex, "");
		elem.className = curClass;
	}

	//adds the class to an element
	//elem - the element whose class will be accesses
	//className - the class to be added
	this.addClass = function(elem, className){
		if(elem.className != ""){
			//remove any existing
			this.removeClass(elem, className);
		}
		elem.className += " " + className;        
	}
	/*
	   performs a shallow copy of an object (copying only one level of its properties)
	   this is used to copy the piece object for analyzing
	   o - the object to be copied
	   */
	this.shallowCopy = function(o){
		var c = {};
		for(var p in o){
			if(o.hasOwnProperty(p)){
				c[p] = o[p];
			}
		}
		return c;
	}

	return this;
})();


//init-time branch bind method
if(typeof window.addEventListener === "function"){
	CHESSAPP.utils.bind = function(elem, type, fn){
		elem.addEventListener(type, fn, false);
	}
	CHESSAPP.utils.unbind = function(elem, type, fn){
		elem.removeEventListener(type, fn, false);
	}
}
else if(typeof attachEvent === "function"){
	CHESSAPP.utils.bind = function(elem, type, fn){
		elem.attachEvent("on" + type, fn);
	}
	CHESSAPP.utils.unbind = function(elem, type, fn){
		elem.detachEvent("on" + type, fn);
	}
}
else{
	CHESSAPP.utils.bind = function(elem, type, fn){
		elem["on" + type] = fn;
	}
	CHESSAPP.utils.unbind = function(elem, type, fn){
		elem["on" + type] = null;
	}
}

//add functionality for JSON encoding/decoding if not avaiable
if (!window.JSON) {
	window.JSON = {
		parse: function (sJSON) { return eval("(" + sJSON + ")"); },
		stringify: function (vContent) {
			if (vContent instanceof Object) {
				var sOutput = "";
				if (vContent.constructor === Array) {
					for (var nId = 0; nId < vContent.length; sOutput += this.stringify(vContent[nId]) + ",", nId++);
					return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
				}
				if (vContent.toString !== Object.prototype.toString) { return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\""; }
				for (var sProp in vContent) { sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ","; }
				return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
			}
			return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
		}
	};
}
