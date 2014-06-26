Histo = modula.require 'histo'

class Widget

  constructor: (options) ->
    return unless options.id
    @id = options.id
    @poppedStateCallbacks = []

  onPopState: (callback) ->
    @poppedStateCallbacks.push(callback)

  callCallbacks: (stateData) ->
    callback(stateData) for callback in @poppedStateCallbacks

  replaceInitialState: (state) ->
    Histo.supplementState(id: @id, widgetState: state)

  pushState: (path, state) ->
    Histo.pushNewState(path, id: @id, widgetState: state)

modula.export('histo/widget', Widget)
