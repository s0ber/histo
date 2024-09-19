/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS203: Remove `|| {}` from converted for-own loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let Histo;
const Widget = require('./histo_src/widget');
const AsyncFn = require('async_fn');
const $ = require('jquery');

module.exports = (Histo = class Histo {

  static addWidget(options) {
    if (options == null) { options = {}; }
    if (!this.isInitialized()) { this.initialize(); }
    const widget = new Widget(Histo, options);

    if (this.widgets == null) { this.widgets = {}; }
    return this.widgets[widget.id] = widget;
  }

  static initialize() {
    this._isInitialized = true;

    this._fakeStatePopped = false;
    this._initialUrl = location.href;
    window.onpopstate = e => this._popState(e?.state);
    window.onhashchange = () => this.replaceStateWithCurrent();
    return this.saveInitialStateAsCurrent();
  }

  static unload() {
    this._isInitialized = false;

    this._fakeStatePopped = false;
    window.onpopstate = null;
    return window.onhashchange = null;
  }

  static isInitialized() { return this._isInitialized; }

  static saveInitialStateAsCurrent() {
    return this.saveCurrentState(window.location.state || {});
  }

  static currentState() {
    return this._currentState;
  }

  static saveCurrentState(state) {
    return this._currentState = JSON.parse(JSON.stringify(state));
  }

  static supplementState(options) {
    let curStateId;
    if (this.isPopping) { return; }
    const {id, widgetState} = options;

    const state = this._history().state || {};
    widgetState.state_id =
      ((curStateId = state[id]?.state_id) != null) ?
        curStateId
      :
        0;

    state[id] = widgetState;
    const path = options.path || location.href;
    this._history().replaceState(state, null, path);
    return this.saveCurrentState(state);
  }

  static replaceStateWithCurrent() {
    if (this._history().state == null) { return this._history().replaceState(this.currentState(), null, location.href); }
  }

  static pushNewState(path, options) {
    this._fakeStatePopped = true;

    const {id, widgetState} = options;
    widgetState.state_id = this.currentState()[id].state_id + 1;

    const state = this.currentState();
    state[id] = widgetState;

    // remove jquery's resetting cache query string attribute
    path = this._removeURIParameter(path, '_');

    this._history().pushState(state, null, path);
    return this.saveCurrentState(state);
  }

// private

  static _getChangedWidgetId(newState) {
    let changedId = null;

    for (let id of Object.keys(newState || {})) {
      const widgetState = newState[id];
      const object = this.currentState();
      for (let curId of Object.keys(object || {})) {
        const curWidgetState = object[curId];
        if ((id === curId) && (widgetState.state_id !== curWidgetState.state_id) && (Math.abs(widgetState.state_id - curWidgetState.state_id) === 1)) {
          changedId = id;
          break;
          break;
        }
      }
    }

    return changedId;
  }

  static _asyncFn() {
    return this.__asyncFn != null ? this.__asyncFn : (this.__asyncFn = AsyncFn);
  }

  static _history() { return window.history; }

  static _removeURIParameter(url, param) {
    url = url.toString();
    const urlparts = url.split('?');
    if (urlparts.length < 2) { return url; }

    const prefix = encodeURIComponent(param) + '=';
    const pars = urlparts[1].split(/[&;]/g);

    const newPars = [];
    for (let i = 0, end = pars.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      if (pars[i].lastIndexOf(prefix, 0) === -1) { newPars.push(pars[i]); }
    }

    if (newPars.length) {
      url = urlparts[0] + '?' + newPars.join('&');
    } else {
      url = urlparts[0];
    }

    return url;
  }

  static _popState(state) {
    // workaround for fake popped states
    let dfd;
    if ((location.href === this._initialUrl) && !this._fakeStatePopped) {
      this._fakeStatePopped = true;
      return;
    }
    this._fakeStatePopped = true;

    const id = this._getChangedWidgetId(state);
    if (id == null) { return; }

    if ((this.currentChangedId != null) && (this.currentChangedId === id)) { this.dfd?.reject(); }
    this.currentChangedId = id;

    const widgetState = state[id];
    const path = location.href;
    this.saveCurrentState(state);

    this.dfd = (dfd = new $.Deferred());
    return this._asyncFn().addToCallQueue(() => {
      this.isPopping = true;
      dfd.done(() => { return this.isPopping = false; });

      const widget = this.widgets[id];
      widget.callCallback(widgetState, path, dfd);

      return dfd.promise();
    });
  }
});
