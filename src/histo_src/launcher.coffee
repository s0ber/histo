Histo = modula.require 'histo'

Launcher = class

  @initialize: ->
    @_isInitialized = true

    @_fakeStatePopped = false
    @_initialUrl = location.href
    window.onpopstate = _.bind(@_popState, @)
    window.onhashchange = _.bind(@_addCurrentStateOnHashChange, @)
    Histo.saveInitialStateAsCurrent()

  @unload: ->
    @_isInitialized = false

    @_fakeStatePopped = false
    window.onpopstate = null
    window.onhashchange = null

  @isInitialized: ->
    @_isInitialized

  @onBeforePushState: ->
    @_fakeStatePopped = true

  @_popState: (e) ->
    if location.href is @_initialUrl and not @_fakeStatePopped
      @_fakeStatePopped = true
      return

    @_fakeStatePopped = true

    Histo.onPopState(e?.state)

  @_addCurrentStateOnHashChange: ->
    Histo.replaceStateWithCurrent()

modula.export('histo/launcher', Launcher)
