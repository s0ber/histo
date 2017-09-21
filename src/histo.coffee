Widget = require './histo_src/widget'
AsyncFn = require 'async_fn'
$ = require 'jquery'

module.exports = class Histo

  @addWidget: (options = {}) ->
    @initialize() unless @isInitialized()
    widget = new Widget(Histo, options)

    @widgets ?= {}
    @widgets[widget.id] = widget

  @initialize: ->
    @_isInitialized = true

    @_fakeStatePopped = false
    @_initialUrl = location.href
    window.onpopstate = (e) => @_popState(e?.state)
    window.onhashchange = => @replaceStateWithCurrent()
    @saveInitialStateAsCurrent()

  @unload: ->
    @_isInitialized = false

    @_fakeStatePopped = false
    window.onpopstate = null
    window.onhashchange = null

  @isInitialized: -> @_isInitialized

  @saveInitialStateAsCurrent: ->
    @saveCurrentState(window.location.state || {})

  @currentState: ->
    @_currentState

  @saveCurrentState: (state) ->
    @_currentState = JSON.parse(JSON.stringify(state))

  @supplementState: (options) ->
    return if @isPopping
    {id, widgetState} = options

    state = @_history().state || {}
    widgetState.state_id =
      if (curStateId = state[id]?.state_id)?
        curStateId
      else
        0

    state[id] = widgetState
    path = options.path or location.href
    @_history().replaceState(state, null, path)
    @saveCurrentState(state)

  @replaceStateWithCurrent: ->
    @_history().replaceState(@currentState(), null, location.href) unless @_history().state?

  @pushNewState: (path, options) ->
    @_fakeStatePopped = true

    {id, widgetState} = options
    widgetState.state_id = @currentState()[id].state_id + 1

    state = @currentState()
    state[id] = widgetState

    # remove jquery's resetting cache query string attribute
    path = @_removeURIParameter(path, '_')

    @_history().pushState(state, null, path)
    @saveCurrentState(state)

# private

  @_getChangedWidgetId: (newState) ->
    changedId = null

    for own id, widgetState of newState
      for own curId, curWidgetState of @currentState()
        if id is curId and widgetState.state_id isnt curWidgetState.state_id and Math.abs(widgetState.state_id - curWidgetState.state_id) is 1
          changedId = id
          break
          break

    changedId

  @_asyncFn: ->
    @__asyncFn ?= AsyncFn

  @_history: -> window.history

  @_removeURIParameter: (url, param) ->
    url = url.toString()
    urlparts = url.split('?')
    return url if urlparts.length < 2

    prefix = encodeURIComponent(param) + '='
    pars = urlparts[1].split(/[&;]/g)

    newPars = []
    for i in [0...pars.length]
      newPars.push pars[i] unless pars[i].lastIndexOf(prefix, 0) != -1

    if newPars.length
      url = urlparts[0] + '?' + newPars.join('&')
    else
      url = urlparts[0]

    url

  @_popState: (state) ->
    # workaround for fake popped states
    if location.href is @_initialUrl and not @_fakeStatePopped
      @_fakeStatePopped = true
      return
    @_fakeStatePopped = true

    id = @_getChangedWidgetId(state)
    return unless id?

    @dfd?.reject() if @currentChangedId? and @currentChangedId is id
    @currentChangedId = id

    widgetState = state[id]
    path = location.href
    @saveCurrentState(state)

    @dfd = dfd = new $.Deferred()
    @_asyncFn().addToCallQueue =>
      @isPopping = true
      dfd.done => @isPopping = false

      widget = @widgets[id]
      widget.callCallback(widgetState, path, dfd)

      dfd.promise()
