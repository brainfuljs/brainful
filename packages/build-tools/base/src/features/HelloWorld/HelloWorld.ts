import { ComponentBase } from "@brainfuljs/brainful"
import M from "mustache"
import { fromJS, FromJS } from "immutable"
import { injectable } from "inversify"
import { BehaviorSubject, Observable, Subject } from "rxjs"

interface State {
  content: string
}

type StateImm = FromJS<State>

const stateInit = {
  content: "Brainful",
}

@injectable()
export class HelloWorld extends ComponentBase<any, StateImm> {
  public unsubscribe: Subject<void>
  public stateSubject: BehaviorSubject<StateImm>
  public state: Observable<StateImm>

  constructor() {
    super()
    this.unsubscribe = new Subject<void>()
    this.stateSubject = new BehaviorSubject<StateImm>(fromJS(stateInit))
    this.state = this.stateSubject.asObservable()
  }

  render() {
    const template = `
      <div>
        <h1>{{state.content}}</h1>
      </div>
    `

    return M.render(template, {
      state: this.stateSubject.getValue().toJS(),
    })
  }
}
