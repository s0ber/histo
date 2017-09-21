Widget = require '../../src/histo_src/widget'
Histo = require '../../src/histo'

describe 'Widget', ->
  beforeEach ->
    @widget = new Widget(Histo, id: 'my_widget')
    @callback = sinon.spy()

  describe '#contructor', ->
    it 'saves provided id in @id', ->
      expect(@widget.id).to.be.eql 'my_widget'

  describe '#onPopState', ->
    it 'saves provided callback in @poppedStateCallback', ->
      @widget.onPopState(@callback)
      expect(@widget.poppedStateCallback).to.be.eql @callback

  describe '#callCallback', ->
    beforeEach ->
      @stateData = {}
      @widget.onPopState(@callback)
      @widget.callCallback(@stateData)

    it 'calls @poppedStateCallback', ->
      expect(@callback).to.be.calledOnce

    it 'calls @poppedStateCallbacks with state data provided', ->
      expect(@callback.lastCall.args[0]).to.be.equal @stateData

  describe '#replaceState', ->
    beforeEach ->
      sinon.spy(Histo, 'supplementState')

    afterEach ->
      Histo.supplementState.restore()

    it 'calls Histo.supplementState with state data, id, and path provided', ->
      state = value: 1
      @widget.replaceState(state)
      expect(Histo.supplementState).to.be.calledOnce
      expect(Histo.supplementState.lastCall.args[0]).to.be.eql
        id: 'my_widget'
        widgetState: state
        path: location.href

    it 'replaces current state with custom path if provided', ->
      state = value: 1
      @widget.replaceState(state, '/ololo')
      expect(Histo.supplementState).to.be.calledOnce
      expect(Histo.supplementState.lastCall.args[0]).to.be.eql
        id: 'my_widget'
        widgetState: state
        path: '/ololo'

  describe '#replaceInitialState', ->
    it 'behaves the same as #replaceState', ->
      sinon.spy(@widget, 'replaceState')
      args = [value: 1, '/ololo']
      @widget.replaceInitialState(args...)
      expect(@widget.replaceState.withArgs(args...)).to.be.calledOnce
      @widget.replaceState.restore()

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
