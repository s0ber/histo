/*! histo (v0.1.0),
 Library, which allows different widgets to register it's own history events handlers, which won't be conflicting with each others,
 by Sergey Shishkalov <sergeyshishkalov@gmail.com>
 Thu Jun 26 2014 */
(function() {
  var modules;

  modules = {};

  if (window.modula == null) {
    window.modula = {
      "export": function(name, exports) {
        return modules[name] = exports;
      },
      require: function(name) {
        var Module;
        Module = modules[name];
        if (Module) {
          return Module;
        } else {
          throw "Module '" + name + "' not found.";
        }
      }
    };
  }

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty;

  window.Histo = (function() {
    function _Class() {}

    _Class.addWidget = function(options) {
      var Widget, widget;
      if (options == null) {
        options = {};
      }
      if (!this._launcher().isInitialized()) {
        this._launcher().initialize();
      }
      Widget = modula.require('histo/widget');
      widget = new Widget(options);
      if (this.widgets == null) {
        this.widgets = {};
      }
      return this.widgets[widget.id] = widget;
    };

    _Class.saveInitialStateAsCurrent = function() {
      return this.saveCurrentState(window.location.state || {});
    };

    _Class.currentState = function() {
      return this._currentState;
    };

    _Class.saveCurrentState = function(state) {
      return this._currentState = _.clone(state);
    };

    _Class.supplementState = function(options) {
      var curStateId, id, state, widgetState, _ref;
      id = options.id, widgetState = options.widgetState;
      state = this._history().state || {};
      widgetState.state_id = (curStateId = (_ref = state[id]) != null ? _ref.state_id : void 0) != null ? curStateId : 0;
      state[id] = widgetState;
      this._history().replaceState(state, null, location.href);
      return this.saveCurrentState(state);
    };

    _Class.pushNewState = function(path, options) {
      var id, state, widgetState;
      this._launcher().onBeforePushState();
      id = options.id, widgetState = options.widgetState;
      widgetState.state_id = this.currentState()[id].state_id + 1;
      state = this.currentState();
      state[id] = widgetState;
      path = this._removeURIParameter(path, '_');
      this._history().pushState(state, null, path);
      return this.saveCurrentState(state);
    };

    _Class.onPopState = function(state) {
      var id, widget, widgetState;
      id = this._getChangedWidgetId(state);
      if (id == null) {
        return;
      }
      widget = this.widgets[id];
      widgetState = state[id];
      this.saveCurrentState(state);
      return widget.callCallbacks(widgetState);
    };

    _Class._getChangedWidgetId = function(newState) {
      var changedId, curId, curWidgetState, id, widgetState, _ref;
      changedId = null;
      for (id in newState) {
        if (!__hasProp.call(newState, id)) continue;
        widgetState = newState[id];
        _ref = this.currentState();
        for (curId in _ref) {
          if (!__hasProp.call(_ref, curId)) continue;
          curWidgetState = _ref[curId];
          if (id === curId && widgetState.state_id !== curWidgetState.state_id && Math.abs(widgetState.state_id - curWidgetState.state_id) === 1) {
            changedId = id;
            break;
            break;
          }
        }
      }
      return changedId;
    };

    _Class._launcher = function() {
      return this.__launcher != null ? this.__launcher : this.__launcher = modula.require('histo/launcher');
    };

    _Class._history = function() {
      return window.history;
    };

    _Class._removeURIParameter = function(url, param) {
      var i, pars, prefix, urlparts;
      url = url.toString();
      urlparts = url.split('?');
      if (urlparts.length < 2) {
        return url;
      }
      prefix = encodeURIComponent(param) + '=';
      pars = urlparts[1].split(/[&;]/g);
      while ((i = pars.length && i--)) {
        if (pars[i].lastIndexOf(prefix, 0) !== -1) {
          pars.splice(i, 1);
        }
      }
      if (pars.length) {
        url = urlparts[0] + '?' + pars.join('&');
      } else {
        url = urlparts[0];
      }
      return url;
    };

    return _Class;

  })();

  modula["export"]('histo', Histo);

}).call(this);

(function() {
  var Histo, Launcher;

  Histo = modula.require('histo');

  Launcher = (function() {
    function _Class() {}

    _Class.initialize = function() {
      this._isInitialized = true;
      this._fakeStatePopped = false;
      this._initialUrl = location.href;
      window.onpopstate = _.bind(this._popState, this);
      return Histo.saveInitialStateAsCurrent();
    };

    _Class.unload = function() {
      this._isInitialized = false;
      this._fakeStatePopped = false;
      return window.onpopstate = null;
    };

    _Class.isInitialized = function() {
      return this._isInitialized;
    };

    _Class.onBeforePushState = function() {
      return this._fakeStatePopped = true;
    };

    _Class._popState = function(e) {
      if (location.href === this._initialUrl && !this._fakeStatePopped) {
        this._fakeStatePopped = true;
        return;
      }
      this._fakeStatePopped = true;
      return Histo.onPopState(e != null ? e.state : void 0);
    };

    return _Class;

  })();

  modula["export"]('histo/launcher', Launcher);

}).call(this);

(function() {
  var Histo, Widget;

  Histo = modula.require('histo');

  Widget = (function() {
    function Widget(options) {
      if (!options.id) {
        return;
      }
      this.id = options.id;
      this.poppedStateCallbacks = [];
    }

    Widget.prototype.onPopState = function(callback) {
      return this.poppedStateCallbacks.push(callback);
    };

    Widget.prototype.callCallbacks = function(stateData) {
      var callback, _i, _len, _ref, _results;
      _ref = this.poppedStateCallbacks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback(stateData));
      }
      return _results;
    };

    Widget.prototype.replaceInitialState = function(state) {
      return Histo.supplementState({
        id: this.id,
        widgetState: state
      });
    };

    Widget.prototype.pushState = function(path, state) {
      return Histo.pushNewState(path, {
        id: this.id,
        widgetState: state
      });
    };

    return Widget;

  })();

  modula["export"]('histo/widget', Widget);

}).call(this);
