---
sidebar_position: 3
---

# List

Build a List example.

The example demonstrates how to display a list of counters and respond to user events.

## Button component

We will define the `Button` component by inheriting from the `ComponentPure` class.  
We will specify which `Props` the component can accept, such as a list of classes and content.  
In the `render()` method, we will process the template with the `Props` and return a string.

```ts title="src/shared/components/Button"
import { ComponentPure } from "@brainfuljs/brainful"
import { injectable } from "inversify"
import M from "mustache"

interface Props {
  content: string
  classes?: string
}

@injectable()
export class Button extends ComponentPure<Props> {
  constructor() {
    super()
  }

  render() {
    const template = `
      <button class="btn {{classes}}">
        {{content}}
      </button>
    `

    return M.render(template, {
      content: this.props.content || "",
      classes: this.props.classes || "",
    })
  }
}
```

## Counter component

We will define the `Counter` component by inheriting from the `ComponentBase` class.  
We will define types for the component's state.  
The `Button` component will be defined as a child component and included in the state.  
We will define an event handler for toggling the counter.  
In the `render()` template, we will specify elements to display the child `Button` components and the counter itself.

```ts title="features/Counter"
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
```

## List component

We will define the `List` component by inheriting from the `ComponentBase` class.  
We will specify types for the component's state.  
The `Button` and `Counter` components will be defined as child components and included in the state.  
We will define an event handler for adding or removing counters.  
In the `render()` template, we will specify elements to display the child `Button` and `Counter` components.

```ts title="features/ListCounter"
import type { ChildrenIterator } from "@brainfuljs/brainful"
import {
  Children,
  ComponentBase,
  ComponentStateful,
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
import { Counter } from "../Counter"

interface State {
  children: {
    buttonAdd: {
      component: Children
    }
    buttonRemove: {
      component: Children
    }
    list: {
      component: Children
    }[]
  }
}

type StateImm = FromJS<State>

@injectable()
export class ListCounter extends ComponentBase {
  public unsubscribe: Subject<void>
  public stateSubject: BehaviorSubject<StateImm>
  public state: Observable<StateImm>
  public childrenMap: { counter: () => { component: ComponentStateful } }

  constructor(@inject(TYPES.ErrorService) public errorHandler: ErrorHandler) {
    super()
    this.unsubscribe = new Subject<void>()

    this.childrenMap = {
      counter: () => ({
        component: container.get<Counter>(Counter),
      }),
    }

    this.stateSubject = new BehaviorSubject<StateImm>(
      fromJS({
        children: {
          buttonAdd: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-counter btn-counter-add",
              content: "add",
            })),
          },
          buttonRemove: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-counter btn-counter-remove",
              content: "remove",
            })),
          },
          list: [
            {
              component: container.get<Counter>(Counter),
            },
          ],
        },
      }),
    )
    this.state = this.stateSubject.asObservable()

    this._handleList()
  }

  children(): ChildrenIterator {
    return childrenIterator(this.stateSubject)
  }

  onDestroy() {
    this.unsubscribe.next()
    this.unsubscribe.complete()
  }

  private _handleList() {
    fromEvent(this.host, "click")
      .pipe(
        takeUntil(this.unsubscribe),
        delegate("btn-counter"),
        tap((evt) => {
          R.ifElse(
            (evt: any) => evt.target.classList.contains("btn-counter-add"),
            () =>
              this._handleUpdateList((list: any) =>
                list.push(fromJS(this.childrenMap.counter())),
              ),
            () =>
              this._handleUpdateList((list: any) =>
                list.pop(fromJS(this.childrenMap.counter())),
              ),
          )(evt as unknown as HTMLElement)
        }),
        catchError((error) => {
          this.errorHandler.handle(error)
          return of(error)
        }),
      )
      .subscribe()
  }

  private _handleUpdateList(cb: any) {
    this.stateSubject.next(
      this.stateSubject
        .getValue()
        .updateIn(["children", "list"], (list: any) => cb(list)),
    )
  }

  render() {
    const template = `
      <div>
        <h2>List Counter</h2>
        {{#state.children.list}}
          <div data-b-key="{{component.id}}"></div>
        {{/state.children.list}}

        <div>
          <div data-b-key="{{state.children.buttonAdd.component.id}}"></div>
          <div data-b-key="{{state.children.buttonRemove.component.id}}"></div>
        </div>
      </div>
    `

    return M.render(template, {
      state: this.stateSubject.getValue().toJS(),
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
