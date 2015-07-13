(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
/* **************************************
TODO:
    - add logger
    - make a version with batch processing
    - read from DB
    - update nodes/model
*************************************** */
var serverURL = "http://localhost:7474";
var neo4j = require('node-neo4j');
var async = require("async");
db = new neo4j(serverURL);
var inspect = require('eyes').inspector({maxLength: 9000});

var ids = [];

module.exports = {
//Function Create Node From Model Element
persist: function (ModelElement) {
// MetaModel, Model(container) as labels
	createNode(ModelElement);
},

resolve: function(ModelElement) {
	resolveIdFromModelElement(ModelElement);
},

deleteElement : function(ModelElement){
	deleteAllNodes(ModelElement);
},

saveModel : function(Model) {
	saveModel(Model);
}

}; // end exports

// TODO do the Cypher query with object constructed from ModelElement
function resolveId(ModelElement)  {
	var queryPart="";
	for(i in ModelElement.conformsTo().__attributes) {
		//ModelElement[i] = attribute content, i = attribute name.
		if(queryPart==="") {
		queryPart+='n.'+i+'='+'\"'+ModelElement[i]+'\"'
		} else {
		queryPart+='and n.'+i+'='+'\"'+ModelElement[i]+'\"'
		}
	}
	db.cypherQuery('MATCH (n) WHERE '+queryPart+' RETURN n', null, function (err, result) {	
			console.log('MATCH (n) WHERE '+queryPart+' RETURN n');
			//for(i in result.data) {
			//	console.log(result.data[i]._id);
			//}
		if(result.data.length!=0) {
			if(result.data.length==1) {
				return result.data[0]._id;
			} else {
				console.log("many results, returning last value");
				var last = result.data.length-1;
				return result.data[last]._id;
			}
		} else { console.log("merde"); }
	});
}


function resolveIdFromModelElement(ModelElement) {
var labelMetaClass = ModelElement.conformsTo().__name;
var pushObject = {};
        
for(i in ModelElement.conformsTo().__attributes) {
    pushObject[i] = ModelElement[i];
}
    
 db.readNodesWithLabelsAndProperties (labelMetaClass, pushObject, function(err, result) {
    if(err) {
        throw err   
    } else {
        return(result[0]._id);
        
    }
 });
}


function queryGeneration(ModelElement)  {
	var queryPart="";
	for(i in ModelElement.conformsTo().__attributes) {
		//ModelElement[i] = attribute content, i = attribute name.
		if(queryPart==="") {
		queryPart+='n.'+i+'='+'\"'+ModelElement[i]+'\"';
		} else {
		queryPart+=' and n.'+i+'='+'\"'+ModelElement[i]+'\"';
		}
	}
	return queryPart;
}

function deleteAllNodes(ModelElement) {

	var query = queryGeneration(ModelElement);
	db.cypherQuery('MATCH (n) WHERE '+query+' RETURN n', null, function (err, result) {	
		for(i in result.data) {
			idTarget = result.data[i]._id;
			db.deleteNode(idTarget, function (err, node) {
				if(err) {
					throw err;
				}
				console.log(node);
			});
		}
		
	});
}
//DeleteNodeWithLabelAndProperties = avoid to resolve IDS check!!!

function saveModel(Model) {
	//building element list

	modelElements = [];
	for(meta in Model.modellingElements) {
		for(j in Model.modellingElements[meta]) {
			modelElements.push(Model.modellingElements[meta][j]);
		}
	}  
     //inspect(modelElements);
	//create node before references, using async lib
	async.eachSeries(modelElements, function(element, callback) {	
		var pushObject = {};
        
        for(i in element.conformsTo().__attributes) {
			 pushObject[i] = element[i];
		  }
        
        var labelMetaClass = element.conformsTo().__name;
        var labelModelName = element.conformsTo().__name;
        
        //WARNING We are in presence of undefined metaelement OR a metaclass
        if(labelMetaClass==undefined) {      
            labelMetaClass = Model.__name+"_Class_Undefined";
        }
       
		db.insertNode(pushObject , 
			[labelMetaClass,labelModelName],
			function(err, result) {
				if(err) {
					throw err;
				} else {
					idSource = result._id;
					console.log('Object of Type: '+labelMetaClass+' Added');
					callback();
				}
		});	
	}, function (res) {
		console.log("All nodes pushed into Neo4J... pushing associations");       
		async.eachSeries(modelElements, function(element, callback5) {
			//console.dir("Elements: "+element);
			//createReferencesBVERSION(element,callback5);
            createReferencesCVERSION(element,callback5);
		}, function(res2) {
			console.log("Model pushed fully into Neo4J");
		});
	});
}


function createMetaNode(MetaModelElement, Model,callback) {
	var pushObject = {};
	pushObject["__name"] = MetaModelElement.__name;
    var metalabel = Model.__name+"_"+MetaModelElement.__name;
	//Insert a node conforms to the model schema
	for(i in MetaModelElement.__attributes) {
		console.log(MetaModelElement.__attributes[i]);
		pushObject[i] = MetaModelElement.__attributes[i];
	}
	db.insertNode(pushObject , 
			metalabel,
			function(err, result) {
			if(err) {
				throw err;
			} else {
				idSource = result._id;
				console.log('MetaObject of Type: '+metalabel+' Added');
                callback();
			}
	});	
}

//REFERENCE Using "build String Queries"
function createReferencesBVERSION(ModelElement, callback5) {
	var querySource="";
	var queryTarget="";
	var queryTargetType="";
	var idSource;
	var idTarget;
	var idTargets = [];
	var labeledIds = {};
	var relationLabel;
	var currentRelationElement;
	
	querySource = queryGeneration(ModelElement);
	querysourceType = "`"+ModelElement.conformsTo().__name+"`";
	var targetElements=[];

	for(i in ModelElement.conformsTo().__references) {
			currentRelationElement = ModelElement[i];
			relationLabel = i;
			for(relIt in currentRelationElement) {
				//console.log(i, currentRelationElement[relIt]); 
				targetElements.push({label: relationLabel, el :currentRelationElement[relIt]});
			}
	}
	
	//inspect(targetElements);
	
	//if referenceElement is not empty
	async.parallelLimit( 
	[ function(callback1) {
		// Get Source ID if references...
//debug 
        //console.log('SOURCE! MATCH (n:'+querysourceType+') WHERE '+querySource+' RETURN n');
		db.cypherQuery('MATCH (n:'+querysourceType+') WHERE '+querySource+' RETURN n', null, function (err, result) {	
			if(result.data.lenght!=0) {
				//Always return the first value (oldest node)
				idSource = result.data[0]._id;		
			} else {console.log("Error object not found in Database")};	
			callback1();
		});
	},	function(callback3) {
				async.eachSeries(targetElements, function(element,callback2) {
				//console.log(element);
					queryTarget = queryGeneration(element.el);
					queryTargetType = "`"+element.el.conformsTo().__name+"`";
//debug //console.log(' TARGET! MATCH (n:'+queryTargetType+') WHERE '+queryTarget+' RETURN n');
					db.cypherQuery('MATCH (n:'+queryTargetType+') WHERE '+queryTarget+' RETURN n', null, function (err, result) {	
						if(result.data.length!=0) {
							idTargets.push({label: element.label, el:result.data[0]._id});
							idTarget = result.data[0]._id;
						} else {console.log("Error object not found in Database");}
							callback2();
						});
					}, function(err) {
						if(err)  {
							console.log(err);
						}
						callback3();
					});
	}], 
        10, //up to 10 queries in parallel (WARNING arbitrary limit).
        function(err) {
		//console.log(idTargets);	
		async.eachSeries(idTargets, function(relation, callback6) {
//DEbug //console.log("insertion! "+ idSource+"->"+relation.el+" with label "+ relation.label);
			 db.insertRelationship(idSource,relation.el, relation.label,{}, function(err, result){ // let see if transition should support some properties... 
				if(err) {
					throw err;
				} else {
					relationid = result._id;
					console.log("Reference created "+relation.label);
					callback6();
				}
			});// end dbInsert 
		}, function(err) {
			//callback5(); //all relation are supposed to be pushed into DB
		});	
		callback5();
	}); //end parallel
}


//Version Using WebService Query
function createReferencesCVERSION(ModelElement, callback5) {
	var querySource="";
	var queryTarget="";
	var queryTargetType="";
	var idSource;
	var idTarget;
	var idTargets = [];
	var labeledIds = {};
	var relationLabel;
	var currentRelationElement;
	
	var targetElements=[];

    var labelMetaClass = ModelElement.conformsTo().__name;
    var pushObject = {};
        
    for(i in ModelElement.conformsTo().__attributes) {
        pushObject[i] = ModelElement[i];
    }
    
	for(i in ModelElement.conformsTo().__references) {
			currentRelationElement = ModelElement[i];
			relationLabel = i;
			for(relIt in currentRelationElement) {
				//console.log(i, currentRelationElement[relIt]); 
				targetElements.push({label: relationLabel, el :currentRelationElement[relIt]});
			}
	}
	
	//inspect(targetElements);
	
	//if referenceElement is not empty
	async.parallelLimit( 
	[ function(callback1) {
		// Get Source ID if references...
//debug 
        //console.log('SOURCE! MATCH (n:'+querysourceType+') WHERE '+querySource+' RETURN n');
		db.readNodesWithLabelsAndProperties (labelMetaClass, pushObject, function (err, result) {	
			if(result.lenght!=0) {
				//Always return the first value (oldest node)
				idSource = result[0]._id;		
			} else { console.log("Error object not found in Database")};	
			callback1();
		});
	},	function(callback3) {
				async.eachSeries(targetElements, function(element,callback2) {
				    var pushObject = {};
                    var labelMetaClass = element.el.conformsTo().__name;
					for(j in element.el.conformsTo().__attributes) {
                        pushObject[j] = element.el[j];
                    }
					
//debug //console.log(' TARGET! MATCH (n:'+queryTargetType+') WHERE '+queryTarget+' RETURN n');
					db.readNodesWithLabelsAndProperties(labelMetaClass,pushObject, function (err, result) {	
						if(result.length!=0) {
							idTargets.push({label: element.label, el:result[0]._id});
							//idTarget = result[0]._id;
						} else {console.log("Error object not found in Database");}
							callback2();
						});
					}, function(err) {
						if(err)  {
							console.log(err);
						}
						callback3();
					});
	}], 
        10, //up to 10 queries in parallel (WARNING arbitrary limit).
        function(err) {
		//console.log(idTargets);	
		async.eachSeries(idTargets, function(relation, callback6) {
//DEbug //console.log("insertion! "+ idSource+"->"+relation.el+" with label "+ relation.label);
			 db.insertRelationship(idSource,relation.el, relation.label,{}, function(err, result){ // let see if transition should support some properties... 
				if(err) {
					throw err;
				} else {
					relationid = result._id;
					console.log("Reference created "+relation.label);
					callback6();
				}
			});// end dbInsert 
		}, function(err) {
			//callback5(); //all relation are supposed to be pushed into DB
		});		 
		callback5();
	}); //end parallel
}

/*
function createNode(ModelElement) {
	var pushObject = {};
	var pushRelation = {};
	var relationLabel;
	var idSource;
	//Insert a node conforms to the model schema
	for(i in ModelElement.conformsTo().__attributes) {
		pushObject[i] = ModelElement[i];
	}
	db.insertNode(pushObject , 
			ModelElement.conformsTo().__name,
			function(err, result) {
			if(err) {
				throw err;
			} else {
				idSource = result._id;
				//console.log(idSource);
				console.log('Object of Type: '+ModelElement.conformsTo().__name+' Added');
				//console.log(pushObject); //dump object
			}
	});	
	return idSource;
}
*/
},{"async":7,"eyes":8,"node-neo4j":9}],6:[function(require,module,exports){
/**
 *   JavaScript Modelling Framework (JSMF)
 *   Copyright 2014 © Henri Tudor
 * 	 Copyright 2015 © LIST
 *   Authors : J.S. Sottet, A Vagner
 *
 *    Todo
 *      | Inheritance, Attributes and references overloading: Tested - Still missing For Reference inheritance
 *      - implement different level of checking (type) : different conformances-flexibility
 *      - Checking for type in references according to supertypes inheritance chain
 *      - Setting and Checking for types that are not JS primitive types (attributes)
 *      - Persistence and Loading using JSON
 *      - Enhance Persistence/check persistence with Neo4J -> using batch / update 
 *      - load model from db neo4J?
 *		- Add keyword "Any" for loose typing?
 *      - Dynamic of objects/instances/classes e.g., adding an attribute to the clas after instanciation will allow the object to set/get the new attribute.
 *      - Permit the addition of new attribute/relation without behing an instance of a specific class
 *      - Add the inference/generalisation of instance attribute to class
 *      - Add a checking between Models and Metamodel (conformance).
 *      | Build a fonction that get all Attribute and/or all reference from the inheritance chain. To be tested
 *
 *   Done
 *      - Demotion (see JSMF_Utils)
 *
 */

var modelDB = require('./JSMFNeo4j.js'); // TODO Make a wrapper for DB (
var _ = require('underscore');

//DEF: Check Type Strict, Partial, None | Check Cardinality Strict, Partial, None, ...
//Natural => Formal
function Model(name) {
    this.__name = name;
    this.referenceModel = {}; //set the metamodel of this
    this.modellingElements = {};
}

//WARNING CHECK if classs is defined
Model.prototype.setModellingElement = function (Class) {
    var tab = [];
    if (Class.__name == undefined) {
        tab = this.modellingElements[Class.conformsTo().__name];
        if (tab == undefined) {
            tab = [];
        }
        
        tab.push(Class);
        this.modellingElements[Class.conformsTo().__name] = tab;
    } else {
        if (tab == undefined) {
            tab = [];
        }
        tab.push(Class);
        this.modellingElements[Class.__name] = tab;
    }
};

//Send to JSMF Util?
Model.prototype.getPersistedID = function (ModelElement) {
    var result = modelDB.resolve(ModelElement);
    return result;
}

//Send to JSMF Util?
Model.prototype.contains = function (ModelElement) {
    var indexM = ModelElement.conformsTo().__name;
    var result = _.contains(this.modellingElements[indexM], ModelElement);
    return result;
}

Model.prototype.setModellingElements = function (ClassTab) {
    if (ClassTab instanceof Array) {
        for (i in ClassTab) {
            if (ClassTab[i].__name == undefined) { //i.e. not  a meta-element
                var tab = [];
                //console.log(Class.conformsTo());
                tab = this.modellingElements[ClassTab[i].conformsTo().__name];
                if (tab == undefined) {
                    tab = [];
                }
                tab.push(ClassTab[i]);
                this.modellingElements[ClassTab[i].conformsTo().__name] = tab;
            } else {
                this.modellingElements[ClassTab[i].__name] = ClassTab[i];
            }
        }
    } else {
        console.error("Unable to set one element use Model.setModellingElements calling setModellingElement with only one element.");
        this.setModellingElement(ClassTab);
    }
};

Model.prototype.setReferenceModel = function (metamodel) {
    this.referenceModel = metamodel;
}

//WARNING model could be correct in JSMF sense but not in Neo4J.
Model.prototype.save = function () {
    // CHECK that ALL Referenced elements are valid in the DB : i.e., they have at least one attribute which is set...
    modelDB.saveModel(this);
}

//M2
function Class(name) {
    this.__name = name;
    this.__attributes = {};
    this.__references = {};
    this.__superType = {};
}

Class.newInstance = function (classname){ 
	var Obj = new Class(classname); 
	return Obj; 
};

//Class conformsTo itself (metacircularity)
Class.conformsTo = function() {
	return Class; 

};

Class.prototype.setAttribute = function (name, type) {
    if (_.contains(this.__attributes, name)) {} else {
        this.__attributes[name] = type;
    }
};

Class.prototype.setSuperType = function (Class) {
    this.__superType[Class.__name] = Class;
}

Class.prototype.getInheritanceChain = function(result) {
    if (Object.getOwnPropertyNames(this.__superType).length == 0 || this.__superType == undefined) {
        return result;
    } else {
        for(i in this.__superType) {
			result.push(this.__superType[i]);	
		}		
        return this.__superType[i].getInheritanceChain(result);
    }
}

//
Class.prototype.getAllReferences = function() {
    var result=[];
    result.push(this.__references)
    var allsuperTypes = this.getInheritanceChain([]);
    for(var i in allsuperTypes) {
		refSuperType = allsuperTypes[i];
        result.push(refSuperType.__references);
	}
    return result;  
}

Class.prototype.getAllAttributes = function() {
    var result=[];
    result.push(this.__attributes)
    var allsuperTypes = this.getInheritanceChain([]);
    for(var i in allsuperTypes) {
		refSuperType = allsuperTypes[i];
        result.push(refSuperType.__attributes);
	}
    return result;  
}

//Instance of MetaClass is conforms to Class.
Class.prototype.conformsTo = function () {
    //var result = new Class("M3Class");
    //result = this; //incorrect hypothesis <=> not self defined
    return Class; //.prototype;
};

//Relation nature: Composition: added
Class.prototype.setReference = function (name, type, cardinality, opposite, composite) {
    //check name?
    this.__references[name] = {
        "type": type, //should check the type?
        "card": cardinality
    }
    //To be TESTED
    if (opposite !== undefined) {
        var tmp = this.__references[name];
        tmp.opposite = opposite;
    }
    if (composite !== undefined) {
         var tmp = this.__references[name];
        tmp.composite = composite;
    }
};

function Enum(name) {
    this.__name = name;
    this.__literals = {};
}

Enum.prototype.conformsTo = function() {return Enum;}

Enum.prototype.setLiteral = function(name, value) {
     if (_.contains(this.__literals, name)) {} else {
        this.__literals[name]=value;
     }
};

function makeAssignation(ob, index, attype) {
    //if attype = primitive JS type else ...
    var type = new attype;
    return function (param) {
        if (param.__proto__ == type.__proto__) { //Strict equal?
            ob[index] = param;
        } else {
           // console.log("Assigning wrong type: " + param.__proto__ + " expected " + type.__proto__);
        }
    };
}

function makeReference(ob, index, type, card) {
    return function (param) {
        //CheckCardinalities
        var elementsinrelation = ob[index].length;
        if (card == 1 && elementsinrelation >= 1) {
            console.log("error trying to assign multiple elements to a single reference");
        } else {
            if (type === Class) { //bypasscheckType
                //console.log("Generic Type");
                ob[index].push(param);
            } else {
                if (type instanceof Array) { //warning checking all the element type in array
                    if (_.contains(type, param.conformsTo())) {
                        ob[index].push(param);
                    } else {
                        console.log("assigning wrong type: " + param.conformsTo().__name + " Expecting types in " + type);
                    }
                } else {
                    if (type == param.conformsTo() || _.contains(type, param.getInheritanceChain)) { //To be tested
                        ob[index].push(param);
                    } else {
                        //ob[index].push(param); //WARNING DO the push if type 
                        console.log("assigning wrong type: " + param.conformsTo().__name + " to current reference." + " Type " + type.__name + " was expected");
                    }
                }
            }
        }
    };
}

Class.prototype.newInstance = function (name) {
    var result = {}; 
    var self = this;
	
    //create setter for attributes from superclass
    var allsuperType = this.getInheritanceChain([]);

	for(var i in allsuperType) {
		refSuperType = allsuperType[i];
        for (var sup in refSuperType.__attributes) {
         	result[sup] = new refSuperType.__attributes[sup]();
            var attype = refSuperType.__attributes[sup];
            result["set" + sup] = makeAssignation(result, sup, attype);
       	}
        //do the same for references
        for (var sup in refSuperType.__references) {
            result[sup] = [];
            var type = refSuperType.__references[sup].type;
            var card = refSuperType.__references[sup].card;
            result["set" + sup] = makeReference(result, sup, type, card);
        }
	}

    //create setter for attributes (super attributes will be overwritten if they have the same name)
    for (var i in this.__attributes) {
        result[i] = new this.__attributes[i]();
        var attype = this.__attributes[i];
        result["set" + i] = makeAssignation(result, i, attype);
    }

    //create setter for references (super references will be overwritten if they have the same name)
    for (var j in this.__references) {
        result[j] = [];
        var type = this.__references[j].type;
        var card = this.__references[j].card;
        result["set" + j] = makeReference(result, j, type, card);
    }

    // Assign the "type" to which M1 class is conform to.
    result.conformsTo = function () {
        return self;
    };

    return result;
};

module.exports = {

    Class: Class,

    Model: Model

};

},{"./JSMFNeo4j.js":5,"underscore":18}],7:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= q.concurrency; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
          return a.priority - b.priority;
        };

        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }

        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };

              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))
},{"_process":2}],8:[function(require,module,exports){
(function (process){
//
// Eyes.js - a customizable value inspector for Node.js
//
//   usage:
//
//       var inspect = require('eyes').inspector({styles: {all: 'magenta'}});
//       inspect(something); // inspect with the settings passed to `inspector`
//
//     or
//
//       var eyes = require('eyes');
//       eyes.inspect(something); // inspect with the default settings
//
var eyes = exports,
    stack = [];

eyes.defaults = {
    styles: {                 // Styles applied to stdout
        all:     'cyan',      // Overall style applied to everything
        label:   'underline', // Inspection labels, like 'array' in `array: [1, 2, 3]`
        other:   'inverted',  // Objects which don't have a literal representation, such as functions
        key:     'bold',      // The keys in object literals, like 'a' in `{a: 1}`
        special: 'grey',      // null, undefined...
        string:  'green',
        number:  'magenta',
        bool:    'blue',      // true false
        regexp:  'green',     // /\d+/
    },
    pretty: true,             // Indent object literals
    hideFunctions: false,
    showHidden: false,
    stream: process.stdout,
    maxLength: 2048           // Truncate output if longer
};

// Return a curried inspect() function, with the `options` argument filled in.
eyes.inspector = function (options) {
    var that = this;
    return function (obj, label, opts) {
        return that.inspect.call(that, obj, label,
            merge(options || {}, opts || {}));
    };
};

// If we have a `stream` defined, use it to print a styled string,
// if not, we just return the stringified object.
eyes.inspect = function (obj, label, options) {
    options = merge(this.defaults, options || {});

    if (options.stream) {
        return this.print(stringify(obj, options), label, options);
    } else {
        return stringify(obj, options) + (options.styles ? '\033[39m' : '');
    }
};

// Output using the 'stream', and an optional label
// Loop through `str`, and truncate it after `options.maxLength` has been reached.
// Because escape sequences are, at this point embeded within
// the output string, we can't measure the length of the string
// in a useful way, without separating what is an escape sequence,
// versus a printable character (`c`). So we resort to counting the
// length manually.
eyes.print = function (str, label, options) {
    for (var c = 0, i = 0; i < str.length; i++) {
        if (str.charAt(i) === '\033') { i += 4 } // `4` because '\033[25m'.length + 1 == 5
        else if (c === options.maxLength) {
           str = str.slice(0, i - 1) + '…';
           break;
        } else { c++ }
    }
    return options.stream.write.call(options.stream, (label ?
        this.stylize(label, options.styles.label, options.styles) + ': ' : '') +
        this.stylize(str,   options.styles.all, options.styles) + '\033[0m' + "\n");
};

// Apply a style to a string, eventually,
// I'd like this to support passing multiple
// styles.
eyes.stylize = function (str, style, styles) {
    var codes = {
        'bold'      : [1,  22],
        'underline' : [4,  24],
        'inverse'   : [7,  27],
        'cyan'      : [36, 39],
        'magenta'   : [35, 39],
        'blue'      : [34, 39],
        'yellow'    : [33, 39],
        'green'     : [32, 39],
        'red'       : [31, 39],
        'grey'      : [90, 39]
    }, endCode;

    if (style && codes[style]) {
        endCode = (codes[style][1] === 39 && styles.all) ? codes[styles.all][0]
                                                         : codes[style][1];
        return '\033[' + codes[style][0] + 'm' + str +
               '\033[' + endCode + 'm';
    } else { return str }
};

// Convert any object to a string, ready for output.
// When an 'array' or an 'object' are encountered, they are
// passed to specialized functions, which can then recursively call
// stringify().
function stringify(obj, options) {
    var that = this, stylize = function (str, style) {
        return eyes.stylize(str, options.styles[style], options.styles)
    }, index, result;

    if ((index = stack.indexOf(obj)) !== -1) {
        return stylize(new(Array)(stack.length - index + 1).join('.'), 'special');
    }
    stack.push(obj);

    result = (function (obj) {
        switch (typeOf(obj)) {
            case "string"   : obj = stringifyString(obj.indexOf("'") === -1 ? "'" + obj + "'"
                                                                            : '"' + obj + '"');
                              return stylize(obj, 'string');
            case "regexp"   : return stylize('/' + obj.source + '/', 'regexp');
            case "number"   : return stylize(obj + '',    'number');
            case "function" : return options.stream ? stylize("Function", 'other') : '[Function]';
            case "null"     : return stylize("null",      'special');
            case "undefined": return stylize("undefined", 'special');
            case "boolean"  : return stylize(obj + '',    'bool');
            case "date"     : return stylize(obj.toUTCString());
            case "array"    : return stringifyArray(obj,  options, stack.length);
            case "object"   : return stringifyObject(obj, options, stack.length);
        }
    })(obj);

    stack.pop();
    return result;
};

// Escape invisible characters in a string
function stringifyString (str, options) {
    return str.replace(/\\/g, '\\\\')
              .replace(/\n/g, '\\n')
              .replace(/[\u0001-\u001F]/g, function (match) {
                  return '\\0' + match[0].charCodeAt(0).toString(8);
              });
}

// Convert an array to a string, such as [1, 2, 3].
// This function calls stringify() for each of the elements
// in the array.
function stringifyArray(ary, options, level) {
    var out = [];
    var pretty = options.pretty && (ary.length > 4 || ary.some(function (o) {
        return (o !== null && typeof(o) === 'object' && Object.keys(o).length > 0) ||
               (Array.isArray(o) && o.length > 0);
    }));
    var ws = pretty ? '\n' + new(Array)(level * 4 + 1).join(' ') : ' ';

    for (var i = 0; i < ary.length; i++) {
        out.push(stringify(ary[i], options));
    }

    if (out.length === 0) {
        return '[]';
    } else {
        return '[' + ws
                   + out.join(',' + (pretty ? ws : ' '))
                   + (pretty ? ws.slice(0, -4) : ws) +
               ']';
    }
};

// Convert an object to a string, such as {a: 1}.
// This function calls stringify() for each of its values,
// and does not output functions or prototype values.
function stringifyObject(obj, options, level) {
    var out = [];
    var pretty = options.pretty && (Object.keys(obj).length > 2 ||
                                    Object.keys(obj).some(function (k) { return typeof(obj[k]) === 'object' }));
    var ws = pretty ? '\n' + new(Array)(level * 4 + 1).join(' ') : ' ';

    var keys = options.showHidden ? Object.keys(obj) : Object.getOwnPropertyNames(obj);
    keys.forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(obj, k) 
          && !(obj[k] instanceof Function && options.hideFunctions)) {
            out.push(eyes.stylize(k, options.styles.key, options.styles) + ': ' +
                     stringify(obj[k], options));
        }
    });

    if (out.length === 0) {
        return '{}';
    } else {
        return "{" + ws
                   + out.join(',' + (pretty ? ws : ' '))
                   + (pretty ? ws.slice(0, -4) : ws) +
               "}";
   }
};

// A better `typeof`
function typeOf(value) {
    var s = typeof(value),
        types = [Object, Array, String, RegExp, Number, Function, Boolean, Date];

    if (s === 'object' || s === 'function') {
        if (value) {
            types.forEach(function (t) {
                if (value instanceof t) { s = t.name.toLowerCase() }
            });
        } else { s = 'null' }
    }
    return s;
}

function merge(/* variable args */) {
    var objs = Array.prototype.slice.call(arguments);
    var target = {};

    objs.forEach(function (o) {
        Object.keys(o).forEach(function (k) {
            if (k === 'styles') {
                if (! o.styles) {
                    target.styles = false;
                } else {
                    target.styles = {}
                    for (var s in o.styles) {
                        target.styles[s] = o.styles[s];
                    }
                }
            } else {
                target[k] = o[k];
            }
        });
    });
    return target;
}


}).call(this,require('_process'))
},{"_process":2}],9:[function(require,module,exports){
/*jslint node: true */
'use strict';

module.exports = require('./lib/main.js');
},{"./lib/main.js":10}],10:[function(require,module,exports){
'use strict';

var request = require('superagent'),
	step = require('step'),
	util = require('util'),
	cypher = require('./utils/cypher'),
	Validator = require('./utils/validator'),
	parser = require('./utils/parser');

module.exports = Neo4j;

function Neo4j(url, token){
	if(typeof url !== 'undefined' && url !== ''){
		this.url = url.slice(-1) !== '/' ? url : url.slice(0, -1); // remove trailing forward slash if present
	} else {
		this.url = 'http://localhost:7474';
	}

	if(token){
		this.header = {'Authorization': 'Basic realm="Neo4j" ' + token};
	} else {
		this.header = {};
	}
}

/*	Insert a Node
	Returns the node that is inserted and his node id (property: _id)
	Examples:
	Insert a Node with no label:
		insertNode({ name: 'Kristof' }, callback);
	Insert a Node with one label:
		insertNode({ name: 'Kristof' }, ['Student'], callback);
		insertNode({ name: 'Kristof' }, 'Student', callback);
		returns { _id: 14, name: 'Kristof' }
	Insert a Node with three labels:
		insertNode({ name:'Darth Vader', level: 99, hobbies: ['lightsaber fighting', 'cycling in space'], shipIds: [123, 321] }, ['User', 'Evil' ,'Man'], callback);
		returns { _id: 17, name:'Darth Vader', level: 99, hobbies: ['lightsaber fighting', 'cycling in space'], shipIds: [123, 321] }	*/

Neo4j.prototype.insertNode = function(node, labels, callback){
	var that = this;
	// Insert node without a label with post request
	if(typeof callback === 'undefined') {
		callback = labels;
		request
			.post(this.url + '/db/data/node')
			.set(this.header)
			.send(node)
			.end(function(result){
				if(result.body && result.body.data) {
					that.addNodeId(result.body, callback);
				} else {
					callback(new Error('Response body is empty'), null);
				}
			});
	} else {
		var val = new Validator();

		if(val.labels(labels).hasErrors) {
			return callback(val.error(), null);
		}

		// Flexibility: make array of single string
		if(typeof labels === 'string') {
			labels = [labels];
		}

		// Insert node and label(s) with cypher query
		if(labels instanceof Array){
			var query = 'CREATE (data'+  cypher.labels(labels) + ' {params}) RETURN data';
			this.cypherQuery(query, { params: node }, function(err, res) {
				if(err) {
					callback(err, null);
				}	else {
					callback(err, res.data[0]);
				}
			});
		} else {
			callback(new Error('The second parameter "labels" should be an array with strings OR "labels" should be a callback function.'), null);
		}
	}
};

/*	Get an array of labels of a Node
	Example:
	Get all labels of node 77:
		readLabels(77, callback);
		returns ['User','Student','Man']
*/

Neo4j.prototype.readLabels = function(node_id, callback){
	request
		.get(this.url + '/db/data/node/' + node_id + '/labels')
		.set(this.header)
		.end(function(result){
			if(result.body) {
				callback(null, result.body);
			} else {
				callback(new Error('Response is empty'), null);
			}
		});
};


/* Delete a Node --------- */
// Nodes with Relationships cannot be deleted -> deliver proper error message

Neo4j.prototype.deleteNode = function(node_id, callback){
	request
		.del(this.url + '/db/data/node/' + node_id)
		.set(this.header)
		.end(function(result){
			switch(result.statusCode){
				case 204:
					callback(null, true); // Node was deleted.
					break;
				case 404:
					callback(null, false); // Node doesn't exist.
					break;
				case 409:
					callback(null, false); // Node has Relationships and cannot be deleted.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' occurred while deleting a node.'), null);
			}
		});
};

// Delete all nodes with `labels` and `properties`.
// * `labels`          String|Array[String]    e.g.: '', [], 'User', ['User', 'Student']
// * 'properties'      Object                  e.g.: { userid: '124' }
// Returns the number of deleted nodes.

// Examples:
//   deleteNodesWithLabelsAndProperties('User',{ firstname: 'Sam', male: true }, callback);
//   deleteNodesWithLabelsAndProperties(['User','Admin'], { 'name': 'Sam'}, callback);

Neo4j.prototype.deleteNodesWithLabelsAndProperties = function (labels, properties, callback){
  var where = cypher.where('data', properties);
  var query = 'MATCH (data'+  cypher.labels(labels) + ')';

  if (where !== '') {
    query += ' WHERE ' + where;
  }

  query += ' DELETE data RETURN count(data)';

  this.cypherQuery(query, properties, function (err, res) {
		if (err) {
			callback(err);
		} else {
			callback(null, res.data[0]);
		}
  });
};


/*  Read a Node ---------- */

Neo4j.prototype.readNode = function(node_id, callback) {
	var that = this;
	request
		.get(this.url + '/db/data/node/' + node_id)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					that.addNodeId(result.body, callback); // Node found.
					break;
				case 404:
					callback(null, false); // Node doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' occurred while reading a node.'), null);
			}
		});
};

