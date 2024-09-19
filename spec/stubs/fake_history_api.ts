type State = {}

export default class FakeHistoryApi {
  private curPos = 0
  private maxPos = 0
  private states: State[] = []
  state?: State

  replaceState(state: State, _title: string, _url: string) {
    this.states[this.curPos] = state
    this.state = this.curState()
  }

  pushState(state: State, _title: string, _url: string) {
    this.curPos++
    this.maxPos = this.curPos

    this.states[this.curPos] = state
    this.state = this.curState()
  }

  curState() {
    return this.states[this.curPos]
  }

  back() {
    if (this.curPos === 0) return

    this.curPos--
    this.state = this.curState()
    window.onpopstate({ state: this.curState() } as PopStateEvent)
  }

  forward() {
    if (this.curPos === this.maxPos) return

    this.curPos++
    this.state = this.curState()
    window.onpopstate({ state: this.curState() } as PopStateEvent)
  }
}
