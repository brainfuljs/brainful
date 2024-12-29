---
sidebar_position: 4
---

# Stepper

Build a Stepper example.

The example demonstrates a component that allows toggling between the previous or next step.

## Stepper component

We will define the `Stepper` component by inheriting from the `ComponentBase` class.  
We will specify types for the component's state.  
The `Button` and `Counter` components from the previous example will be used as child components and included in the state.  
We will define an event handler for toggling steps.  
We will mark the step components with `Step.setSlick()` to maintain state between mountings.  
In the `render()` template, we will specify elements to display the child `Button` and `Counter` components.

```ts title="features/StepperWithSaveState"
import { Children, ChildrenIterator, ComponentBase } from "@brainfuljs/brainful"
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
import { Counter } from "../Counter"

interface State {
  children: Record<
    string,
    {
      component: Children
    }
  >
  active: string
}

type StateImm = FromJS<State>

@injectable()
export class StepperWithSaveState extends ComponentBase {
  public unsubscribe: Subject<void>
  public stateSubject: BehaviorSubject<StateImm>
  public state: Observable<StateImm>

  constructor(@inject(TYPES.ErrorService) public errorHandler: ErrorHandler) {
    super()
    this.unsubscribe = new Subject<void>()

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
          stepFirst: {
            component: container.get<Counter>(Counter).setSlick(() => true),
          },
          stepSecond: {
            component: container.get<Counter>(Counter).setSlick(() => true),
          },
        },
        active: "stepFirst",
      }),
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
        tap((event) => {
          R.ifElse(
            () =>
              (event.target as HTMLElement).classList.contains("btn-step-prev"),
            () => this._handleSetState("stepFirst"),
            () => this._handleSetState("stepSecond"),
          )()
        }),
        catchError((error) => {
          this.errorHandler.handle(error)
          return of(error)
        }),
      )
      .subscribe()
  }

  private _handleSetState(name: string) {
    this.stateSubject.next(
      this.stateSubject.getValue().merge(
        fromJS({
          active: name,
        }),
      ),
    )
  }

  render() {
    const template = `
      <div>
        <h2>Stepper With Save State</h2>
        <div data-b-key="{{active.id}}"></div>

        <div>
          <div data-b-key="{{prev.id}}"></div>
          <div data-b-key="{{next.id}}"></div>
        </div>
      </div>
    `

    const state = this.stateSubject.getValue().toJS() as unknown as State

    return M.render(template, {
      active: state.children[state.active].component,
      prev: state.children.buttonPrev.component,
      next: state.children.buttonNext.component,
    })
  }
}
```

## Conclusion

- To create components, inherit from `ComponentPure` or `ComponentBase`.
- Use RxJS for managing reactivity and events.
- Utilize Immutable for effective state management.
- Employ Ramda for writing low-level code in a functional style.
- Use Inversify for automatic dependency injection.
- For template processing, use Mustache.
