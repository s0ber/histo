import Widget, { type PoppedStateCallback, type WidgetState } from '../../src/histo_src/widget'
import Histo from '../../src/index'

describe('Widget', () => {
  let widget: Widget
  let callback: PoppedStateCallback

  beforeEach(() => {
    widget = new Widget( {id: 'my_widget'})
    callback = jest.fn()
  })

  describe('#contructor', () => {
    it('saves provided id in @id', () => {
      expect(widget.id).toBe('my_widget')
    })
  })

  describe('#onPopState', () => {
    it('saves provided callback in @poppedStateCallback', () => {
      widget.onPopState(callback)
      expect(widget.poppedStateCallback).toBe(callback)
    })
  })

  describe('#callCallback', () => {
    let stateData: WidgetState

    beforeEach(() => {
      stateData = {}
      widget.onPopState(callback)
      widget.callCallback(stateData, '', () => {}, () => {}, 'forward')
    })

    it('calls @poppedStateCallback', () => {
      expect(callback).toHaveBeenCalledOnce()
    })

    it('calls @poppedStateCallbacks with state data provided', () => {
      expect(callback).toHaveBeenCalledWith(stateData, '', expect.any(Function), expect.any(Function), 'forward')
    })
  })

  describe('#replaceState', () => {
    beforeEach(() => {
      jest.spyOn(Histo, 'supplementState')
    })

    it('calls Histo.supplementState with state data, id, and path provided', () => {
      const state = {value: 1}
      widget.replaceState(state, '')
      expect(Histo.supplementState).toHaveBeenCalledOnce()
      expect(Histo.supplementState).toHaveBeenCalledWith({
        id: 'my_widget',
        widgetState: state,
        path: ''
      })
    })

    it('replaces current state with custom path if provided', () => {
      const state = {value: 1}
      widget.replaceState(state, '/ololo')
      expect(Histo.supplementState).toHaveBeenCalledOnce()
      expect(Histo.supplementState).toHaveBeenCalledWith({
        id: 'my_widget',
        widgetState: state,
        path: '/ololo'
      })
    })
  })

  describe('#replaceInitialState', () => {
    it('behaves the same as #replaceState', () => {
      jest.spyOn(widget, 'replaceState')
      const args = [{value: 1}, '/ololo'] as const
      widget.replaceInitialState(...args)
      expect(widget.replaceState).toHaveBeenCalledWith(...args)
    })
  })

  describe('#pushState', () => {
    beforeEach(() => {
      jest.spyOn(Histo, 'pushNewState')
    })

    it('calls Histo.pushNewState with path, state data and id provided', () => {
      const path = '/my_new_path'
      const state = {value: 1}
      widget.pushState(path, state)

      expect(Histo.pushNewState).toHaveBeenCalledOnce()
      expect(Histo.pushNewState).toHaveBeenCalledWith(path, { id: 'my_widget', widgetState: state })
    })
  })
})
