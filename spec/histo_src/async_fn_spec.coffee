AsyncFn = modula.require('histo/async_fn')

describe 'AsyncFn', ->
  beforeEach ->
    @dfd = null
    @fn = sinon.spy(=>
      @dfd = new $.Deferred()
      @dfd.promise()
    )

    @asyncFn = new AsyncFn(@fn)

  describe '#constructor', ->
    it 'saves provided function in @fn', ->
      expect(@asyncFn.fn).to.be.equal @fn

  describe '#done', ->
    it 'saves provided "when called" callback in @callback', ->
      anotherFn = sinon.spy()
      @asyncFn.done anotherFn
      expect(@asyncFn.callback).to.be.equal anotherFn

    context '@fn is called', ->
      it 'automatically calls provided callback', ->
        anotherFn = sinon.spy()
        @asyncFn.isCalled = true
        @asyncFn.done anotherFn
        expect(@asyncFn.callback).to.be.calledOnce

    context '@fn is not called', ->
      it "doesn't call provided callback", ->
        anotherFn = sinon.spy()
        @asyncFn.done anotherFn
        expect(@asyncFn.callback).to.be.not.called

  describe '#call', ->
    it 'calls @fn', ->
      @asyncFn.call()
      expect(@fn).to.be.calledOnce

    it 'does nothing if already called', ->
      @asyncFn.isCalled = true
      @asyncFn.call()
      expect(@fn).to.be.not.called

    it 'calls @callback when @fn is resolved', ->
      anotherFn = sinon.spy()

      @asyncFn.done anotherFn
      @asyncFn.call()
      expect(@asyncFn.callback).to.be.not.called
      @dfd.resolve().then =>
        expect(@asyncFn.callback).to.be.calledOnce

  describe 'integration testing', ->
    it 'calls callbacks in a queue one by one', (done) ->
      asyncFn1 = sinon.spy(=>
        dfd = new $.Deferred()
        setTimeout ->
          dfd.resolve()
        , 700
        dfd.promise()
      )

      asyncFn2 = sinon.spy(=>
        dfd = new $.Deferred()
        setTimeout ->
          dfd.resolve()
        , 300
        dfd.promise()
      )

      asyncFn3 = sinon.spy(=>
        dfd = new $.Deferred()
        setTimeout ->
          dfd.resolve()
        , 100
        dfd.promise()
      )

      async1 = new AsyncFn(asyncFn1)
      async2 = new AsyncFn(asyncFn2)
      async3 = new AsyncFn(asyncFn3)

      async1.done => async2.call()
      async2.done => async3.call()

      async1.call()

      setTimeout ->
        expect(asyncFn1).to.be.calledOnce
        expect(asyncFn2).to.be.calledOnce
        expect(asyncFn3).to.be.calledOnce
        expect(asyncFn1).to.be.calledBefore asyncFn2
        expect(asyncFn2).to.be.calledBefore asyncFn3
        done()
      , 1500
