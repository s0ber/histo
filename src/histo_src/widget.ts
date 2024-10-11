import Histo from '../index'

export type WidgetState = { state_id?: number } & { [key: string]: any }

type AbortHandler = () => void
export type PoppedStateCallback = (
  stateData: WidgetState,
  path: string,
  resolve: () => void,
  handleAbort: (fn: AbortHandler) => void
) => void

export default class Widget {
  id: string
  poppedStateCallback?: PoppedStateCallback

  constructor(options: { id: string }) {
    if (!options.id) return

    this.id = options.id
  }

  onPopState(callback: PoppedStateCallback) {
    this.poppedStateCallback = callback
  }

  callCallback(...args: Parameters<PoppedStateCallback>) {
    this.poppedStateCallback?.(...args)
  }

  replaceInitialState(state: WidgetState, path: string) {
    if (path == null) { path = location.href }
    this.replaceState(state, path)
  }

  replaceState(state: WidgetState, path: string) {
    if (path == null) { path = location.href }
    Histo.supplementState({ id: this.id, widgetState: state, path })
  }

  pushState(path: string, state: WidgetState) {
    Histo.pushNewState(path, { id: this.id, widgetState: state })
  }
}
