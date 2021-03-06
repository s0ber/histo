Histo = require '../src/histo'
FakeHistoryApi = require './stubs/fake_history_api'
_ = require 'underscore'

describe 'Histo', ->
  originalHistory = Histo._history()

  after ->
    Histo._history = -> originalHistory

  beforeEach ->
    Histo.widgets = {}
    Histo._currentState = null

  afterEach ->
    Histo.widgets = {}
    Histo.unload()

  describe '.addWidget', ->
    beforeEach ->
      sinon.spy(Histo, 'initialize')

    afterEach ->
      Histo.initialize.restore()

    it 'returns new widget instance', ->
      widget = Histo.addWidget id: 'my_widget'
      expect(widget.constructor).to.match /Widget/

    it 'initializes Histo when called at first time', ->
      Histo.addWidget id: 'my_widget'
      expect(Histo.initialize).to.be.calledOnce

    it "doesn't initializes Histo when called another time", ->
      Histo.addWidget id: 'my_widget'
      Histo.addWidget id: 'my_another_widget'
      expect(Histo.initialize).to.be.calledOnce

    it 'saves reference to created widget in @_widgets', ->
      widget = Histo.addWidget id: 'my_widget'
      expect(Histo.widgets['my_widget']).to.be.equal widget

  describe '.initialize', ->
    it 'sets @_isInitialized as true', ->
      Histo.initialize()
      expect(Histo.isInitialized()).to.be.true

    it 'binds global window.onpopstate handler', ->
      expect(window.onpopstate).to.be.null
      Histo.initialize()
      expect(window.onpopstate).to.be.instanceof Function

    it 'calls @saveInitialStateAsCurrent', ->
      sinon.spy(Histo, 'saveInitialStateAsCurrent')
      Histo.initialize()
      expect(Histo.saveInitialStateAsCurrent).to.be.calledOnce
      Histo.saveInitialStateAsCurrent.restore()

    it 'binds global window.onhashchange handler', ->
      expect(window.onhashchange).to.be.null
      Histo.initialize(Histo)
      expect(window.onhashchange).to.be.instanceof Function

  describe '.unload', ->
    it 'sets @_isInitialized as false', ->
      Histo.initialize()
      Histo.unload()
      expect(Histo.isInitialized()).to.be.false

    it 'unbinds global window.onpopstate handler', ->
      Histo.initialize()
      Histo.unload()
      expect(window.onpopstate).to.be.null

    it 'unbinds global window.onpopstate handler', ->
      Histo.initialize()
      Histo.unload()
      expect(window.onhashchange).to.be.null

  describe '.saveCurrentState', ->
    it 'clones provided "state" object in @_currentState', ->
      currentState = value: 1
      Histo.saveCurrentState(currentState)
      expect(Histo._currentState).to.be.eql currentState
      expect(Histo._currentState).to.not.be.equal currentState

  describe 'Dealing with states', ->
    beforeEach ->
      fakeHistoryApi = new FakeHistoryApi()
      Histo._history = -> fakeHistoryApi

      @widget = Histo.addWidget id: 'my_widget'
      @anotherWidget = Histo.addWidget id: 'my_another_widget'
      sinon.spy(@widget, 'callCallback')
      sinon.spy(@anotherWidget, 'callCallback')

      @widgetState1 = value: 1
      @widgetState2 = value: 2
      @anotherWidgetState1 = property: 1
      @anotherWidgetState2 = property: 2

    describe '.replaceStateWithCurrent', ->
      context 'global state is presented', ->
        it "doesn't touch global state", ->
          Histo._history().state = value: 0
          Histo.saveCurrentState(value: 1)
          Histo.replaceStateWithCurrent()
          expect(Histo._history().state).to.be.eql(value: 0)

      context 'global state is empty', ->
        it 'replaces global state with current state', ->
          Histo._history().state = null
          Histo.saveCurrentState(value: 1)
          Histo.replaceStateWithCurrent()
          expect(Histo._history().state).to.be.eql(Histo.currentState())

    describe '.supplementState', ->
      context 'there is no current history state', ->
        it 'saves provided widget state with state_id equal to 0', ->
          @widget.replaceInitialState(@widgetState1)
          expectedWidgetState = _.extend({}, @widgetState1, state_id: 0)
          expect(Histo._history().state['my_widget']).to.be.eql expectedWidgetState

      context 'there is current history state', ->
        it 'adds provided widget state to global state with state_id equal to 0', ->
          @widget.replaceInitialState(@widgetState1)
          @anotherWidget.replaceInitialState(@anotherWidgetState1)

          expectedWidgetState = _.extend({}, @widgetState1, state_id: 0)
          expectedAnotherWidgetState = _.extend({}, @anotherWidgetState1, state_id: 0)

          expect(Histo._history().state['my_widget']).to.be.eql expectedWidgetState
          expect(Histo._history().state['my_another_widget']).to.be.eql expectedAnotherWidgetState

      context 'there is current history state for provided widget', ->
        it "replaces widget state, but doesn't change it's state_id", ->
          @widget.replaceInitialState(@widgetState1)
          @widget.replaceInitialState(@widgetState2)

          expectedWidgetState = _.extend({}, @widgetState2, state_id: 0)
          expect(Histo._history().state['my_widget']).to.be.eql expectedWidgetState

      context 'state is popping', ->
        it 'does nothing', ->
          @widget.replaceInitialState(@widgetState1)

          Histo.isPopping = true
          @widget.replaceInitialState(@widgetState2)
          Histo.isPopping = false

          expectedWidgetState = _.extend({}, @widgetState1, state_id: 0)
          expect(Histo._history().state['my_widget']).to.be.eql expectedWidgetState

      context 'path was provided in options', ->
        it 'replaces state with provided path', ->
          sinon.spy(Histo._history(), 'replaceState')

          expectedWidgetState = _.extend({}, @widgetState1, state_id: 0)
          @widget.replaceInitialState(@widgetState1, '/custom_path')

          expect(Histo._history().replaceState.withArgs(
            my_widget: expectedWidgetState,
            null,
            '/custom_path'
          )).to.be.calledOnce

          expectedMyAnotherWidgetState = _.extend({}, @anotherWidgetState1, state_id: 0)
          @anotherWidget.replaceInitialState(@anotherWidgetState1)

          expect(Histo._history().replaceState.withArgs(
            my_widget: expectedWidgetState,
            my_another_widget: expectedMyAnotherWidgetState,
            null,
            '/custom_path'
          )).to.be.calledOnce

      context 'path was not provided in options', ->
        it 'replaces state with current path', ->
          sinon.spy(Histo._history(), 'replaceState')
          @widget.replaceInitialState(@widgetState1)
          expectedWidgetState = _.extend({}, @widgetState1, state_id: 0)
          expect(Histo._history().replaceState.withArgs(my_widget: expectedWidgetState, null, location.href)).to.be.calledOnce

      it 'saves new state in @currentState', ->
        @widget.replaceInitialState(@widgetState1)
        @widget.replaceInitialState(@widgetState2)

        expect(Histo._currentState).to.be.eql
          'my_widget':
            state_id: 0
            value: 2

    describe '.pushNewState', ->
      it "pushes new state, incrementing widget state's state_id", ->
        @widget.replaceInitialState(@widgetState1)
        @widget.pushState('/custom_path', @widgetState2)
        @anotherWidget.replaceInitialState(@anotherWidgetState1)
        @anotherWidget.pushState('/another_path', @anotherWidgetState2)

        expect(Histo._currentState).to.be.eql
          'my_widget':
            state_id: 1
            value: 2
          'my_another_widget':
            state_id: 1
            property: 2

      it 'saves new state in @currentState', ->
        @widget.replaceInitialState(@widgetState1)
        @widget.pushState('/custom_path', @widgetState2)

        expect(Histo._currentState).to.be.eql
          'my_widget':
            state_id: 1
            value: 2

        @anotherWidget.replaceInitialState(@anotherWidgetState1)
        @anotherWidget.pushState('/another_path', @anotherWidgetState2)

        expect(Histo._currentState).to.be.eql
          'my_widget':
            state_id: 1
            value: 2
          'my_another_widget':
            state_id: 1
            property: 2

      it 'sets @_fakeStatePopped as true', ->
        @widget.replaceInitialState(@widgetState1)
        @widget.pushState('/custom_path', @widgetState2)
        expect(Histo._fakeStatePopped).to.be.true

    describe '._popState', ->
      beforeEach ->
        @widget.replaceInitialState(@widgetState1)
        @widget.pushState('/custom_path', @widgetState2)
        @anotherWidget.replaceInitialState(@anotherWidgetState1)
        @anotherWidget.pushState('/another_path', @anotherWidgetState2)

        @widget.onPopState (state, path, dfd) =>
          dfd.resolve()

        @anotherWidget.onPopState (state, path, dfd) =>
          dfd.resolve()

      it 'saves popped state in @currentState', ->
        Histo._history().back()
        expect(Histo._currentState).to.be.eql
          'my_widget':
            state_id: 1
            value: 2
          'my_another_widget':
            state_id: 0
            property: 1

        Histo._history().back()
        expect(Histo._currentState).to.be.eql
          'my_widget':
            state_id: 0
            value: 1

        Histo._history().forward()
        expect(Histo._currentState).to.be.eql
          'my_widget':
            state_id: 1
            value: 2
          'my_another_widget':
            state_id: 0
            property: 1

        Histo._history().forward()
        expect(Histo._currentState).to.be.eql
          'my_widget':
            state_id: 1
            value: 2
          'my_another_widget':
            state_id: 1
            property: 2

      context 'going back through history', ->
        it 'calls poppedStateCallbacks for proper widgets with proper state data provided', ->
          Histo._history().back()
          expect(@anotherWidget.callCallback).to.be.calledOnce
          expect(@widget.callCallback).to.be.not.called
          expect(@anotherWidget.callCallback.lastCall.args[0]).to.be.eql
            state_id: 0
            property: 1

          Histo._history().back()
          expect(@anotherWidget.callCallback).to.be.calledOnce
          expect(@widget.callCallback).to.be.calledOnce
          expect(@widget.callCallback.lastCall.args[0]).to.be.eql
            state_id: 0
            value: 1

      context 'then going forward through history', ->
        it 'calls poppedStateCallbacks for proper widgets with proper state data provided', ->
          Histo._history().back()
          expect(@anotherWidget.callCallback).to.be.calledOnce
          expect(@widget.callCallback).to.be.not.called

          Histo._history().back()
          expect(@anotherWidget.callCallback).to.be.calledOnce
          expect(@widget.callCallback).to.be.calledOnce

          Histo._history().forward()
          expect(@widget.callCallback).to.be.calledTwice
          expect(@anotherWidget.callCallback).to.be.calledOnce
          expect(@widget.callCallback.lastCall.args[0]).to.be.eql
            state_id: 1
            value: 2

          Histo._history().forward()
          expect(@widget.callCallback).to.be.calledTwice
          expect(@anotherWidget.callCallback).to.be.calledTwice
          expect(@anotherWidget.callCallback.lastCall.args[0]).to.be.eql
            state_id: 1
            property: 2

    describe '._removeURIParameter', ->
      it 'removes uri parameter', ->
        path = 'http://mypath.com/page?page=1&_=1404657206685'
        expect(Histo._removeURIParameter(path, '_')).to.be.eql 'http://mypath.com/page?page=1'
