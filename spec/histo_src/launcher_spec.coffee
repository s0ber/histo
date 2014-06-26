Histo = modula.require 'histo'
Launcher = modula.require 'histo/launcher'

describe 'Launcher', ->

  beforeEach ->
    Launcher.unload()

  afterEach ->
    Launcher.unload()

  describe '.initialize', ->
    it 'sets @_isInitialized as true', ->
      Launcher.initialize()
      expect(Launcher.isInitialized()).to.be.true

    it 'binds global window.onpopstate handler', ->
      expect(window.onpopstate).to.be.null
      Launcher.initialize()
      expect(window.onpopstate).to.be.instanceof Function

    it 'calls Histo.saveInitialStateAsCurrent', ->
      sinon.spy(Histo, 'saveInitialStateAsCurrent')
      Launcher.initialize()
      expect(Histo.saveInitialStateAsCurrent).to.be.calledOnce
      Histo.saveInitialStateAsCurrent.restore()

  describe '.unload', ->
    it 'sets @_isInitialized as false', ->
      Launcher.initialize()
      Launcher.unload()
      expect(Launcher.isInitialized()).to.be.false

    it 'unbinds global window.onpopstate handler', ->
      Launcher.initialize()
      Launcher.unload()
      expect(window.onpopstate).to.be.null

  describe '.onBeforePushState', ->
    before ->
      sinon.spy(Launcher, 'onBeforePushState')

    after ->
      Launcher.onBeforePushState.restore()

    it 'called when Histo.pushNewState is called', ->
      try
        Histo.pushNewState()
      catch
      finally
        expect(Launcher.onBeforePushState).to.be.calledOnce

    it 'sets @_fakeStatePopped as true', ->
      Launcher.onBeforePushState()
      expect(Launcher._fakeStatePopped).to.be.true

  describe '._popState', ->
    beforeEach ->
      Launcher._fakeStatePopped = true
      sinon.spy(Histo, 'onPopState')

    afterEach ->
      Launcher._fakeStatePopped = false
      Histo.onPopState.restore()

    it "calls Histo.onPopState", ->
      expect(Histo.onPopState).to.not.be.called
      Launcher._popState()
      expect(Histo.onPopState).to.be.calledOnce

