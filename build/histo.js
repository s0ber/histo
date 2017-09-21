(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("jquery"));
	else if(typeof define === 'function' && define.amd)
		define(["jquery"], factory);
	else if(typeof exports === 'object')
		exports["Histo"] = factory(require("jquery"));
	else
		root["Histo"] = factory(root["jquery"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var $, AsyncFn, Histo, Widget,
  hasProp = {}.hasOwnProperty;

Widget = __webpack_require__(3);

AsyncFn = __webpack_require__(2);

$ = __webpack_require__(0);

module.exports = Histo = (function() {
  function Histo() {}

  Histo.addWidget = function(options) {
    var widget;
    if (options == null) {
      options = {};
    }
    if (!this.isInitialized()) {
      this.initialize();
    }
    widget = new Widget(Histo, options);
    if (this.widgets == null) {
      this.widgets = {};
    }
    return this.widgets[widget.id] = widget;
  };

  Histo.initialize = function() {
    this._isInitialized = true;
    this._fakeStatePopped = false;
    this._initialUrl = location.href;
    window.onpopstate = (function(_this) {
      return function(e) {
        return _this._popState(e != null ? e.state : void 0);
      };
    })(this);
    window.onhashchange = (function(_this) {
      return function() {
        return _this.replaceStateWithCurrent();
      };
    })(this);
    return this.saveInitialStateAsCurrent();
  };

  Histo.unload = function() {
    this._isInitialized = false;
    this._fakeStatePopped = false;
    window.onpopstate = null;
    return window.onhashchange = null;
  };

  Histo.isInitialized = function() {
    return this._isInitialized;
  };

  Histo.saveInitialStateAsCurrent = function() {
    return this.saveCurrentState(window.location.state || {});
  };

  Histo.currentState = function() {
    return this._currentState;
  };

  Histo.saveCurrentState = function(state) {
    return this._currentState = JSON.parse(JSON.stringify(state));
  };

  Histo.supplementState = function(options) {
    var curStateId, id, path, ref, state, widgetState;
    if (this.isPopping) {
      return;
    }
    id = options.id, widgetState = options.widgetState;
    state = this._history().state || {};
    widgetState.state_id = (curStateId = (ref = state[id]) != null ? ref.state_id : void 0) != null ? curStateId : 0;
    state[id] = widgetState;
    path = options.path || location.href;
    this._history().replaceState(state, null, path);
    return this.saveCurrentState(state);
  };

  Histo.replaceStateWithCurrent = function() {
    if (this._history().state == null) {
      return this._history().replaceState(this.currentState(), null, location.href);
    }
  };

  Histo.pushNewState = function(path, options) {
    var id, state, widgetState;
    this._fakeStatePopped = true;
    id = options.id, widgetState = options.widgetState;
    widgetState.state_id = this.currentState()[id].state_id + 1;
    state = this.currentState();
    state[id] = widgetState;
    path = this._removeURIParameter(path, '_');
    this._history().pushState(state, null, path);
    return this.saveCurrentState(state);
  };

  Histo._getChangedWidgetId = function(newState) {
    var changedId, curId, curWidgetState, id, ref, widgetState;
    changedId = null;
    for (id in newState) {
      if (!hasProp.call(newState, id)) continue;
      widgetState = newState[id];
      ref = this.currentState();
      for (curId in ref) {
        if (!hasProp.call(ref, curId)) continue;
        curWidgetState = ref[curId];
        if (id === curId && widgetState.state_id !== curWidgetState.state_id && Math.abs(widgetState.state_id - curWidgetState.state_id) === 1) {
          changedId = id;
          break;
          break;
        }
      }
    }
    return changedId;
  };

  Histo._asyncFn = function() {
    return this.__asyncFn != null ? this.__asyncFn : this.__asyncFn = AsyncFn;
  };

  Histo._history = function() {
    return window.history;
  };

  Histo._removeURIParameter = function(url, param) {
    var i, j, newPars, pars, prefix, ref, urlparts;
    url = url.toString();
    urlparts = url.split('?');
    if (urlparts.length < 2) {
      return url;
    }
    prefix = encodeURIComponent(param) + '=';
    pars = urlparts[1].split(/[&;]/g);
    newPars = [];
    for (i = j = 0, ref = pars.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      if (pars[i].lastIndexOf(prefix, 0) === -1) {
        newPars.push(pars[i]);
      }
    }
    if (newPars.length) {
      url = urlparts[0] + '?' + newPars.join('&');
    } else {
      url = urlparts[0];
    }
    return url;
  };

  Histo._popState = function(state) {
    var dfd, id, path, ref, widgetState;
    if (location.href === this._initialUrl && !this._fakeStatePopped) {
      this._fakeStatePopped = true;
      return;
    }
    this._fakeStatePopped = true;
    id = this._getChangedWidgetId(state);
    if (id == null) {
      return;
    }
    if ((this.currentChangedId != null) && this.currentChangedId === id) {
      if ((ref = this.dfd) != null) {
        ref.reject();
      }
    }
    this.currentChangedId = id;
    widgetState = state[id];
    path = location.href;
    this.saveCurrentState(state);
    this.dfd = dfd = new $.Deferred();
    return this._asyncFn().addToCallQueue((function(_this) {
      return function() {
        var widget;
        _this.isPopping = true;
        dfd.done(function() {
          return _this.isPopping = false;
        });
        widget = _this.widgets[id];
        widget.callCallback(widgetState, path, dfd);
        return dfd.promise();
      };
    })(this));
  };

  return Histo;

})();


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

!function(n,e){ true?module.exports=e(__webpack_require__(0)):"function"==typeof define&&define.amd?define(["jquery"],e):"object"==typeof exports?exports.AsyncFn=e(require("jquery")):n.AsyncFn=e(n.jquery)}(this,function(n){return function(n){function e(r){if(t[r])return t[r].exports;var o=t[r]={exports:{},id:r,loaded:!1};return n[r].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var t={};return e.m=n,e.c=t,e.p="",e(0)}([function(n,e,t){n.exports=t(1)},function(n,e,t){var r;r=t(2),n.exports=window.AsyncFn=function(){function n(n){this.dfd=new r.Deferred,this.fn=n}return n.prototype.done=function(n){if(this.callback=n,this.isCalled)return this.callback()},n.prototype.call=function(){if(!this.isCalled)return this.fn().always(function(n){return function(){if(n.isCalled=!0,n.dfd.resolve(),n.callback)return n.callback()}}(this))},n.addToCallQueue=function(e){var t;return t=new n(e),null!=this.currentFn?this.currentFn.done(function(){return t.call()}):t.call(),this.currentFn=t},n.setImmediate=function(){var n,e,t,r;return e={},r=e,n=Math.random(),t=function(t){var r;if(t.data.toString()===n.toString())return e=e.next,r=e.func,delete e.func,r()},window.addEventListener&&window.postMessage?(window.addEventListener("message",t,!1),function(e){return r=r.next={func:e},window.postMessage(n,"*")}):function(n){return setTimeout(n,0)}}(),n}()},function(e,t){e.exports=n}])});
//# sourceMappingURL=async_fn.min.js.map

/***/ }),
/* 3 */
/***/ (function(module, exports) {

var Widget;

module.exports = Widget = (function() {
  function Widget(Histo, options) {
    this.Histo = Histo;
    if (!options.id) {
      return;
    }
    this.id = options.id;
    this.poppedStateCallback = null;
  }

  Widget.prototype.onPopState = function(callback) {
    return this.poppedStateCallback = callback;
  };

  Widget.prototype.callCallback = function(stateData, path, dfd) {
    if (this.poppedStateCallback != null) {
      return this.poppedStateCallback(stateData, path, dfd);
    }
  };

  Widget.prototype.replaceInitialState = function(state, path) {
    if (path == null) {
      path = location.href;
    }
    return this.replaceState(state, path);
  };

  Widget.prototype.replaceState = function(state, path) {
    if (path == null) {
      path = location.href;
    }
    return this.Histo.supplementState({
      id: this.id,
      widgetState: state,
      path: path
    });
  };

  Widget.prototype.pushState = function(path, state) {
    return this.Histo.pushNewState(path, {
      id: this.id,
      widgetState: state
    });
  };

  return Widget;

})();


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(1);


/***/ })
/******/ ]);
});