/*	Replace a Node's properties
    This will replace all existing properties on the node with the new set of attributes. */

var replaceNodeById = function(node_id, node_data, callback) {
  var that = this;
  request
    .put(that.url + '/db/data/node/' + node_id + '/properties')
	.set(this.header)
    .send(that.stringifyValueObjects(that.replaceNullWithString(node_data)))
		.end(function(result) {
      switch(result.statusCode) {
        case 204:
          callback(null, true);
          break;
        case 404:
          callback(null, false);
          break;
        default:
          callback(new Error('HTTP Error ' + result.statusCode + ' when updating a Node.'), null);
      }
    });
};
// Create an alias
Neo4j.prototype.replaceNodeById = replaceNodeById;
Neo4j.prototype.updateNode = replaceNodeById;

/*  Update a Node properties
    This will update all existing properties on the node with the new set of attributes. */

Neo4j.prototype.updateNodeById = function(node_id, node_data, callback) {
  var query = 'START data=node({_id}) SET ' + cypher.set('data', node_data) + ' RETURN data';
  node_data._id = node_id;
  this.cypherQuery(query , node_data, function(err, res) {
		if (err) {
			callback(err);
		} else {
			callback(null, res.data[0]);
		}
  });
};

// Update all nodes with `labels` and `oldProperties`, set the `newProperties` and remove `removeProperties`.
// Return nothing if `returnUpdatedNodes` is `false`. Default will return all updated nodes.

