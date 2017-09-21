module.exports = class Widget

  constructor: (@Histo, options) ->
    return unless options.id
    @id = options.id
    @poppedStateCallback = null

  onPopState: (callback) ->
    @poppedStateCallback = callback

  callCallback: (stateData, path, dfd) ->
    @poppedStateCallback(stateData, path, dfd) if @poppedStateCallback?

  replaceInitialState: (state, path = location.href) ->
    @replaceState(state, path)

  replaceState: (state, path = location.href) ->
    @Histo.supplementState(id: @id, widgetState: state, path: path)

  pushState: (path, state) ->
    @Histo.pushNewState(path, id: @id, widgetState: state)
