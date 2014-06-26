@FakeHistoryApi = class
  constructor: ->
    @curPos = 0
    @maxPos = 0
    @states = []

  replaceState: (state, title, url) ->
    @states[@curPos] = state
    @state = @curState()

  pushState: (state, title, url) ->
    @curPos++
    @maxPos = @curPos

    @states[@curPos] = state
    @state = @curState()

  curState: ->
    @states[@curPos]

  back: ->
    return if @curPos is 0

    @curPos--
    @state = @curState()
    window.onpopstate state: @curState()

  forward: ->
    return if @curPos is @maxPos

    @curPos++
    @state = @curState()
    window.onpopstate state: @curState()