// * `labels`              String|Array[String]    e.g.: '' or [] or 'User' or ['User', 'Student']
// * 'oldProperties'       Object                  e.g.: { userid: '124' }
// * `newProperties`       Object                  e.g.: { email: 'fred@example.com' }
// * `removeProperties`    Object                  e.g.: ['old_email', 'old_address'] (Optional)
// * `returnUpdatedNodes`  Boolean                 e.g.: `false` (Optional, default: `true`)

Neo4j.prototype.updateNodesWithLabelsAndProperties = function (labels, oldProperties, newProperties, removeProperties, returnUpdatedNodes, callback) {
  var whereSetProperties = cypher.whereSetProperties('data', oldProperties, newProperties);
  var where = whereSetProperties.where;
  var query = 'MATCH (data'+  cypher.labels(labels) + ')';
  var remove;

  if (typeof removeProperties === 'function') {
    callback = removeProperties;
    returnUpdatedNodes = true;
  } else {
    remove = cypher.remove('data', removeProperties);
    if (typeof returnUpdatedNodes === 'function') {
      callback = returnUpdatedNodes;
      returnUpdatedNodes = true;
    }
  }

  if (where !== '') {
    query += ' WHERE ' + where;
  }

  query += ' SET ' + whereSetProperties.set;

  if (remove && remove !== '') {
    query += ' REMOVE ' + remove;
  }

  if (returnUpdatedNodes) {
    query += ' RETURN data';
  }

  this.cypherQuery(query , whereSetProperties.properties, function(err, res) {
		if (err) {
			callback(err);
		} else {
			callback(null, res.data);
		}
  });
};

