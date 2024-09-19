/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const Histo = require('../src/histo');
const FakeHistoryApi = require('./stubs/fake_history_api');
const _ = require('underscore');

describe('Histo', function() {
  const originalHistory = Histo._history();

  after(() => Histo._history = () => originalHistory);

  beforeEach(function() {
    Histo.widgets = {};
    return Histo._currentState = null;
  });

  afterEach(function() {
    Histo.widgets = {};
    return Histo.unload();
  });

  describe('.addWidget', function() {
    beforeEach(() => sinon.spy(Histo, 'initialize'));

    afterEach(() => Histo.initialize.restore());

    it('returns new widget instance', function() {
      const widget = Histo.addWidget({id: 'my_widget'});
      return expect(widget.constructor).to.match(/Widget/);
    });

    it('initializes Histo when called at first time', function() {
      Histo.addWidget({id: 'my_widget'});
      return expect(Histo.initialize).to.be.calledOnce;
    });

    it("doesn't initializes Histo when called another time", function() {
      Histo.addWidget({id: 'my_widget'});
      Histo.addWidget({id: 'my_another_widget'});
      return expect(Histo.initialize).to.be.calledOnce;
    });

    return it('saves reference to created widget in @_widgets', function() {
      const widget = Histo.addWidget({id: 'my_widget'});
      return expect(Histo.widgets['my_widget']).to.be.equal(widget);
    });
  });

  describe('.initialize', function() {
    it('sets @_isInitialized as true', function() {
      Histo.initialize();
      return expect(Histo.isInitialized()).to.be.true;
    });

    it('binds global window.onpopstate handler', function() {
      expect(window.onpopstate).to.be.null;
      Histo.initialize();
      return expect(window.onpopstate).to.be.instanceof(Function);
    });

    it('calls @saveInitialStateAsCurrent', function() {
      sinon.spy(Histo, 'saveInitialStateAsCurrent');
      Histo.initialize();
      expect(Histo.saveInitialStateAsCurrent).to.be.calledOnce;
      return Histo.saveInitialStateAsCurrent.restore();
    });

    return it('binds global window.onhashchange handler', function() {
      expect(window.onhashchange).to.be.null;
      Histo.initialize(Histo);
      return expect(window.onhashchange).to.be.instanceof(Function);
    });
  });

  describe('.unload', function() {
    it('sets @_isInitialized as false', function() {
      Histo.initialize();
      Histo.unload();
      return expect(Histo.isInitialized()).to.be.false;
    });

    it('unbinds global window.onpopstate handler', function() {
      Histo.initialize();
      Histo.unload();
      return expect(window.onpopstate).to.be.null;
    });

    return it('unbinds global window.onpopstate handler', function() {
      Histo.initialize();
      Histo.unload();
      return expect(window.onhashchange).to.be.null;
    });
  });

  describe('.saveCurrentState', () => it('clones provided "state" object in @_currentState', function() {
    const currentState = {value: 1};
    Histo.saveCurrentState(currentState);
    expect(Histo._currentState).to.be.eql(currentState);
    return expect(Histo._currentState).to.not.be.equal(currentState);
  }));

  return describe('Dealing with states', function() {
    beforeEach(function() {
      const fakeHistoryApi = new FakeHistoryApi();
      Histo._history = () => fakeHistoryApi;

      this.widget = Histo.addWidget({id: 'my_widget'});
      this.anotherWidget = Histo.addWidget({id: 'my_another_widget'});
      sinon.spy(this.widget, 'callCallback');
      sinon.spy(this.anotherWidget, 'callCallback');

      this.widgetState1 = {value: 1};
      this.widgetState2 = {value: 2};
      this.anotherWidgetState1 = {property: 1};
      return this.anotherWidgetState2 = {property: 2};
    });

    describe('.replaceStateWithCurrent', function() {
      context('global state is presented', () => it("doesn't touch global state", function() {
        Histo._history().state = {value: 0};
        Histo.saveCurrentState({value: 1});
        Histo.replaceStateWithCurrent();
        return expect(Histo._history().state).to.be.eql({value: 0});
      }));

      return context('global state is empty', () => it('replaces global state with current state', function() {
        Histo._history().state = null;
        Histo.saveCurrentState({value: 1});
        Histo.replaceStateWithCurrent();
        return expect(Histo._history().state).to.be.eql(Histo.currentState());
      }));
    });

    describe('.supplementState', function() {
      context('there is no current history state', () => it('saves provided widget state with state_id equal to 0', function() {
        this.widget.replaceInitialState(this.widgetState1);
        const expectedWidgetState = _.extend({}, this.widgetState1, {state_id: 0});
        return expect(Histo._history().state['my_widget']).to.be.eql(expectedWidgetState);
      }));

      context('there is current history state', () => it('adds provided widget state to global state with state_id equal to 0', function() {
        this.widget.replaceInitialState(this.widgetState1);
        this.anotherWidget.replaceInitialState(this.anotherWidgetState1);

        const expectedWidgetState = _.extend({}, this.widgetState1, {state_id: 0});
        const expectedAnotherWidgetState = _.extend({}, this.anotherWidgetState1, {state_id: 0});

        expect(Histo._history().state['my_widget']).to.be.eql(expectedWidgetState);
        return expect(Histo._history().state['my_another_widget']).to.be.eql(expectedAnotherWidgetState);
      }));

      context('there is current history state for provided widget', () => it("replaces widget state, but doesn't change it's state_id", function() {
        this.widget.replaceInitialState(this.widgetState1);
        this.widget.replaceInitialState(this.widgetState2);

        const expectedWidgetState = _.extend({}, this.widgetState2, {state_id: 0});
        return expect(Histo._history().state['my_widget']).to.be.eql(expectedWidgetState);
      }));

      context('state is popping', () => it('does nothing', function() {
        this.widget.replaceInitialState(this.widgetState1);

        Histo.isPopping = true;
        this.widget.replaceInitialState(this.widgetState2);
        Histo.isPopping = false;

        const expectedWidgetState = _.extend({}, this.widgetState1, {state_id: 0});
        return expect(Histo._history().state['my_widget']).to.be.eql(expectedWidgetState);
      }));

      context('path was provided in options', () => it('replaces state with provided path', function() {
        sinon.spy(Histo._history(), 'replaceState');

        const expectedWidgetState = _.extend({}, this.widgetState1, {state_id: 0});
        this.widget.replaceInitialState(this.widgetState1, '/custom_path');

        expect(Histo._history().replaceState.withArgs(
          {my_widget: expectedWidgetState},
          null,
          '/custom_path'
        )).to.be.calledOnce;

        const expectedMyAnotherWidgetState = _.extend({}, this.anotherWidgetState1, {state_id: 0});
        this.anotherWidget.replaceInitialState(this.anotherWidgetState1);

        return expect(Histo._history().replaceState.withArgs({
          my_widget: expectedWidgetState,
          my_another_widget: expectedMyAnotherWidgetState
        },
          null,
          '/custom_path'
        )).to.be.calledOnce;
      }));

      context('path was not provided in options', () => it('replaces state with current path', function() {
        sinon.spy(Histo._history(), 'replaceState');
        this.widget.replaceInitialState(this.widgetState1);
        const expectedWidgetState = _.extend({}, this.widgetState1, {state_id: 0});
        return expect(Histo._history().replaceState.withArgs({my_widget: expectedWidgetState}, null, location.href)).to.be.calledOnce;
      }));

      return it('saves new state in @currentState', function() {
        this.widget.replaceInitialState(this.widgetState1);
        this.widget.replaceInitialState(this.widgetState2);

        return expect(Histo._currentState).to.be.eql({
          'my_widget': {
            state_id: 0,
            value: 2
          }
        });
      });
    });

    describe('.pushNewState', function() {
      it("pushes new state, incrementing widget state's state_id", function() {
        this.widget.replaceInitialState(this.widgetState1);
        this.widget.pushState('/custom_path', this.widgetState2);
        this.anotherWidget.replaceInitialState(this.anotherWidgetState1);
        this.anotherWidget.pushState('/another_path', this.anotherWidgetState2);

        return expect(Histo._currentState).to.be.eql({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 1,
            property: 2
          }
        });
      });

      it('saves new state in @currentState', function() {
        this.widget.replaceInitialState(this.widgetState1);
        this.widget.pushState('/custom_path', this.widgetState2);

        expect(Histo._currentState).to.be.eql({
          'my_widget': {
            state_id: 1,
            value: 2
          }
        });

        this.anotherWidget.replaceInitialState(this.anotherWidgetState1);
        this.anotherWidget.pushState('/another_path', this.anotherWidgetState2);

        return expect(Histo._currentState).to.be.eql({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 1,
            property: 2
          }
        });
      });

      return it('sets @_fakeStatePopped as true', function() {
        this.widget.replaceInitialState(this.widgetState1);
        this.widget.pushState('/custom_path', this.widgetState2);
        return expect(Histo._fakeStatePopped).to.be.true;
      });
    });

    describe('._popState', function() {
      beforeEach(function() {
        this.widget.replaceInitialState(this.widgetState1);
        this.widget.pushState('/custom_path', this.widgetState2);
        this.anotherWidget.replaceInitialState(this.anotherWidgetState1);
        this.anotherWidget.pushState('/another_path', this.anotherWidgetState2);

        this.widget.onPopState((state, path, dfd) => {
          return dfd.resolve();
        });

        return this.anotherWidget.onPopState((state, path, dfd) => {
          return dfd.resolve();
        });
      });

      it('saves popped state in @currentState', function() {
        Histo._history().back();
        expect(Histo._currentState).to.be.eql({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 0,
            property: 1
          }
        });

        Histo._history().back();
        expect(Histo._currentState).to.be.eql({
          'my_widget': {
            state_id: 0,
            value: 1
          }
        });

        Histo._history().forward();
        expect(Histo._currentState).to.be.eql({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 0,
            property: 1
          }
        });

        Histo._history().forward();
        return expect(Histo._currentState).to.be.eql({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 1,
            property: 2
          }
        });
      });

      context('going back through history', () => it('calls poppedStateCallbacks for proper widgets with proper state data provided', function() {
        Histo._history().back();
        expect(this.anotherWidget.callCallback).to.be.calledOnce;
        expect(this.widget.callCallback).to.be.not.called;
        expect(this.anotherWidget.callCallback.lastCall.args[0]).to.be.eql({
          state_id: 0,
          property: 1
        });

        Histo._history().back();
        expect(this.anotherWidget.callCallback).to.be.calledOnce;
        expect(this.widget.callCallback).to.be.calledOnce;
        return expect(this.widget.callCallback.lastCall.args[0]).to.be.eql({
          state_id: 0,
          value: 1
        });
      }));

      return context('then going forward through history', () => it('calls poppedStateCallbacks for proper widgets with proper state data provided', function() {
        Histo._history().back();
        expect(this.anotherWidget.callCallback).to.be.calledOnce;
        expect(this.widget.callCallback).to.be.not.called;

        Histo._history().back();
        expect(this.anotherWidget.callCallback).to.be.calledOnce;
        expect(this.widget.callCallback).to.be.calledOnce;

        Histo._history().forward();
        expect(this.widget.callCallback).to.be.calledTwice;
        expect(this.anotherWidget.callCallback).to.be.calledOnce;
        expect(this.widget.callCallback.lastCall.args[0]).to.be.eql({
          state_id: 1,
          value: 2
        });

        Histo._history().forward();
        expect(this.widget.callCallback).to.be.calledTwice;
        expect(this.anotherWidget.callCallback).to.be.calledTwice;
        return expect(this.anotherWidget.callCallback.lastCall.args[0]).to.be.eql({
          state_id: 1,
          property: 2
        });
      }));
    });

    return describe('._removeURIParameter', () => it('removes uri parameter', function() {
      const path = 'http://mypath.com/page?page=1&_=1404657206685';
      return expect(Histo._removeURIParameter(path, '_')).to.be.eql('http://mypath.com/page?page=1');
    }));
  });
});
