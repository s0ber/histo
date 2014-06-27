AsyncFn = modula.require('histo/async_fn')

describe 'AsyncFn', ->
  beforeEach ->
    fn = sinon.spy()
    @asyncFn = new AsyncFn(fn)

  describe '#constructor', ->
    it 'saves provided function in @fn', ->
      expect(@asyncFn.fn).to.be.equal fn
