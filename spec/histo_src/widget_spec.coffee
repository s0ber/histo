Widget = modula.require 'histo/widget'

describe 'Widget', ->

  beforeEach ->
    @widget = new Widget id: 'my_widget'

    @callback = sinon.spy()
    @secondCallback = sinon.spy()
    @thirdCallback = sinon.spy()

  describe '#contructor', ->
    it 'saves provided id in @id', ->
      expect(@widget.id).to.be.eql 'my_widget'

    it 'creates empty list for @poppedStateCallbacks', ->
      expect(@widget.poppedStateCallbacks).to.be.eql []

  describe '#onPopState', ->
    it 'saves provided callback in @poppedStateCallbacks', ->
      @widget.onPopState(@callback)
      @widget.onPopState(@secondCallback)
      @widget.onPopState(@thirdCallback)
      expect(@widget.poppedStateCallbacks).to.be.eql [@callback, @secondCallback, @thirdCallback]

  describe '#callCallbacks', ->
    beforeEach ->
      @stateData = {}

      @widget.onPopState(@callback)
      @widget.onPopState(@secondCallback)
      @widget.onPopState(@thirdCallback)

      @widget.callCallbacks(@stateData)

    it 'calls all @poppedStateCallbacks one by one', ->
      expect(@callback).to.be.calledOnce
      expect(@secondCallback).to.be.calledOnce
      expect(@thirdCallback).to.be.calledOnce

    it 'calls all @poppedStateCallbacks in proper order', ->
      expect(@callback).to.be.calledBefore @secondCallback
      expect(@secondCallback).to.be.calledBefore @thirdCallback

    it 'calls @poppedStateCallbacks with state data provided', ->
      expect(@callback.lastCall.args[0]).to.be.equal @stateData
      expect(@secondCallback.lastCall.args[0]).to.be.equal @stateData
      expect(@thirdCallback.lastCall.args[0]).to.be.equal @stateData

  describe '#replaceInitialState', ->
    before ->
      sinon.spy(Histo, 'supplementState')

    after ->
      Histo.supplementState.restore()

    it 'calls Histo.supplementState with state data and id provided', ->
      state = value: 1
      @widget.replaceInitialState(state)
      expect(Histo.supplementState).to.be.calledOnce
      expect(Histo.supplementState.lastCall.args[0]).to.be.eql
        id: 'my_widget'
        widgetState: state

  describe '#pushState', ->
    before ->
      sinon.spy(Histo, 'pushNewState')

    after ->
      Histo.pushNewState.restore()

    it 'calls Histo.pushNewState with path, state data and id provided', ->
      path = '/my_new_path'
      state = value: 1
      @widget.pushState(path, state)

      expect(Histo.pushNewState).to.be.calledOnce
      expect(Histo.pushNewState.lastCall.args[0]).to.be.eql path
      expect(Histo.pushNewState.lastCall.args[1]).to.be.eql
        id: 'my_widget'
        widgetState: state

