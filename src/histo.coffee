window.Histo = class

  @addWidget: (options = {}) ->
    @_launcher().initialize() unless @_launcher().isInitialized()
    Widget = modula.require 'histo/widget'
    widget = new Widget(options)

    @widgets ?= {}
    @widgets[widget.id] = widget

  @saveInitialStateAsCurrent: ->
    @saveCurrentState(window.location.state || {})

  @currentState: ->
    @_currentState

  @saveCurrentState: (state) ->
    @_currentState = _.clone(state)

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
    @_history().replaceState(state, null, location.href)
    @saveCurrentState(state)

  @pushNewState: (path, options) ->
    @_launcher().onBeforePushState()

    {id, widgetState} = options
    widgetState.state_id = @currentState()[id].state_id + 1

    state = @currentState()
    state[id] = widgetState

    # remove jquery's resetting cache query string attribute
    path = @_removeURIParameter(path, '_')

    @_history().pushState(state, null, path)
    @saveCurrentState(state)

  @onPopState: (state) ->
    id = @_getChangedWidgetId(state)
    return unless id?

    widgetState = state[id]
    path = location.href
    @saveCurrentState(state)

    @_asyncFn().addToCallQueue =>
      @isPopping = true
      dfd = new $.Deferred()
      dfd.done => @isPopping = false

      widget = @widgets[id]
      widget.callCallback(widgetState, path, dfd)

      dfd.promise()

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

  @_launcher: ->
    @__launcher ?= modula.require 'histo/launcher'

  @_asyncFn: ->
    @__asyncFn ?= modula.require 'histo/async_fn'

  @_history: ->
    window.history

  @_removeURIParameter: (url, param) ->
    url = url.toString()
    urlparts = url.split('?')
    return url if urlparts.length < 2

    prefix = encodeURIComponent(param) + '='
    pars = urlparts[1].split(/[&;]/g)

    while (i = pars.length and i--)
      if pars[i].lastIndexOf(prefix, 0) != -1
        pars.splice(i, 1)

    if pars.length
      url = urlparts[0] + '?' + pars.join('&')
    else
      url = urlparts[0]

    url

modula.export('histo', Histo)