/* Insert a Relationship ------ */

Neo4j.prototype.insertRelationship = function(root_node_id, other_node_id, relationship_type, relationship_data, callback) {
	var that = this;
	request
		.post(that.url + '/db/data/node/' + root_node_id + '/relationships')
		.set(this.header)
		.send({
			to: that.url + '/db/data/node/' + other_node_id,
			type: relationship_type,
			data: that.stringifyValueObjects(that.replaceNullWithString(relationship_data))
		})
		.end(function(result) {
			switch(result.statusCode) {
				case 201:
					that.addRelationshipId(result.body, callback);
					break;
				case 400: // Endnode not found exception
					callback(null, false);
					break;
				case 404: // Startnode not found exception
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when inserting a Relationship.'), null);
			}
		});
};

/* Delete a Relationship --------- */

Neo4j.prototype.deleteRelationship = function(relationship_id, callback) {
	var that = this;
	request
		.del(that.url + '/db/data/relationship/' + relationship_id)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 204:
					callback(null, true);
					break;
				case 404: // Relationship with that id doesn't exist.
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when deleting a Relationship.'), null);
			}
		});
};

/* Read a Relationship ----------- */

Neo4j.prototype.readRelationship = function(relationship_id, callback) {
	var that = this;

	request
		.get(that.url + '/db/data/relationship/' + relationship_id)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					that.addRelationshipId(result.body, callback);
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when reading a Relationship'), null);
			}
		});
};

/* Update a Relationship -------- */

Neo4j.prototype.updateRelationship = function(relationship_id, relationship_data, callback) {
	var that = this;

	request
		.put(that.url + '/db/data/relationship/' + relationship_id + '/properties')
		.set(this.header)
		.send(that.stringifyValueObjects(that.replaceNullWithString(relationship_data)))
		.end(function(result) {
			switch(result.statusCode) {
				case 204:
					callback(null, true);
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when updating a Relationship.'), null);
			}
		});
};

/* Create an Index ---------- */

Neo4j.prototype.insertIndex = function(index, callback) {
	var that = this;

	request
		.post(that.url + '/db/data/index/' + index.type + '/')
		.set(this.header)
		.send({
			'name': index.index,
			'config': index.config
		})
		.end(function(result) {
			switch(result.statusCode) {
				case 201:
					callback(null, result.body);
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when inserting an Index.'), null);
			}
		});
};

/*	Create an index on a property of a label
	Example:
	Create an index on the first name of a person.
		insertLabelIndex('Person', 'firstname', callback);
		returns {
				  'label' : 'Person',
				  'property-keys' : [ 'firstname' ]
				}
	Note:
	Compound indexes are not yet supported, only one property per index is allowed.
	So ['firstname', 'lastname'] is not supported yet. */

Neo4j.prototype.insertLabelIndex = function(label, property_key, callback) {
	request
			.post(this.url + '/db/data/schema/index/' + label)
			.set(this.header)
			.send({ 'property_keys' : [property_key] })
			.end(function(result){
				if(result.body) {
					callback(null, result.body);
				} else {
					callback(new Error('Response is empty'), null);
				}
	});
};

Neo4j.prototype.insertNodeIndex = function(index, callback) {
	var _index = index;
	if(typeof index === 'string') {
		_index = {
			type: 'node',
			index: index
		};
	}
	this.insertIndex(_index, callback);
};

Neo4j.prototype.insertRelationshipIndex = function(index, callback) {
	var _index = index;
	if(typeof index === 'string') {
		_index = {
			type: 'relationship',
			index: index
		};
	}
	this.insertIndex(_index, callback);
};

/* Delete an Index ---------- */

Neo4j.prototype.deleteIndex = function(index, callback) {
	request
		.del(this.url + '/db/data/index/' + index.type + '/' + index.index)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 204:
					callback(null, true); // Index was deleted.
					break;
				case 404:
					callback(null, false); // Index doesn't exist.
					break;
				default:
					callback(new Error('Unknown Error while deleting Index'), null);
			}
	});
};

Neo4j.prototype.deleteNodeIndex = function(index, callback) {
	this.deleteIndex({type: 'node', index: index}, callback);
};

Neo4j.prototype.deleteRelationshipIndex = function(index, callback) {
	this.deleteIndex({type: 'relationship', index: index}, callback);
};

Neo4j.prototype.deleteLabelIndex = function(label, property_key, callback) {
	request
	.del(this.url + '/db/data/schema/index/' + label + '/' + property_key)
	.set(this.header)
	.end(function(result) {
		switch(result.statusCode) {
			case 204:
				callback(null, true); // Index was deleted.
				break;
			case 404:
				callback(null, false); // Index doesn't exist.
				break;
			default:
				callback(new Error('Unknown Error while deleting Index'), null);
		}
	});
};

function listIndexes (url, callback, header) {
	request
	.get(url)
	.set(header)
	.end(function(result) {
		switch(result.statusCode) {
			case 200:
			case 204:
				callback(null, result.body);
				break;
			case 404:
				callback(null, false);
				break;
			default:
				callback(new Error('HTTP Error ' + result.statusCode + ' when listing all indexes.'), null);
		}
	});
}

Neo4j.prototype.listIndexes = function(indexType, callback) {
	var url = this.url + '/db/data/index/' + indexType;
	listIndexes(url, callback, this.header);
};


Neo4j.prototype.listNodeIndexes = function(callback) {
	var url = this.url + '/db/data/index/node';
	listIndexes(url, callback, this.header);
};

Neo4j.prototype.listRelationshipIndexes = function(callback) {
	var url = this.url + '/db/data/index/relationship';
	listIndexes(url, callback, this.header);
};

/*	List indexes for a label
	Example:
	listLabelIndexes('City', callback);
	returns [ { label: 'City', 'property-keys': [ 'postalcode' ] },
  			  { label: 'City', 'property-keys': [ 'name' ] } ]		*/

Neo4j.prototype.listLabelIndexes = function(label, callback) {
	var url = this.url + '/db/data/schema/index/' + label;
	listIndexes(url, callback, this.header);
};

/* Add item to Index ---------- */

