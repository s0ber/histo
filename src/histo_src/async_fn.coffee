class AsyncFn

  @addToCallQueue: (fn) ->
    asyncFn = new AsyncFn(fn)

    if @currentFn?
      @currentFn.done => asyncFn.call()
    else
      asyncFn.call()

    @currentFn = asyncFn

  constructor: (asyncFn) ->
    @fn = asyncFn

  done: (callback) ->
    @callback = callback
    if @isCalled
      @callback()

  call: ->
    return if @isCalled
    @fn().done =>
      @isCalled = true
      @callback() if @callback

modula.export('histo/async_fn', AsyncFn)
