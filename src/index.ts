import Widget from './histo_src/widget'
import addToAsyncQueue from 'async_fn'

import { type WidgetState } from './histo_src/widget'

type LocationWithState = Location & { state: State }
type State = Record<string, WidgetState>

export default class Histo {
  static widgets?: Record<string, Widget>
  static isInitialized = false
  static _fakeStatePopped = false
  static _initialUrl?: string
  static currentState: State
  static isPopping?: boolean
  static currentChangedId: boolean
  static abortCurrentWidget?: () => void
  static currentPopPromise?: Promise<void>

  static history = window.history

  static addWidget(options: { id: string }) {
    if (!this.isInitialized) this.initialize()
    const widget = new Widget(options)

    this.widgets ??= {}
    this.widgets[widget.id] = widget

    return widget
  }

  static initialize() {
    this.isInitialized = true

    this._fakeStatePopped = false
    this._initialUrl = location.href

    window.onpopstate = (e: PopStateEvent) => this._popState(e?.state)
    window.onhashchange = () => this.replaceStateWithCurrent()
    this.saveInitialStateAsCurrent()
  }

  static unload() {
    this.isInitialized = false
    this._fakeStatePopped = false
    window.onpopstate = null
    window.onhashchange = null
  }

  static saveInitialStateAsCurrent() {
    const state = (window.location as LocationWithState).state
    this.saveCurrentState(state || {})
  }

  static saveCurrentState(state: State) {
    this.currentState = JSON.parse(JSON.stringify(state)) as State
  }

  static supplementState(options: { id: string, widgetState: WidgetState, path?: string}) {
    if (this.isPopping) return
    const {id, widgetState} = options

    const state = this.history.state || {}
    let curStateId = state[id]?.state_id

    widgetState.state_id = curStateId ?? 0

    state[id] = widgetState
    const path = options.path || location.href
    this.history.replaceState(state, null, path)
    this.saveCurrentState(state)
  }

  static replaceStateWithCurrent() {
    if (!this.history.state) {
      this.history.replaceState(this.currentState, null, location.href)
    }
  }

  static pushNewState(path: string, options: { id: string, widgetState: WidgetState }) {
    this._fakeStatePopped = true

    const {id, widgetState} = options
    // increment widget state id
    widgetState.state_id = this.currentState[id].state_id + 1

    const state = this.currentState
    state[id] = widgetState

    // remove jquery's resetting cache query string attribute
    path = this._removeURIParameter(path, '_')

    this.history.pushState(state, null, path)
    this.saveCurrentState(state)
  }

// private

  static _getChangedWidgetId(newState: State) {
    let changedId = null

    for (let id of Object.keys(newState || {})) {
      const widgetState = newState[id]
      const state = this.currentState

      for (let widgetId of Object.keys(state || {})) {
        const curWidgetState = state[widgetId]
        if (id === widgetId && Math.abs(widgetState.state_id - curWidgetState.state_id) === 1) {
          return id
        }
      }
    }

    return changedId
  }

  static _removeURIParameter(url: string, param: string) {
    url = url.toString()
    const urlparts = url.split('?')
    if (urlparts.length < 2) { return url }

    const prefix = encodeURIComponent(param) + '='
    const pars = urlparts[1].split(/[&]/g)

    const newPars = pars.filter(par => par.lastIndexOf(prefix, 0) === -1)

    if (newPars.length) {
      url = urlparts[0] + '?' + newPars.join('&')
    } else {
      url = urlparts[0]
    }

    return url
  }

  static _popState(state: State) {
    // workaround for fake popped states
    if ((location.href === this._initialUrl) && !this._fakeStatePopped) {
      this._fakeStatePopped = true
      return
    }
    this._fakeStatePopped = true

    const id = this._getChangedWidgetId(state)
    if (id === null) return

    // if we're skipping the states for the same widget,
    // let the widget interrupt the current state processing
    if (this.currentChangedId != null && this.currentChangedId === id) {
      this.abortCurrentWidget?.()
    }
    this.currentChangedId = id

    const widgetState = state[id]
    const path = location.href
    this.saveCurrentState(state)

    this.currentPopPromise = addToAsyncQueue(() => {
      this.isPopping = true
      let abortHandler: () => void
      const handleAbort = (fn: () => void) => abortHandler = fn

      return new Promise<void>((resolve, reject) => {
        this.abortCurrentWidget = reject

        this.widgets[id].callCallback(widgetState, path, resolve, handleAbort)
      }).then(() => {
        this.isPopping = false
      }, () => {
        abortHandler?.()
      })
    })
  }
}