Neo4j.prototype.addItemToIndex = function (args, callback) {
	var that = this;

	request
		.post(that.url + '/db/data/index/' + args.indexType + '/' + args.indexName)
		.set(this.header)
		.send({
			'uri': that.url + '/db/data/' + args.indexType + '/' + args.itemId,
			'key': args.indexKey,
			'value': args.indexValue
		})
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					that.addNodeId(result.body, callback);
					break;
				case 201:
					that.addNodeId(result.body, callback);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when adding an Item to an Index'), null);
			}
		});
};

Neo4j.prototype.addNodeToIndex = function(nodeId, indexName, indexKey, indexValue, callback) {
	this.addItemToIndex({
		indexType: 'node',
		itemId: nodeId,
		indexName: indexName,
		indexKey: indexKey,
		indexValue: indexValue
	}, callback);
};

Neo4j.prototype.addRelationshipToIndex = function(nodeId, indexName, indexKey, indexValue, callback) {
	this.addItemToIndex({
		indexType: 'relationship',
		itemId: nodeId,
		indexName: indexName,
		indexKey: indexKey,
		indexValue: indexValue
	}, callback);
};

/*	Adding one or multiple labels to a node.
	Given a node id (integer) and one label (string) or multiple labels (array of strings) (non-empty strings)
	returns true if successfully added a label otherwise it will return false.
	Examples:
	addLabelsToNode(77, 'User', callback);
	addLabelsToNode(77, ['User', 'Student'], callback);
		returns true
	addLabelsToNode(77, ['User', ''], callback);
		returns an error! no empty string allowed	*/

Neo4j.prototype.addLabelsToNode = function(nodeId, labels, callback) {
	var url = this.url + '/db/data/node/' + nodeId + '/labels';
	var errorMsg = '"Labels" should be a non-empty string or an array of non-empty strings.';

	if (typeof labels === 'string') {
		if (labels === '') {
			return callback(new Error(errorMsg), null);
		}
		labels = [labels];
	}

	if (labels instanceof Array) {
		request
			.post(url)
		    .set(this.header)
			.send(labels)
			.end(function(result) {
				switch(result.statusCode) {
					case 204:
						callback(null, true); // Labels added
						break;
					case 400:
						callback(new Error(errorMsg), null); // Empty label
						break;
					case 404:
						callback(null, false); // Node doesn't exist
						break;
					default:
						callback(new Error('HTTP Error ' + result.statusCode + ' when adding a label to a node.'), null);
				}
			});
	} else {
		callback(new Error(errorMsg), null);
	}
};

/*	Replacing labels on a node.
	This removes any labels currently on a node, and replaces them with the new labels.
	Given a node id (integer) and one label (string) or multiple labels (array of strings) (non-empty strings)
	returns true if successfully replaced all labels otherwise it will return false or an error.
	Examples:
	replaceLabelsFromNode(77, 'User', callback);
	replaceLabelsFromNode(77, ['User', 'Student'], callback);
		returns true
	replaceLabelsFromNode(77, ['User', ''], callback);
	replaceLabelsFromNode(77, null, callback);
		returns an error! no empty string allowed	*/

Neo4j.prototype.replaceLabelsFromNode = function(nodeId, labels, callback) {
	var errorMsg = '"Labels" should be a non-empty string or an array of non-empty strings.';

	if (typeof labels === 'string') {
		if(labels === '') {
			return callback(new Error(errorMsg), null);
		}
		labels = [labels];
	}

	if (labels instanceof Array) {
		request
			.put(this.url + '/db/data/node/' + nodeId + '/labels')
			.send(labels)
		    .set(this.header)
			.end(function(result) {
				switch(result.statusCode) {
					case 204:
						callback(null, true);
						break;
					case 400:
						callback(new Error(errorMsg), null); // Empty label
						break;
					case 404:
						callback(null, false);
						break;
					default:
						callback(new Error('HTTP Error ' + result.statusCode + ' when replacing labels.'), null);
			}
		});
	} else {
		callback(new Error(errorMsg), null);
	}
};

/*	Removing a label from a node
	Given a node id (positive integer) and one label (non-empty string)
	returns true if successfully removed the label otherwise it will return false (Node doesn't exist) or an error.
	Examples:
	deleteLabelFromNode(77, 'User', callback);
		returns true
	deleteLabelFromNode(77, ['Student'], callback);
	deleteLabelFromNode(77, '', callback);
		returns an error, label should be a non-empty string */

Neo4j.prototype.deleteLabelFromNode = function(nodeId, label, callback) {
	var val = new Validator();
	val.nodeId(nodeId).label(label);

	if (val.hasErrors) {
		return callback(val.error(), null);
	}

	request
		.del(this.url + '/db/data/node/' + nodeId + '/labels/'+ label)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 204:
					callback(null, true); // Label was deleted.
					break;
				case 404:
					callback(null, false); // Node doesn't exist.
					break;
				default:
					callback(new Error('Unknown Error while deleting Index'), null);
		}
	});
};

/*	Get all nodes with a label
	Given a label (non-empty string)
	returns an array of nodes with that label
	Examples:
	readNodesWithLabel('User', callback);
		returns an array with nodes with the label 'User'
	deleteLabelFromNode('DoesNotExist', callback);
		returns an empty array	 */

Neo4j.prototype.readNodesWithLabel = function(label, callback) {
	var that = this;
	var val = new Validator();

	if (val.label(label).hasErrors) {
		return callback(val.error(), null);
	}

	request
		.get(this.url + '/db/data/label/' + label + '/nodes')
		.set(this.header)
		.end(function(result) {
			var body = result.body;
			switch(result.statusCode) {
				case 200:
					if (body && body.length >= 1) {
						step(
							function addIds() {
								var group = this.group();
								body.forEach(function(node) {
									that.addNodeId(node, group());
								});
							},
							function sumUp(err, nodes) {
								if (err) {
									throw err;
								}
								callback(null, nodes);
							});
					} else {
						callback(null, body);
					}
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when reading a Relationship'), null);
			}
		});
};

/*	Get all nodes with labels and properties
	Given one label (non-empty string) or multiple labels (array of strings) and one or more properties in json
	returns an array of nodes with these labels and properties
	Examples:
	readNodesWithLabelsAndProperties('User',{ firstname: 'Sam', male: true }, callback);
		returns an array with nodes with the label 'User' and properties firstname='Sam' and male=true
	readNodesWithLabelsAndProperties(['User','Admin'], { 'name': 'DoesNotExist'}, callback);
		returns an empty array	 		*/

Neo4j.prototype.readNodesWithLabelsAndProperties = function(labels, properties, callback) {
	var that = this;
	var val = new Validator();
	val.labels(labels).properties(properties);

	if (val.hasErrors) {
		return callback(val.error(), null);
	}

	// Only one label and one property provided
	if (typeof labels === 'string' && Object.keys(properties).length === 1) {
		var props = cypher.jsonToURL(properties);
		request
			.get(this.url + '/db/data/label/' + labels + '/nodes?' + props)
			.set(this.header)
			.end(function(result) {
				var body = result.body;
				switch(result.statusCode) {
					case 200:
						if (body && body.length >= 1) {
							step(
								function addIds(){
									var group = this.group();
									body.forEach(function(node){
										that.addNodeId(node, group());
									});
								},
								function sumUp(err, nodes){
									if(err) {
										throw err;
									}
									callback(null, nodes);
								});
						} else {
							callback(null, body);
						}
						break;
					case 404:
						callback(null, false);
						break;
					default:
						callback(new Error('HTTP Error ' + result.statusCode + ' when reading Nodes.'), null);
				}
			});
		} else { // Multiple labels or properties provided
			var query = 'MATCH (data'+  cypher.labels(labels) + ') WHERE ' + cypher.where('data', properties) + ' RETURN data';
			this.cypherQuery(query, properties, function(err, res) {
				if (err) {
					callback(err, null);
				} else {
					callback(err, res.data);
				}
			});
		}
};

/*	List all labels.
	Example:
	listAllLabels(callback);
		returns [ 'User', 'Person', 'Male', 'Animal' ] */

Neo4j.prototype.listAllLabels = function(callback) {
	request
	.get(this.url + '/db/data/labels')
	.set(this.header)
	.end(function(result) {
		switch(result.statusCode) {
			case 200:
				callback(null, result.body);
				break;
			case 404:
				callback(null, false);
				break;
			default:
				callback(new Error('HTTP Error ' + result.statusCode + ' when listing all labels.'), null);
		}
	});
};

/* CONSTRAINTS */

/*	Create a uniqueness constraint on a property.
	Example:
		createUniquenessConstraint('User','email', callback);
		returns 	{
					  'label' : 'User',
					  'type' : 'UNIQUENESS',
					  'property-keys' : [ 'email' ]
					}			*/

var createUniquenessConstraint = function(label, property_key, callback) {
	var that = this;
	var val = new Validator();
	val.label(label).property(property_key);

	if (val.hasErrors) {
		return callback(val.error(), null);
	}

	request
		.post(that.url + '/db/data/schema/constraint/' + label + '/uniqueness')
		.set(this.header)
		.send({ 'property_keys' : [property_key] })
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					callback(null, result.body);
					break;
				case 409:
					callback(null, false); // Constraint already exists
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when creating a uniqueness contraint.'), null);
			}
		});
};
Neo4j.prototype.createUniquenessConstraint = createUniquenessConstraint;
Neo4j.prototype.createUniquenessContstraint = createUniquenessConstraint;

/*	Get a specific uniqueness constraint for a label and a property
	Example:
		readUniquenessConstraint('User','email', callback);
		returns [ {
				  'label' : 'User',
				  'property-keys' : [ 'email' ],
				  'type' : 'UNIQUENESS'
				} ]						 		*/

Neo4j.prototype.readUniquenessConstraint = function(label, property, callback) {
	var val = new Validator();
	val.label(label).property(property);

	if (val.hasErrors) {
		return callback();
	}

	request
		.get(this.url + '/db/data/schema/constraint/' + label + '/uniqueness/' + property)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					callback(null, result.body);
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when reading uniqueness constraints'), null);
			}
	});
};

/*	Get all uniqueness constraints for a label.
	Example:
		listAllUniquenessConstraintsForLabel('User', callback);
		returns [ {
				  'label' : 'User',
				  'property-keys' : [ 'uid' ],
				  'type' : 'UNIQUENESS'
				}, {
				  'label' : 'User',
				  'property-keys' : [ 'email' ],
				  'type' : 'UNIQUENESS'
				} ]						 		*/

Neo4j.prototype.listAllUniquenessConstraintsForLabel = function(label, callback) {
	var val = new Validator();
	val.label(label);
	if (val.hasErrors) {
		return callback();
	}

	request
		.get(this.url + '/db/data/schema/constraint/' + label + '/uniqueness')
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					callback(null, result.body);
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when listing all uniqueness constraints.'), null);
			}
	});
};

