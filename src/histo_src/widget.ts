/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let Widget;
module.exports = (Widget = class Widget {

  constructor(Histo, options) {
    this.Histo = Histo;
    if (!options.id) { return; }
    this.id = options.id;
    this.poppedStateCallback = null;
  }

  onPopState(callback) {
    return this.poppedStateCallback = callback;
  }

  callCallback(stateData, path, dfd) {
    if (this.poppedStateCallback != null) { return this.poppedStateCallback(stateData, path, dfd); }
  }

  replaceInitialState(state, path) {
    if (path == null) { path = location.href; }
    return this.replaceState(state, path);
  }

  replaceState(state, path) {
    if (path == null) { path = location.href; }
    return this.Histo.supplementState({id: this.id, widgetState: state, path});
  }

  pushState(path, state) {
    return this.Histo.pushNewState(path, {id: this.id, widgetState: state});
  }
});
