import type { ChildrenIterator } from "@brainfuljs/brainful"
import {
  Children,
  ComponentBase,
  ComponentStateful,
} from "@brainfuljs/brainful"
import { fromJS, FromJS } from "immutable"
import { inject, injectable } from "inversify"
import M from "mustache"
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
import { Counter } from "../Counter"

interface State {
  children: {
    buttonPrev: {
      component: Children
    }
    buttonNext: {
      component: Children
    }
    step: {
      component: Children
    }
  }
}

type StateImm = FromJS<State>

@injectable()
export class StepperWithoutSaveState extends ComponentBase {
  public unsubscribe: Subject<void>
  public stateSubject: BehaviorSubject<StateImm>
  public state: Observable<StateImm>
  public childrenMap: { step: () => { component: ComponentStateful } }

  constructor(@inject(TYPES.ErrorService) public errorHandler: ErrorHandler) {
    super()
    this.unsubscribe = new Subject<void>()

    this.childrenMap = {
      step: () => ({
        component: container.get<Counter>(Counter),
      }),
    }

    this.stateSubject = new BehaviorSubject<StateImm>(
      fromJS({
        children: {
          buttonPrev: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-step btn-step-prev",
              content: "prev",
            })),
          },
          buttonNext: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-step btn-step-next",
              content: "next",
            })),
          },
          step: {
            component: container.get<Counter>(Counter),
          },
        },
      } satisfies State),
    )
    this.state = this.stateSubject.asObservable()

    this._handleStep()
  }

  children(): ChildrenIterator {
    return childrenIterator(this.stateSubject)
  }

  onDestroy() {
    this.unsubscribe.next()
    this.unsubscribe.complete()
  }

  private _handleStep() {
    fromEvent(this.host, "click")
      .pipe(
        takeUntil(this.unsubscribe),
        delegate("btn-step"),
        tap(() => {
          this._handleSetState()
        }),
        catchError((error) => {
          this.errorHandler.handle(error)
          return of(error)
        }),
      )
      .subscribe()
  }

  private _handleSetState() {
    this.stateSubject.next(
      this.stateSubject.getValue().mergeIn(
        ["children", "step"],
        fromJS({
          component: this.childrenMap.step().component,
        }),
      ),
    )
  }

  render() {
    const template = `
      <div>
        <h2>Stepper Without Save State</h2>
        <div data-b-key="{{state.children.step.component.id}}"></div>

        <div>
          <div data-b-key="{{state.children.buttonPrev.component.id}}"></div>
          <div data-b-key="{{state.children.buttonNext.component.id}}"></div>
        </div>
      </div>
    `

    return M.render(template, {
      state: this.stateSubject.getValue().toJS(),
    })
  }
}