/*	Get all constraints for a label.
	Example:
		listAllConstraintsForLabel('User', callback);
		returns [ {
				  'label' : 'User',
				  'property-keys' : [ 'uid' ],
				  'type' : 'UNIQUENESS'
				}, {
				  'label' : 'User',
				  'property-keys' : [ 'email' ],
				  'type' : 'UNIQUENESS'
				} ]						*/

Neo4j.prototype.listAllConstraintsForLabel = function(label, callback) {
	var val = new Validator();
	val.label(label);
	if (val.hasErrors) {
		return callback();
	}

	request
	.get(this.url + '/db/data/schema/constraint/' + label)
	.set(this.header)
	.end(function(result) {
		switch(result.statusCode) {
			case 200:
				callback(null, result.body);
				break;
			case 404:
				callback(null, false);
				break;
			default:
				callback(new Error('HTTP Error ' + result.statusCode + ' when listing all constraints.'), null);
		}
	});
};


/*	Get all constraints.
	Example:
		listAllConstraints(callback);
		returns [ {
				  'label' : 'Product',
				  'property-keys' : [ 'pid' ],
				  'type' : 'UNIQUENESS'
				}, {
				  'label' : 'User',
				  'property-keys' : [ 'email' ],
				  'type' : 'UNIQUENESS'
				} ]								*/

Neo4j.prototype.listAllConstraints = function(callback) {
	request
	.get(this.url + '/db/data/schema/constraint')
	.set(this.header)
	.end(function(result) {
		switch(result.statusCode) {
			case 200:
				callback(null, result.body);
				break;
			case 404:
				callback(null, false);
				break;
			default:
				callback(new Error('HTTP Error ' + result.statusCode + ' when listing all constraints.'), null);
		}
	});
};

/*	Drop uniqueness constraint for a label and a property.
	Returns true if constraint was successfully removed.
	Returns false if the constraint was not found.
	Example:
		dropContstraint('User','email', callback);
		returns true	*/

Neo4j.prototype.dropUniquenessContstraint = function(label, property_key, callback) {
	var val = new Validator();
	val.label(label).property(property_key);

	if(val.hasErrors) {
		return callback(val.error(), null);
	}

	request
		.del(this.url + '/db/data/schema/constraint/' + label + '/uniqueness/' + property_key)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 204:
					callback(null, true); // Constraint was deleted.
					break;
				case 404:
					callback(null, false); // Constraint doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when removing a uniqueness contraint.'), null);
			}
		});
};

/* TRANSACTIONS */

/*	NOTE:
	Details 'statements' property in beginTransaction, addStatementsToTransaction,
	commitTransaction and beginAndCommitTransaction:

	Return results in graph format by adding	resultDataContents : [ 'row', 'graph' ]	to a statement.
	If you want to understand the graph structure of nodes and relationships returned by your query,
	you can specify the 'graph' results data format.
	For example, this is useful when you want to visualise the graph structure.
	The format collates all the nodes and relationships from all columns of the result,
	and also flattens collections of nodes and relationships, including paths.

	Note the resultDataContents property.

	Example of a 'statements' parameter:
	{
		statements:	[ { statement : 'CREATE ( bike:Bike { weight: 10 } )CREATE ( frontWheel:Wheel { spokes: 3 } )CREATE ( backWheel:Wheel { spokes: 32 } )CREATE p1 = bike -[:HAS { position: 1 } ]-> frontWheel CREATE p2 = bike -[:HAS { position: 2 } ]-> backWheel RETURN bike, p1, p2',
    					resultDataContents : [ 'row', 'graph' ]
					} ]
	}


/*	Begin a transaction
	You begin a new transaction by posting zero or more Cypher statements to the transaction endpoint.
	The server will respond with the result of your statements, as well as the location of your open transaction.
	In the 'transaction' section you will find the expire date of the transaction. It's a RFC1123 formatted timestamp.
	The transactionId will be added to the result.
	Check the above 'NOTE' for more details about the statements parameter.

	Examples:
	beginTransaction(callback);
	returns  {
				commit: 'http://localhost:7474/db/data/transaction/10/commit',
				results: [],
				transaction: { expires: 'Tue, 24 Sep 2013 19:43:31 +0000' },
				errors: [],
				_id: 10
			}

	beginTransaction({
					  statements : [ {
					    statement : 'CREATE (n {props}) RETURN n',
					    parameters : {
					      props : {
					        name : 'Adam',
					        age: 22
					      }
					    }
					  } ]
					}, calback);
	returns {
				commit: 'http://localhost:7474/db/data/transaction/18/commit',
			  	results: [ { columns: [ 'person' ], data: [ { row: [ { age: 22, name: 'Adam' } ] } ] } ],
			  	transaction: { expires: 'Sun, 22 Sep 2013 19:31:17 +0000' },
			  	errors: [],
			  	_id: 18
			}																								*/

Neo4j.prototype.beginTransaction = function(statements, callback) {
	var that = this;
	if (!statements || typeof statements === 'function') {
		callback = statements;
		statements = { statements : [] };
	}
	request
		.post(this.url + '/db/data/transaction')
		.set(this.header)
		.send(statements)
		.end(function(result) {
			switch(result.statusCode) {
				case 201:
					that.addTransactionId(result.body, callback);
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when beginning transaction.'), null);
			}
		});
};

/*	Execute statements in an open transaction
	Given that you have an open transaction, you can make a number of requests,
	each of which executes additional statements, and keeps the transaction open by resetting the transaction timeout.
	If the transaction in rolled back or it does not exist false will be returned (to callback)
	In the 'transaction' section you will find the expire date of the transaction. It's a RFC1123 formatted timestamp.
	The transactionId will be added to the result.
	Check the above 'NOTE' for more details about the statements parameter.

	Example:
		db.addStatementsToTransaction(7, {
											statements : [ {
												statement : 'CREATE (p:Person {props}) RETURN p',
													parameters : {
														props : {
															name : 'Adam',
															age: 23
														}
													}
												}]
										}, callback);
		returns {
					commit: 'http://localhost:7474/db/data/transaction/22/commit',
					results: [],
					transaction: { expires: 'Wed, 25 Sep 2013 13:45:17 +0000' },
					errors: [],
					transactionId: 22
				}																		*/

Neo4j.prototype.addStatementsToTransaction = function(transactionId, statements, callback) {
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if (val.hasErrors) {
		return callback(val.error(), null);
	}

	request
		.post(this.url + '/db/data/transaction/' + transactionId)
		.set(this.header)
		.send(statements)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					that.addTransactionId(result.body, function afterAddingTransactionId (err, res) {
						if (res.errors && res.errors.length > 0) {
							callback(new Error('An error occured when adding statements to the transaction. See "errors" inside the result for more details.'), res);
						} else {
							callback(null, res);
						}
					});
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when adding statements to transaction.'), null);
			}
		});
};

/*	Reset transaction timeout of an open transaction
	Every orphaned transaction is automatically expired after a period of inactivity.
	This may be prevented by resetting the transaction timeout.
	This request will reset the transaction timeout and return the new time at which
	the transaction will expire as an RFC1123 formatted timestamp value in the “transaction” section of the response.
	If the transaction in rolled back or it does not exist false will be returned (to callback)
	The transactionId will be added to the result.

	Example:
		resetTimeoutTransaction(7, callback);
		returns {
					commit: 'http://localhost:7474/db/data/transaction/7/commit',
					results: [],
					transaction: { expires: 'Tue, 24 Sep 2013 18:13:43 +0000' },
					errors: [],
  					transactionId: 7
  				}																	*/

Neo4j.prototype.resetTimeoutTransaction = function(transactionId, callback) {
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if (val.hasErrors) {
		return callback(val.error(), null);
	}

	request
		.post(this.url + '/db/data/transaction/' + transactionId)
		.set(this.header)
		.send({ statements : [ ]})
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					that.addTransactionId(result.body, callback);
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when resetting transaction timeout.'), null);
			}
		});
};

/*	Commit an open transaction
	Given you have an open transaction, you can send a commit request.
	Optionally, you submit additional statements along with the request that will
	be executed before committing the transaction.
	If the transaction in rolled back or it does not exist false will be returned (to callback)
	Check the above 'NOTE' for more details about the statements parameter.

	Example:
	commitTransaction(7, {
								statements : [ {
									statement : 'CREATE (p:Person {props}) RETURN p',
										parameters : {
											props : {
												name : 'Adam',
												age: 24,
												favoriteColors: ['Green', 'Vanilla White']
											}
										}
									}]
							});
	returns	{
				results: [ { columns: [ 'p' ],
				data: [ { row: [ {  name: 'Adam',
									age: 24,
									favoriteColors: [ 'Green', 'Vanilla White' ] } ] } ]
						} ],
				errors: []
			}					*/

Neo4j.prototype.commitTransaction = function(transactionId, statements, callback){
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if (val.hasErrors) {
		return callback(val.error(), null);
	}


	if (!statements || typeof statements === 'function') {
		callback = statements;
		statements = { statements : [] };
	}

	request
		.post(this.url + '/db/data/transaction/' + transactionId + '/commit')
		.set(this.header)
		.send(statements)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					callback(null, result.body);
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when commiting transaction.'), null);
			}
		});
};

/*	Rollback an open transaction
	Given that you have an open transaction, you can send a roll back request.
	The server will roll back the transaction.
	If the transaction was already rolled back or it does not exist false will be returned (to callback)
	If the transaction has been rolled back true will be returned.

	Examples:
		rollbackTransaction(10, callback); // transaction 10 exists
		returns true
		rollbackTransaction(12345, callback); // transaction 12345 doesn't exist
		returns false																*/

Neo4j.prototype.rollbackTransaction = function(transactionId, callback) {
	var that = this;
	var val = new Validator();
	val.transaction(transactionId);

	if (val.hasErrors) {
		return callback(val.error(), null);
	}

	request
		.del(this.url + '/db/data/transaction/' + transactionId)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					callback(null, true);
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when rolling back transaction.'), null);
			}
		});
};

