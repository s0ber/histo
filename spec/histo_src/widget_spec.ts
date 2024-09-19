/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Widget = require('../../src/histo_src/widget');
const Histo = require('../../src/histo');

describe('Widget', function() {
  beforeEach(function() {
    this.widget = new Widget(Histo, {id: 'my_widget'});
    return this.callback = sinon.spy();
  });

  describe('#contructor', () => it('saves provided id in @id', function() {
    return expect(this.widget.id).to.be.eql('my_widget');
  }));

  describe('#onPopState', () => it('saves provided callback in @poppedStateCallback', function() {
    this.widget.onPopState(this.callback);
    return expect(this.widget.poppedStateCallback).to.be.eql(this.callback);
  }));

  describe('#callCallback', function() {
    beforeEach(function() {
      this.stateData = {};
      this.widget.onPopState(this.callback);
      return this.widget.callCallback(this.stateData);
    });

    it('calls @poppedStateCallback', function() {
      return expect(this.callback).to.be.calledOnce;
    });

    return it('calls @poppedStateCallbacks with state data provided', function() {
      return expect(this.callback.lastCall.args[0]).to.be.equal(this.stateData);
    });
  });

  describe('#replaceState', function() {
    beforeEach(() => sinon.spy(Histo, 'supplementState'));

    afterEach(() => Histo.supplementState.restore());

    it('calls Histo.supplementState with state data, id, and path provided', function() {
      const state = {value: 1};
      this.widget.replaceState(state);
      expect(Histo.supplementState).to.be.calledOnce;
      return expect(Histo.supplementState.lastCall.args[0]).to.be.eql({
        id: 'my_widget',
        widgetState: state,
        path: location.href
      });
    });

    return it('replaces current state with custom path if provided', function() {
      const state = {value: 1};
      this.widget.replaceState(state, '/ololo');
      expect(Histo.supplementState).to.be.calledOnce;
      return expect(Histo.supplementState.lastCall.args[0]).to.be.eql({
        id: 'my_widget',
        widgetState: state,
        path: '/ololo'
      });
    });
  });

  describe('#replaceInitialState', () => it('behaves the same as #replaceState', function() {
    sinon.spy(this.widget, 'replaceState');
    const args = [{value: 1}, '/ololo'];
    this.widget.replaceInitialState(...Array.from(args || []));
    expect(this.widget.replaceState.withArgs(...Array.from(args || []))).to.be.calledOnce;
    return this.widget.replaceState.restore();
  }));

  return describe('#pushState', function() {
    before(() => sinon.spy(Histo, 'pushNewState'));

    after(() => Histo.pushNewState.restore());

    return it('calls Histo.pushNewState with path, state data and id provided', function() {
      const path = '/my_new_path';
      const state = {value: 1};
      this.widget.pushState(path, state);

      expect(Histo.pushNewState).to.be.calledOnce;
      expect(Histo.pushNewState.lastCall.args[0]).to.be.eql(path);
      return expect(Histo.pushNewState.lastCall.args[1]).to.be.eql({
        id: 'my_widget',
        widgetState: state
      });
    });
  });
});
