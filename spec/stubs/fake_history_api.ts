/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
let FakeHistoryApi;
module.exports = (FakeHistoryApi = class FakeHistoryApi {
  constructor() {
    this.curPos = 0;
    this.maxPos = 0;
    this.states = [];
  }

  replaceState(state, title, url) {
    this.states[this.curPos] = state;
    return this.state = this.curState();
  }

  pushState(state, title, url) {
    this.curPos++;
    this.maxPos = this.curPos;

    this.states[this.curPos] = state;
    return this.state = this.curState();
  }

  curState() {
    return this.states[this.curPos];
  }

  back() {
    if (this.curPos === 0) { return; }

    this.curPos--;
    this.state = this.curState();
    return window.onpopstate({state: this.curState()});
  }

  forward() {
    if (this.curPos === this.maxPos) { return; }

    this.curPos++;
    this.state = this.curState();
    return window.onpopstate({state: this.curState()});
  }
});