/*	Begin and commit a transaction in one request
	If there is no need to keep a transaction open across multiple HTTP requests, you can begin a transaction,
	execute statements, and commit with just a single HTTP request.
	If the transaction in rolled back or it does not exist false will be returned (to callback)
	Check the above 'NOTE' for more details about the statements parameter.

	Examples:
		beginAndCommitTransaction({
									statements : [ {
										statement : 'CREATE (p:Person {props}) RETURN p',
											parameters : {
												props : {
													name : 'Adam',
													age: 21.17,
													favoriteNumbers: [123, 456789],
													gender: true
												}
											}
										}]
								}, callback);
		returns {
					results: [ { columns: [ 'p' ],
					data: [ { row: [ {	gender: true,
										name: 'Adam',
										favoriteNumbers: [ 123, 456789 ],
										age: 21.17 } ] } ] } ],
					errors: []
				}

		beginAndCommitTransaction({
									statements : [ {
										statement : 'CREATE (p:Person {props}) RETURN p',
										parameters : {
											props : {
												name : 'Adam',
												age: 21.17,
												favoriteNumbers: [123, 456789],
												gender: true
											}
										},
										resultDataContents : [ 'row', 'graph' ]
									}]
								}, callback);

		returns {	results: [ { columns: [ 'p' ],
					data: [ { row: [ {	gender: true,
										name: 'Adam',
										favoriteNumbers: [ 123, 456789 ],
										age: 21.17 } ],
										graph:{ nodes: [ {	id: '382',
															labels: [ 'Person' ],
															properties: {	gender: true,
																			name: 'Adam',
																			favoriteNumbers: [ 123, 456789 ],
																			age: 21.17 } } ],
																			relationships: [] } } ] } ],
					errors: [] }																				*/

Neo4j.prototype.beginAndCommitTransaction = function(statements, callback) {
	request
		.post(this.url + '/db/data/transaction/commit')
		.set(this.header)
		.set('X-Stream', true)
		.send(statements)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					callback(null, result.body);
					break;
				case 404:
					callback(null, false); // Transaction doesn't exist.
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when beginning and commiting transaction.'), null);
			}
		});
};

/* ADVANCED FUNCTIONS ---------- */

/* Get all Relationship Types -------- */

Neo4j.prototype.readRelationshipTypes = function(callback) {
	var that = this;

	request
		.get(that.url + '/db/data/relationship/types')
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					callback(null, result.body);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when retrieving relationship types.'), null);
			}
		});
};

/* Get Relationships of a Node --------- */

var readRelationshipsOfNode = function(node_id, options, callback) {
	var that = this;

	if (typeof options === 'function') {
		callback = options;
	}

	var url = that.url + '/db/data/node/' + node_id + '/relationships/';

	// Set direction of relationships to retrieve.
	if (options.direction && (options.direction === 'in' || options.direction === 'out')) {
		url += options.direction;
	} else {
		url += 'all';
	}

	// Set types of relationships to retrieve.
	if (options.types && options.types.length >= 1) {
		url += '/' + encodeURIComponent(options.types.join('&'));
	}

	request
		.get(url)
		.set(this.header)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					that.addRelationshipIdForArray(result.body, callback);
					break;
				case 404:
					callback(null, false);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when retrieving relationships for node ' + node_id), null);
			}
		});
};
// Create aliases
Neo4j.prototype.readRelationshipsOfNode = readRelationshipsOfNode;
Neo4j.prototype.readAllRelationshipsOfNode = readRelationshipsOfNode;
Neo4j.prototype.readTypedRelationshipsOfNode = function(node_id, types, callback) {
	this.readRelationshipsOfNode(node_id, {types: types}, callback);
};
Neo4j.prototype.readIncomingRelationshipsOfNode = function(node_id, callback) {
	this.readRelationshipsOfNode(node_id, {direction: 'in'}, callback);
};
Neo4j.prototype.readOutgoingRelationshipsOfNode = function(node_id, callback) {
	this.readRelationshipsOfNode(node_id, {direction: 'out'}, callback);
};


/* Run Cypher Query -------- */

Neo4j.prototype.cypherQuery = function(query, params, include_stats, callback) {
	var that = this;
	var body = { query: query };
	if (params) {
		if (typeof params === 'function') {
			callback = params;
		} else {
			body['params'] = params;
		}
	}
	if (include_stats) {
		if (typeof include_stats === 'function') {
			callback = include_stats;
			include_stats = false;
		}
	}

	request
		.post(that.url + '/db/data/cypher' + (include_stats ? '?includeStats=true' : ''))
		.set(this.header)
		.set('Content-Type', 'application/json')
		.send(body)
    .on('error', callback)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					if (result.body && result.body.data.length >= 1) {
						var addIdsToColumnData = function(columnData, callback) {
							step(
								function addId() {
									var group = this.group();
									columnData.forEach(function(node) {
										that.addNodeId(node, group());
									});
								},
								function sumUp(err, nodes) {
									if (err) {
										throw err;
									} else {
										callback(null, nodes);
									}
								});
						};

						step(
							function eachColumn() {
								var group = this.group();
								result.body.data.forEach(function(columnResult) {
									addIdsToColumnData(columnResult, group());
								});
							},
							function sumUp(err, columns) {
								if (err) {
									throw err;
								} else {
									// flatten the array if only one variable is getting returned to make it more convenient.
									if (result.body.columns.length >= 2) {
										result.body.data = columns;
									} else {
										result.body.data = [].concat.apply([], columns);
									}
									callback(null, result.body);
								}
							});
					} else {
						callback(null, result.body);
					}
					break;
				case 404:
					callback(null, null);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when running the cypher query against neo4j.\n' + result.body.exception + ': ' + result.body.message), null);
			}
		});
};


/* Run Batch Queries -------- */

Neo4j.prototype.batchQuery = function(query, callback) {
	var that = this;

	request
		.post(that.url + '/db/data/batch')
		.set(this.header)
		.set('Content-Type', 'application/json')
		.send(query)
		.end(function(result) {
			switch(result.statusCode) {
				case 200:
					callback(null, result.body);
					break;
				case 404:
					callback(null, null);
					break;
				default:
					callback(new Error('HTTP Error ' + result.statusCode + ' when running the batch query against neo4j'), null);
			}
		});
};


/* HELPER METHODS --------- */

/* Extract node_id and add it as a property. */

Neo4j.prototype.addNodeId = function(node, callback) {
	if (node && node.self) {
		node.data._id = parseInt(node.self.match(/\/([0-9]+)$/)[1]);
		callback(null, node.data);
	} else {
		callback(null, node);
	}
};

/*	Extract the transaction id and adds it as an _id property. */

Neo4j.prototype.addTransactionId = function(node,  callback) {
	node._id = parseInt(node.commit.match(/\/transaction\/([0-9]+)\/commit$/)[1]);
	delete node.commit;
	callback(null, node);
};

/*	Extract start node id (_start), end node id (_end) and node id (_id) add it as a property. */

Neo4j.prototype.addRelationshipId = function(relationship, callback) {
	if (relationship.data) {
		relationship.data._start = parser.getNodeId(relationship.start);
		relationship.data._end = parser.getNodeId(relationship.end);
		relationship.data._id = parser.getRelationshipId(relationship.self);
		relationship.data._type = relationship.type;
		callback(null, relationship.data);
	} else {
		callback(new Error("Relationships data property doesn't exist.", null));
	}
};


/* Add relationship_id for an array of relationships */

Neo4j.prototype.addRelationshipIdForArray = function(relationships, callback) {
	var that = this;
	step(
		function process_relationships() {
			var group = this.group();
			relationships.forEach(function(relationship) {
				that.addRelationshipId(relationship, group());
			});
		},
		function sum_up(err, results) {
			if (err) {
				callback(err, null);
			} else {
				callback(null, results);
			}
		}
	);
};

/* Replace null values with an empty string */

Neo4j.prototype.replaceNullWithString = function(node_data, callback) {

	for (var key in node_data) {
		if (node_data.hasOwnProperty(key) && node_data[key] === null) {
			node_data[key] = '';
		}
	}

	return node_data;
};

/* Turn values that are objects themselves into strings. */

