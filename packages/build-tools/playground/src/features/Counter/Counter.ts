import {
  type Children,
  type ChildrenIterator,
  ComponentBase,
} from "@brainfuljs/brainful"
import { fromJS, FromJS } from "immutable"
import { inject, injectable } from "inversify"
import M from "mustache"
import * as R from "ramda"
import {
  BehaviorSubject,
  catchError,
  fromEvent,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
} from "rxjs"
import { container } from "../../app/compositionRoot/container"
import { TYPES } from "../../app/compositionRoot/types"
import type { ErrorHandler } from "../../interfaces"
import { Button } from "../../shared/components/Button"
import { childrenIterator } from "../../shared/tools/childrenIterator"
import { delegate } from "../../shared/tools/delegate"

interface State {
  children: Record<
    string,
    {
      component: Children
    }
  >
  counter: number
}

type StateImm = FromJS<State>

@injectable()
export class Counter extends ComponentBase<any, StateImm> {
  public unsubscribe: Subject<void>
  public stateSubject: BehaviorSubject<StateImm>
  public state: Observable<StateImm>

  constructor(@inject(TYPES.ErrorService) public errorHandler: ErrorHandler) {
    super()

    this.unsubscribe = new Subject<void>()
    this.stateSubject = new BehaviorSubject<StateImm>(
      fromJS({
        children: {
          buttonDec: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-count btn-dec",
              content: "decrement",
            })),
          },
          buttonInc: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-count btn-inc",
              content: "increment",
            })),
          },
        },
        counter: 0,
      }),
    )
    this.state = this.stateSubject.asObservable()

    this._handleToggleCounter()
  }

  children(): ChildrenIterator {
    return childrenIterator(this.stateSubject)
  }

  onDestroy() {
    this.unsubscribe.next()
    this.unsubscribe.complete()
  }

  private _handleToggleCounter() {
    fromEvent(this.host, "click")
      .pipe(
        takeUntil(this.unsubscribe),
        delegate("btn-count"),
        tap((event) => {
          R.pipe(
            R.ifElse(
              () => (event.target as HTMLElement).classList.contains("btn-dec"),
              () => R.dec,
              () => R.inc,
            ),
            (cb) =>
              this.stateSubject.next(
                this.stateSubject
                  .getValue()
                  .updateIn(["counter"], (value) => cb(value as number)),
              ),
          )()
        }),
        catchError((error) => {
          this.errorHandler.handle(error)
          return of(error)
        }),
      )
      .subscribe()
  }

  render(): string {
    const template = `
      <div>
        <p>{{state.counter}}</p>
        <div data-b-key="{{state.children.buttonDec.component.id}}"></div>
        <div data-b-key="{{state.children.buttonInc.component.id}}"></div>
      </div>
    `

    return M.render(template, {
      state: this.stateSubject.getValue().toJS(),
    })
  }
}
