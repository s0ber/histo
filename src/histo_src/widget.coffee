Histo = modula.require 'histo'

class Widget

  constructor: (options) ->
    return unless options.id
    @id = options.id
    @poppedStateCallback = null

  onPopState: (callback) ->
    @poppedStateCallback = callback

  callCallback: (stateData, path, dfd) ->
    @poppedStateCallback(stateData, path, dfd) if @poppedStateCallback?

  replaceInitialState: (state) ->
    Histo.supplementState(id: @id, widgetState: state)

  pushState: (path, state) ->
    Histo.pushNewState(path, id: @id, widgetState: state)

modula.export('histo/widget', Widget)
