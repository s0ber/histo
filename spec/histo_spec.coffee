Histo = modula.require 'histo'
Launcher = modula.require 'histo/launcher'

describe 'Histo', ->
  originalHistory = Histo._history()

  before ->
    sinon.spy(Launcher, 'initialize')

  after ->
    Launcher.initialize.restore()
    Histo._history = ->
      originalHistory

  beforeEach ->
    Histo.widgets = {}
    Histo._currentState = null

  afterEach ->
    Histo.widgets = {}

  describe '.addWidget', ->
    it 'returns new widget instance', ->
      widget = Histo.addWidget id: 'my_widget'
      expect(widget.constructor).to.match /Widget/

    it 'initializes Histo when called at first time', ->
      Histo.addWidget id: 'my_widget'
      expect(Launcher.initialize).to.be.calledOnce

    it "doesn't initializes Histo when called another time", ->
      Histo.addWidget id: 'my_another_widget'
      expect(Launcher.initialize).to.be.calledOnce

    it 'saves reference to created widget in @_widgets', ->
      widget = Histo.addWidget id: 'my_widget'
      expect(Histo.widgets['my_widget']).to.be.equal widget

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
      sinon.spy(@widget, 'callCallbacks')
      sinon.spy(@anotherWidget, 'callCallbacks')

      @widgetState1 = value: 1
      @widgetState2 = value: 2
      @anotherWidgetState1 = property: 1
      @anotherWidgetState2 = property: 2

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

    describe '.popState', ->
      beforeEach ->
        @widget.replaceInitialState(@widgetState1)
        @widget.pushState('/custom_path', @widgetState2)
        @anotherWidget.replaceInitialState(@anotherWidgetState1)
        @anotherWidget.pushState('/another_path', @anotherWidgetState2)

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
          expect(@anotherWidget.callCallbacks).to.be.calledOnce
          expect(@widget.callCallbacks).to.be.not.called
          expect(@anotherWidget.callCallbacks.lastCall.args[0]).to.be.eql
            state_id: 0
            property: 1

          Histo._history().back()
          expect(@anotherWidget.callCallbacks).to.be.calledOnce
          expect(@widget.callCallbacks).to.be.calledOnce
          expect(@widget.callCallbacks.lastCall.args[0]).to.be.eql
            state_id: 0
            value: 1

      context 'then going forward through history', ->
        it 'calls poppedStateCallbacks for proper widgets with proper state data provided', ->
          Histo._history().back()
          expect(@anotherWidget.callCallbacks).to.be.calledOnce
          expect(@widget.callCallbacks).to.be.not.called

          Histo._history().back()
          expect(@anotherWidget.callCallbacks).to.be.calledOnce
          expect(@widget.callCallbacks).to.be.calledOnce

          Histo._history().forward()
          expect(@widget.callCallbacks).to.be.calledTwice
          expect(@anotherWidget.callCallbacks).to.be.calledOnce
          expect(@widget.callCallbacks.lastCall.args[0]).to.be.eql
            state_id: 1
            value: 2

          Histo._history().forward()
          expect(@widget.callCallbacks).to.be.calledTwice
          expect(@anotherWidget.callCallbacks).to.be.calledTwice
          expect(@anotherWidget.callCallbacks.lastCall.args[0]).to.be.eql
            state_id: 1
            property: 2