Neo4j.prototype.stringifyValueObjects = function(node_data, callback) {

	for (var key in node_data) {
		if (node_data.hasOwnProperty(key) && typeof node_data[key] === 'object') {
			node_data[key] = JSON.stringify(node_data[key]);
		}
	}

	return node_data;
};

},{"./utils/cypher":11,"./utils/parser":12,"./utils/validator":13,"step":14,"superagent":15,"util":4}],11:[function(require,module,exports){
'use strict';

// Graph utils for cypher queries
exports.where = where;
exports.set = set;
exports.remove = remove;
exports.whereSetProperties = whereSetProperties;
exports.labels = labels;
exports.jsonToURL = jsonToURL;

/*  Internal method
    Example:
    params('city', {name: 'Aalst', postalcode: 9300})
    returns city.name={name} appendToken city.postalcode={postalcode} */

function append (fieldName, props, appendToken) {
  var params = '';
  var notFirst = false;
  fieldName += '.';
  for (var key in props) {
    var obj = props[key];
    if(notFirst)
      params += appendToken;
    else
      notFirst = true;
    params += fieldName + key + '={'+ key + '}';
  }
  return params;
}

/*  Example:
    where('city', {name: 'Aalst', postalcode: 9300})
    returns city.name={name} AND city.postalcode={postalcode} */

function where (fieldName, props) {
  return append(fieldName, props, ' AND ');
}
/*  Example:
    set('city', {name: 'Aalst', postalcode: 9300})
    returns city.name={name},city.postalcode={postalcode} */

function set (fieldName, props) {
  return append(fieldName, props, ',');
}

/*  Example:
    remove('city', ['name', 'postalcode'])
    returns city.name, city.postalcode */

function remove (fieldName, props) {
  var removes = '',
    notFirst = false,
    i = props.length;

  fieldName += '.';

  while (i--) {    
     if (notFirst) {
      removes += ',';
    } else {
      notFirst = true;
    }
    removes += fieldName + props[i];
  }

  return removes;
}


// Create a `where` and `set` string and a new object with unique propertynames
// Example:
// whereSetProperties('user', {userid: 123, firstname: 'foo'}, { firstname: 'bar' })
// returns {
//   where: "user.userid={xQ_1} AND user.firstname={xQ_2}",
//   set: "user.firstname={xQ_3}",
//   props { xQ_1: 123, xQ_2: 'foo', xQ_2: 'bar'}
// }

function whereSetProperties (fieldName, oldProps, newProps) {
  var prefix = 'xQ_',
    whereClause = '',
    setClause = '',
    notFirst = false,
    props = {},
    i = 0,
    obj;
  fieldName += '.';

  // Build WHERE
  for (var k in oldProps) {
    obj = oldProps[k];
    if(notFirst)
      whereClause += ' AND ';
    else
      notFirst = true;
    whereClause += fieldName + k + '={' + prefix + (++i) + '}';

    props[prefix + i] = obj;
  }

  notFirst = false;

  // Build SET
  for (var key in newProps) {
    obj = newProps[key];
    if(notFirst)
      setClause += ',';
    else
      notFirst = true;
    // Create unique placeholder {xx1} {xx2} ...
    setClause += fieldName + key + '={' + prefix + (++i) + '}';
    // Build new properties object
    props[prefix + i] = obj;
  }

  // Return stringified `where` and `set` clause and a new object with unique property names
  // So there are no name collisions
  return {
    where: whereClause,
    set: setClause,
    properties: props
  };
}

// Example:  
//   labels(['User','Student'])
//   returns ':User:Student'

function labels (array) {
  var res = '';
  if(typeof array === 'string') {
    return ':' + array;
  }    
  for (var i = 0; i < array.length; i++) {
    res += ':' + array[i];
  }    
  return res;
}

function jsonToURL (jsonData) {
  var result = '';
  var notFirst = false;
  for(var key in jsonData){
    if(notFirst) result += '&'; else notFirst = true;
    result += encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(jsonData[key]));    
  }
  return result;
}
},{}],12:[function(require,module,exports){
'use strict';

exports.getNodeId = getNodeId;
exports.getRelationshipId = getRelationshipId;

/* Internal method
   Example:
   http://db5.sb01.stations.graphenedb.com:24789/db/data/node/7
   will return 7 as an integer */

function getNodeId (url) {
  return parseInt(url.match(/\/db\/data\/node\/([0-9]+)(\/[0-9a-z\/]+)?$/)[1]);
}


/* Internal method
   Example:
   http://db5.sb01.stations.graphenedb.com:24789/db/data/relationship/7
   will return 7 as an integer */

function getRelationshipId (url) {
  return parseInt(url.match(/\/db\/data\/relationship\/([0-9]+)(\/[0-9a-z\/]+)?$/)[1]);
}
},{}],13:[function(require,module,exports){
'use strict';

function Validator (errors) {	
	if(errors) {
		this.errors = errors;
		this.hasErrors = true;
	} else {
		this.errors = '';
		this.hasErrors = false;
	}
}

function isPositiveInteger(integer) {
	return typeof integer === 'number' && integer % 1 === 0 && integer >= 0;
}

Validator.prototype = {
	nodeId: function(nodeId) {
		var errorMsg = '"nodeId" should be a positive integer.';
		if(isPositiveInteger(nodeId))
			return this;
		return this.addError(errorMsg);
	},
	label: function(label) {
		var errorMsg = '"Label" should be a non-empty string.';
		if(label && typeof label === 'string' && label !== '')
			return this;

		return this.addError(errorMsg);
	},
	// "Labels" should be a non-empty string or an array of non-empty strings.
	labels: function(labels) {
		var errorMsg = '"Labels" should be a non-empty string or an array of non-empty strings.';
		if(labels && ((typeof labels === 'string' && labels !== '') || labels instanceof Array))
			return this;
		return this.addError(errorMsg);		
	},	
	property: function(property) {
		var errorMsg = '"property" should be a non-empty string.';
		if(property && typeof property === 'string' && property !== '')
			return this;

		return this.addError(errorMsg);
	},
	properties: function(properties) {
		var errorMsg = '"properties" should be json.';
		if(properties && typeof properties === 'object')
			return this;

		return this.addError(errorMsg);
	},
	transaction: function(transactionId) {
		var errorMsg = '"transactionId" should be a an integer.';
		if(isPositiveInteger(transactionId))
			return this;

		return this.addError(errorMsg);
	}
};

Validator.prototype.addError = function addError(errorMsg) {
	this.hasErrors = true;
	this.errors += errorMsg + '\n';
	return this;
}

Validator.prototype.error = function error() {	
	return new Error(this.errors);
}

module.exports = Validator;
},{}],14:[function(require,module,exports){
(function (process){
/*
Copyright (c) 2011 Tim Caswell <tim@creationix.com>

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Inspired by http://github.com/willconant/flow-js, but reimplemented and
// modified to fit my taste and the node.JS error handling system.
function Step() {
  var steps = Array.prototype.slice.call(arguments),
      pending, counter, results, lock;

  // Define the main callback that's given as `this` to the steps.
  function next() {
    counter = pending = 0;

    // Check if there are no steps left
    if (steps.length === 0) {
      // Throw uncaught errors
      if (arguments[0]) {
        throw arguments[0];
      }
      return;
    }

    // Get the next step to execute
    var fn = steps.shift();
    results = [];

    // Run the step in a try..catch block so exceptions don't get out of hand.
    try {
      lock = true;
      var result = fn.apply(next, arguments);
    } catch (e) {
      // Pass any exceptions on through the next callback
      next(e);
    }

    if (counter > 0 && pending == 0) {
      // If parallel() was called, and all parallel branches executed
      // syncronously, go on to the next step immediately.
      next.apply(null, results);
    } else if (result !== undefined) {
      // If a syncronous return is used, pass it to the callback
      next(undefined, result);
    }
    lock = false;
  }

  // Add a special callback generator `this.parallel()` that groups stuff.
  next.parallel = function () {
    var index = 1 + counter++;
    pending++;

    return function () {
      pending--;
      // Compress the error from any result to the first argument
      if (arguments[0]) {
        results[0] = arguments[0];
      }
      // Send the other results as arguments
      results[index] = arguments[1];
      if (!lock && pending === 0) {
        // When all parallel branches done, call the callback
        next.apply(null, results);
      }
    };
  };

  // Generates a callback generator for grouped results
  next.group = function () {
    var localCallback = next.parallel();
    var counter = 0;
    var pending = 0;
    var result = [];
    var error = undefined;

    function check() {
      if (pending === 0) {
        // When group is done, call the callback
        localCallback(error, result);
      }
    }
    process.nextTick(check); // Ensures that check is called at least once

    // Generates a callback for the group
    return function () {
      var index = counter++;
      pending++;
      return function () {
        pending--;
        // Compress the error from any result to the first argument
        if (arguments[0]) {
          error = arguments[0];
        }
        // Send the other results as arguments
        result[index] = arguments[1];
        if (!lock) { check(); }
      };
    };
  };

  // Start the engine an pass nothing to the first step.
  next();
}

// Tack on leading and tailing steps for input and output and return
// the whole thing as a function.  Basically turns step calls into function
// factories.
Step.fn = function StepFn() {
  var steps = Array.prototype.slice.call(arguments);
  return function () {
    var args = Array.prototype.slice.call(arguments);

    // Insert a first step that primes the data stream
    var toRun = [function () {
      this.apply(null, args);
    }].concat(steps);

    // If the last arg is a function add it as a last step
    if (typeof args[args.length-1] === 'function') {
      toRun.push(args.pop());
    }


    Step.apply(null, toRun);
  }
}


// Hook into commonJS module systems
if (typeof module !== 'undefined' && "exports" in module) {
  module.exports = Step;
}

}).call(this,require('_process'))
},{"_process":2}],15:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.req.method !='HEAD' 
     ? this.xhr.responseText 
     : null;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && str.length
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self); 
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
    }

    self.callback(err, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":16,"reduce":17}],16:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],17:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],18:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],19:[function(require,module,exports){
var JSMF = require('../JSMF_Prototype');

Class = JSMF.Class;
Model = JSMF.Model;

var Invoice = new Model('Invoice');

var Product = Class.newInstance('Product');
Product.setAttribute('Id', Number);
Product.setAttribute('Name', String);
Product.setAttribute('Price', Number);

Invoice.setModellingElement(Product);


var Perishable = Class.newInstance('Perishable');
Perishable.setAttribute('ExpirationDate', Date)
Perishable.setSuperType(Product);

Invoice.setModellingElement(Perishable);

var Customer = Class.newInstance('Customer');
Customer.setAttribute('Id', Number);
Customer.setAttribute('FirstName', String);
Customer.setAttribute('LastName', String);
Customer.setAttribute('Address', String);
Customer.setAttribute('Phone', String);

Invoice.setModellingElement(Customer);

var OrderLine = Class.newInstance('OrderLine');
OrderLine.setAttribute('Quantity', Number);
OrderLine.setReference('Product', [Product, Perishable], 1);

Invoice.setModellingElement(OrderLine);

var Order = Class.newInstance('Order');
Order.setAttribute('Id', Number);
Order.setAttribute('Amount', Number);
Order.setAttribute('Date', Date);

Order.setReference('Customer', Customer, 1);
Order.setReference('Lines', OrderLine, -1);

Invoice.setModellingElement(Order);



var InvoiceModel = new Model('InvoiceModel');
InvoiceModel.setReferenceModel(Invoice);

var p1 = Product.newInstance('Plate');
p1.setId(1);
p1.setName('Plate');
p1.setPrice(10);
InvoiceModel.setModellingElement(p1);


var p2 = Perishable.newInstance('Pizza');

p2.setId(2);
p2.setName('Pizza');
p2.setPrice(5);
p2.setExpirationDate(new Date(2015, 11, 01, 0, 0, 0));
InvoiceModel.setModellingElement(p2);

var c1 = Customer.newInstance('c1');
c1.setId(1);
c1.setFirstName('Jean-Sébastien');
c1.setLastName('Sottet');
c1.setAddress('5, avenue des Hauts-Fourneaux, Esch-Belval');
c1.setPhone('+3524259911');
InvoiceModel.setModellingElement(c1);

var o1 = Order.newInstance('o1');
o1.setId(1);
o1.setAmount(20);
o1.setDate(new Date());
o1.setCustomer(c1);
InvoiceModel.setModellingElement(o1);

var l1 = OrderLine.newInstance('l1');
l1.setProduct(p1);
l1.setQuantity(1);
InvoiceModel.setModellingElement(l1);

var l2 = OrderLine.newInstance('l2');
l2.setProduct(p2);
l2.setQuantity(2);

o1.setLines(l1);
o1.setLines(l2);
InvoiceModel.setModellingElement(l2);


// update form

$(document).ready(function() {

	$("#logo").remove();
	$('#address').append(c1.Address + "\nPhone: " + c1.Phone);
	$('#customer-title').append(c1.FirstName + ' ' + c1.LastName);
	$('#date').append(o1.Date.toDateString());
	$('.due').append('$'+o1.Amount);

	var lines = [l1, l2];
	for (var i=0; i<lines.length; i++) {
		var item = lines[i];
		console.log(item);
		var row = `<tr class="item-row">
			      <td class="item-name"><div class="delete-wpr"><textarea>${item.Product[0].Name}</textarea><a class="delete" href="javascript:;" title="Remove row">X</a></div></td>
			      <td class="description"><textarea></textarea></td>
			      <td><textarea class="cost">${item.Product[0].Price}</textarea></td>
			      <td><textarea class="qty">${item.Quantity}</textarea></td>
			      <td><span class="price">$ ${item.Product[0].Price * item.Quantity}</span></td>
			  	  </tr>`;
		$('#tableHeader').after(row);
	}
	update_total();
});
console.log(InvoiceModel);

},{"../JSMF_Prototype":6}]},{},[19]);
