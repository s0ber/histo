import Histo from '../src/index'
import Widget, { type WidgetState } from '../src/histo_src/widget'
import FakeHistoryApi from './stubs/fake_history_api'

describe('Histo', () => {
  const originalHistory = Histo.history

  afterAll(() => {
    Histo.history = originalHistory
  })

  beforeEach(() => {
    Histo.widgets = {}
    Histo.currentState = null
  })

  afterEach(() => {
    Histo.widgets = {}
    Histo.unload()
  })

  describe('.addWidget', () => {
    beforeEach(() => jest.spyOn(Histo, 'initialize'))

    it('returns new widget instance', () => {
      const widget = Histo.addWidget({id: 'my_widget'})
      expect(widget).toBeInstanceOf(Widget)
    })

    it('initializes Histo when called at first time', () => {
      Histo.addWidget({id: 'my_widget'})
      expect(Histo.initialize).toHaveBeenCalledOnce()
    })

    it("doesn't initializes Histo when called another time", () => {
      Histo.addWidget({id: 'my_widget'})
      Histo.addWidget({id: 'my_another_widget'})
      expect(Histo.initialize).toHaveBeenCalledOnce()
    })

    it('saves reference to created widget in @_widgets', () => {
      const widget = Histo.addWidget({ id: 'my_widget' })
      expect(Histo.widgets['my_widget']).toEqual(widget)
    })
  })

  describe('.initialize', () => {
    it('sets @isInitialized as true', () => {
      Histo.initialize()
      expect(Histo.isInitialized).toBe(true)
    })

    it('binds global window.onpopstate handler', () => {
      expect(window.onpopstate).toBe(null)
      Histo.initialize()
      expect(window.onpopstate).toBeInstanceOf(Function)
    })

    it('calls @saveInitialStateAsCurrent', () => {
      jest.spyOn(Histo, 'saveInitialStateAsCurrent')
      Histo.initialize()
      expect(Histo.saveInitialStateAsCurrent).toHaveBeenCalledOnce()
    })

    it('binds global window.onhashchange handler', () => {
      expect(window.onhashchange).toBe(null)
      Histo.initialize()
      expect(window.onhashchange).toBeInstanceOf(Function)
    })
  })

  describe('.unload', () => {
    it('sets @isInitialized as false', () => {
      Histo.initialize()
      Histo.unload()
      expect(Histo.isInitialized).toBe(false)
    })

    it('unbinds global window.onpopstate handler', () => {
      Histo.initialize()
      Histo.unload()
      expect(window.onpopstate).toBe(null)
    })

    it('unbinds global window.onpopstate handler', () => {
      Histo.initialize()
      Histo.unload()
      expect(window.onhashchange).toBe(null)
    })
  })

  describe('.saveCurrentState', () => {
    it('clones provided "state" object in @currentState', () => {
      const currentState = {myWidget: { state_id: 4 }, myOtherWidget: { state_id: 5 }}
      Histo.saveCurrentState(currentState)
      expect(Histo.currentState).toEqual(currentState)
      expect(Histo.currentState).not.toBe(currentState)
    })
  })

  describe('Dealing with states', () => {
    let widget: Widget
    let anotherWidget: Widget

    let widgetState1: WidgetState
    let widgetState2: WidgetState
    let anotherWidgetState1: WidgetState
    let anotherWidgetState2: WidgetState

    beforeEach(() => {
      Histo.history = new FakeHistoryApi() as any

      widget = Histo.addWidget({id: 'my_widget'})
      anotherWidget = Histo.addWidget({id: 'my_another_widget'})
      jest.spyOn(widget, 'callCallback')
      jest.spyOn(anotherWidget, 'callCallback')

      widgetState1 = { value: 1 }
      widgetState2 = { value: 2 }
      anotherWidgetState1 = { property: 1 }
      anotherWidgetState2 = { property: 2 }
    })

    describe('.replaceStateWithCurrent', () => {
      describe('global state is presented', () => {
        it("doesn't touch global state", () => {
          (Histo.history as unknown as FakeHistoryApi).state = { myWidget: {} }
          Histo.saveCurrentState({ myAnotherWidget: {} })
          Histo.replaceStateWithCurrent()
          expect(Histo.history.state).toEqual({ myWidget: {} })
        })
      })

      describe('global state is empty', () => {
        it('replaces global state with current state', () => {
          (Histo.history as unknown as FakeHistoryApi).state = null
          Histo.saveCurrentState({ myWidget: {} })
          Histo.replaceStateWithCurrent()
          expect(Histo.history.state).toEqual(Histo.currentState)
        })
      })
    })

    describe('.supplementState', () => {
      describe('there is no current history state', () => {
        it('saves provided widget state with state_id equal to 0', () => {
          widget.replaceInitialState(widgetState1, '')
          const expectedWidgetState = { ...widgetState1, state_id: 0 }
          expect(Histo.history.state['my_widget']).toEqual(expectedWidgetState)
        })
      })

      describe('there is current history state', () => {
        it('adds provided widget state to global state with state_id equal to 0', () => {
          widget.replaceInitialState(widgetState1, '')
          anotherWidget.replaceInitialState(anotherWidgetState1, '')

          const expectedWidgetState = { ...widgetState1, state_id: 0 }
          const expectedAnotherWidgetState = { ...anotherWidgetState1, state_id: 0 }

          expect(Histo.history.state['my_widget']).toEqual(expectedWidgetState)
          expect(Histo.history.state['my_another_widget']).toEqual(expectedAnotherWidgetState)
        })
      })

      describe('there is current history state for provided widget', () => {
        it("replaces widget state, but doesn't change it's state_id", () => {
          widget.replaceInitialState(widgetState1, '')
          widget.replaceInitialState(widgetState2, '')

          const expectedWidgetState = { ...widgetState2, state_id: 0 }
          expect(Histo.history.state['my_widget']).toEqual(expectedWidgetState)
        })
      })

      describe('state is popping', () => {
        it('does nothing', () => {
          widget.replaceInitialState(widgetState1, '')

          Histo.isPopping = true
          widget.replaceInitialState(widgetState2, '')
          Histo.isPopping = false

          const expectedWidgetState = { ...widgetState1, state_id: 0 }
          expect(Histo.history.state['my_widget']).toEqual(expectedWidgetState)
        })
      })

      describe('path was provided in options', () => {
        it('replaces state with provided path', () => {
          jest.spyOn(Histo.history, 'replaceState')

          const expectedWidgetState = { ...widgetState1, state_id: 0 }
          widget.replaceInitialState(widgetState1, '/custom_path')

          expect(Histo.history.replaceState).toHaveBeenCalledWith( { my_widget: expectedWidgetState }, null, '/custom_path')

          const expectedMyAnotherWidgetState = { ...anotherWidgetState1, state_id: 0 }
          anotherWidget.replaceInitialState(anotherWidgetState1, '')

          expect(Histo.history.replaceState).toHaveBeenCalledWith({
            my_widget: expectedWidgetState,
            my_another_widget: expectedMyAnotherWidgetState
          }, null, '/custom_path')
        })
      })

      describe('path was not provided in options', () => {
        it('replaces state with current path', () => {
          jest.spyOn(Histo.history, 'replaceState')
          widget.replaceInitialState(widgetState1, '')
          const expectedWidgetState = { ...widgetState1, state_id: 0 }
          expect(Histo.history.replaceState).toHaveBeenCalledWith({my_widget: expectedWidgetState}, null, location.href)
        })
      })

      it('saves new state in @currentState', () => {
        widget.replaceInitialState(widgetState1, '')
        widget.replaceInitialState(widgetState2, '')

        expect(Histo.currentState).toEqual({
          'my_widget': {
            state_id: 0,
            value: 2
          }
        })
      })
    })

    describe('.pushNewState', () => {
      it("pushes new state, incrementing widget state's state_id", () => {
        widget.replaceInitialState(widgetState1, '')
        widget.pushState('/custom_path', widgetState2)
        anotherWidget.replaceInitialState(anotherWidgetState1, '')
        anotherWidget.pushState('/another_path', anotherWidgetState2)

        expect(Histo.currentState).toEqual({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 1,
            property: 2
          }
        })
      })

      it('saves new state in @currentState', () => {
        widget.replaceInitialState(widgetState1, '')
        widget.pushState('/custom_path', widgetState2)

        expect(Histo.currentState).toEqual({
          'my_widget': {
            state_id: 1,
            value: 2
          }
        })

        anotherWidget.replaceInitialState(anotherWidgetState1, '')
        anotherWidget.pushState('/another_path', anotherWidgetState2)

        expect(Histo.currentState).toEqual({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 1,
            property: 2
          }
        })
      })

      it('sets @_fakeStatePopped as true', () => {
        widget.replaceInitialState(widgetState1, '')
        widget.pushState('/custom_path', widgetState2)
        expect(Histo._fakeStatePopped).toBe(true)
      })
    })

    describe('._popState', () => {
      beforeEach(() => {
        widget.replaceInitialState(widgetState1, '')
        widget.pushState('/custom_path', widgetState2)
        anotherWidget.replaceInitialState(anotherWidgetState1, '')
        anotherWidget.pushState('/another_path', anotherWidgetState2)

        widget.onPopState((_state, _path, resolve) => {
          resolve()
        })

        anotherWidget.onPopState((_state, _path, resolve) => {
          resolve()
        })
      })

      it('saves popped state in @currentState', () => {
        Histo.history.back()
        expect(Histo.currentState).toEqual({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 0,
            property: 1
          }
        })

        Histo.history.back()
        expect(Histo.currentState).toEqual({
          'my_widget': {
            state_id: 0,
            value: 1
          }
        })

        Histo.history.forward()
        expect(Histo.currentState).toEqual({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 0,
            property: 1
          }
        })

        Histo.history.forward()
        expect(Histo.currentState).toEqual({
          'my_widget': {
            state_id: 1,
            value: 2
          },
          'my_another_widget': {
            state_id: 1,
            property: 2
          }
        })
      })

      describe('going back through history', () => {
        it('calls poppedStateCallbacks for proper widgets with proper state data provided', (done) => {
          Histo.history.back()
          Histo.currentPopPromise.then(() => {
            expect(anotherWidget.callCallback).toHaveBeenCalledOnce()
            expect(widget.callCallback).not.toHaveBeenCalled()
            expect(anotherWidget.callCallback).toHaveBeenCalledWith({
              state_id: 0,
              property: 1
            }, expect.any(String), expect.any(Function), expect.any(Function))
          })

          Histo.history.back()
          Histo.currentPopPromise.then(() => {
            expect(anotherWidget.callCallback).toHaveBeenCalledOnce()
            expect(widget.callCallback).toHaveBeenCalledOnce()
            expect(widget.callCallback).toHaveBeenCalledWith({
              state_id: 0,
              value: 1
            }, expect.any(String), expect.any(Function), expect.any(Function))

            done()
          })
        })
      })

      describe('then going forward through history', () => {
        it('calls poppedStateCallbacks for proper widgets with proper state data provided', (done) => {
          Histo.history.back()
          Histo.currentPopPromise.then(() => {
            expect(anotherWidget.callCallback).toHaveBeenCalledOnce()
            expect(widget.callCallback).not.toHaveBeenCalled()
          })

          Histo.history.back()
          Histo.currentPopPromise.then(() => {
            expect(anotherWidget.callCallback).toHaveBeenCalledOnce()
            expect(widget.callCallback).toHaveBeenCalledOnce()
          })

          Histo.history.forward()
          Histo.currentPopPromise.then(() => {
            expect(widget.callCallback).toHaveBeenCalledTimes(2)
            expect(anotherWidget.callCallback).toHaveBeenCalledOnce()
            expect(widget.callCallback).toHaveBeenNthCalledWith(2, {
              state_id: 1,
              value: 2
            }, expect.any(String), expect.any(Function), expect.any(Function))
          })

          Histo.history.forward()
          Histo.currentPopPromise.then(() => {
            expect(widget.callCallback).toHaveBeenCalledTimes(2)
            expect(anotherWidget.callCallback).toHaveBeenCalledTimes(2)
            expect(anotherWidget.callCallback).toHaveBeenNthCalledWith(2, {
              state_id: 1,
              property: 2
            }, expect.any(String), expect.any(Function), expect.any(Function))

            done()
          })
        })
      })
    })

    describe('._removeURIParameter', () => {
      it('removes uri parameter', () => {
        const path = 'http://mypath.com/page?page=1&_=1404657206685'
        expect(Histo._removeURIParameter(path, '_')).toEqual('http://mypath.com/page?page=1')
      })
    })
  })
})
