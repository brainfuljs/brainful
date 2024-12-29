---
sidebar_position: 2
---

# Overview

This is a brief overview of how to work with Brainful.  
In the examples, many details are omitted to focus on the essentials.  
The complete code can be found in the Tutorial section.

## Component

Brainful provides two classes for working with components: `ComponentPure` and `ComponentBase`.  
`ComponentPure` is a stateless component, while `ComponentBase` is a stateful component.  
Here’s how to define components.

```ts title="src/shared/components/Button"
import { ComponentPure } from "@brainfuljs/brainful"

interface Props {}

@injectable()
export class Button extends ComponentPure<Props> {
  constructor() {
    super()
  }
}
```

```ts title="src/features/Counter"
import { ComponentBase } from "@brainfuljs/brainful"

interface Props {}
interface State {}

@injectable()
export class Counter extends ComponentBase<Props, State> {
  constructor() {
    super()
  }
}
```

## Props

The `Props` for the `ComponentPure` and `ComponentBase` components can be of any type.  
The `Props` types are passed to `ComponentPure` and `ComponentBase`, and will be accessible in the component as `this.props`.

```ts title="src/shared/components/Button"
interface Props {
  content: string
  classes?: string
}

@injectable()
export class Button extends ComponentPure<Props> {
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

:::info

Modifying `this.props` in a component will not trigger a re-render of that component.

:::

`ComponentPure` and `ComponentBase` provide the `Component.setProps()` function for setting `Props`.  
`Component.setProps()` accepts a function that returns an object containing the `Props`.

```ts title="src/features/Counter"
@injectable()
export class Counter extends ComponentBase<Props, State> {
  constructor() {
    super()

    this.stateSubject = new BehaviorSubject<State>(
      fromJS({
        children: {
          buttonDec: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-count btn-dec",
              content: "decrement",
            })),
          },
        },
      }),
    )
  }
}
```

:::info

Setting new `Props` with `Component.setProps()` will not trigger a re-render of the component.

:::

## State

The state in `ComponentBase` components is defined as a `BehaviorSubject` from RxJS.  
To efficiently manage state, we use Immutable.

```ts title="src/features/Counter"
import { fromJS, FromJS } from "immutable"
import { BehaviorSubject, Observable } from "rxjs"

interface State {
  counter: number
}

type StateImm = FromJS<State>

@injectable()
export class Counter extends ComponentBase<Props, StateImm> {
  public stateSubject: BehaviorSubject<StateImm>
  public state: Observable<StateImm>

  constructor() {
    super()

    this.stateSubject = new BehaviorSubject<StateImm>(
      fromJS({
        count: 0,
      }),
    )
    this.state = this.stateSubject.asObservable()
  }
}
```

To change the state, we call `this.stateSubject.next()` with the new value.  
Changing the state will trigger the `render()` method of the component, and the `render()` and `mount()`
methods of all its child components will also be called.

```ts title="src/features/Counter"
@injectable()
export class Counter extends ComponentBase<Props, State> {
  handleToggleCounter() {
    this.stateSubject.next(
      this.stateSubject.getValue().updateIn(["count"], (value) => value + 1),
    )
  }
}
```

:::info

Setting a new state is a signal for Brainful to start rendering the component tree.  
The rendering of the tree will occur relative to the component that changed its state.

:::

## Render

In components, we define the `render()` method, which processes the template and returns a string.  
We use Mustache for template processing.

```ts title="src/shared/components/Button"
import M from "mustache"

@injectable()
export class Button extends ComponentPure<Props> {
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

```ts title="src/features/Counter"
import M from "mustache"

@injectable()
export class Counter extends ComponentBase<Props, State> {
  render(): string {
    const template = `
      <div>
        <p>{{state.count}}</p>
      </div>
    `

    return M.render(template, {
      state: this.stateSubject.getValue().toJS(),
    })
  }
}
```

:::danger

The `render()` method should only define the template and handle variables.  
Do not modify the state in the `render()` method.  
There should be no side effects in the `render()` method.

:::

## Children

To work with child components, we define them in the state of `ComponentBase`.  
To allow Brainful to traverse our collection of `Children` components, we provide an iterator with `Component.children()`.

```ts title="src/features/Counter"
import { childrenIterator } from "../../shared/tools/childrenIterator"

interface State {
  children: Record<
    string,
    {
      component: Children
    }
  >
  counter: number
}
1

type StateImm = FromJS<State>

@injectable()
export class Counter extends ComponentBase<Props, StateImm> {
  constructor() {
    super()

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
  }

  children(): ChildrenIterator {
    return childrenIterator(this.stateSubject)
  }
}
```

```ts title="src/shared/tools/childrenIterator"
import type { Children, ChildrenIterator } from "@brainfuljs/brainful"
import { List, Map } from "immutable"
import { BehaviorSubject } from "rxjs"

export function childrenIterator(
  stateSubject: BehaviorSubject<any>,
): ChildrenIterator {
  return {
    forEach: (cb: (c: Children) => void) => {
      const traversal = (c: any) => {
        if (Map.isMap(c)) {
          cb(c.get("component") as Children)
        }

        if (List.isList(c)) {
          c.forEach((c) => traversal(c))
        }
      }

      stateSubject
        .getValue()
        .get("children")
        .forEach((c: any) => traversal(c))
    },
  }
}
```

:::danger

It is necessary to provide access to child components through an iterator,
otherwise, Brainful will not set the current component as their parent and will be unable to mount and unmount child components.

:::

To dynamically create components, we define a factory `Component.childrenMap` to obtain new instances of components.  
Now we can create and add new components to the state by calling `Component.childrenMap.counter()`.

```ts title="src/features/ListCounter"
interface State {
  children: {
    list: {
      component: Counter
    }[]
  }
}

type StateImm = FromJS<State>

@injectable()
export class ListCounter extends ComponentBase<Props, StateImm> {
  public childrenMap: { counter: () => { component: ComponentStateful } }

  constructor() {
    super()

    this.childrenMap = {
      counter: () => ({
        component: container.get<Counter>(Counter),
      }),
    }

    this.stateSubject = new BehaviorSubject<StateImm>(
      fromJS({
        children: {
          list: [
            {
              component: container.get<Counter>(Counter),
            },
          ],
        },
      }),
    )
    this.state = this.stateSubject.asObservable()
  }

  handleUpdateList() {
    this.stateSubject.next(
      this.stateSubject
        .getValue()
        .updateIn(["children", "list"], (list: any) =>
          list.push(fromJS(this.childrenMap.counter())),
        ),
    )
  }
}
```

Brainful generates `Component.id` and `Component.host`, which are stable DOM elements between renders.  
Brainful searches for its `Component.id` within `Component.parent.host` using the `data-b-key` attributes to render the component.  
Therefore, to output child components in the template, you need to set the `data-b-key` attribute equal to `Component.id` on
the necessary element for rendering the child component.

```ts title="src/features/Counter"
@injectable()
export class Counter extends ComponentBase<Props, State> {
  render(): string {
    const template = `
      <div>
        <p>{{state.count}}</p>
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

## Events

For event handling, we use delegation and define listeners on the `Components.host` DOM element.  
Listener definitions are available at the time of component creation in its `constructor()`.  
We filter `event.target` to find the desired element.  
To manage unsubscribing, we create a `Subject` from RxJS.

```ts title="src/features/Counter"
import { catchError, fromEvent, of, Subject, takeUntil, tap } from "rxjs"
import { delegate } from "../../shared/tools/delegate"
import * as R from "ramda"

@injectable()
export class Counter extends ComponentBase<Props, State> {
  public unsubscribe: Subject<void>

  constructor() {
    super()

    this.unsubscribe = new Subject<void>()
    this.handleToggleCounter()
  }

  onDestroy() {
    this.unsubscribe.next()
    this.unsubscribe.complete()
  }

  handleToggleCounter() {
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
                  .updateIn(["count"], (value) => cb(value as number)),
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
}
```

```ts title="src/shared/tools/delegate"
import { filter } from "rxjs"

export function delegate(selector: string) {
  return filter((event: Event) => {
    const target = event.target as HTMLElement
    return target.classList.contains(selector)
  })
}
```

:::info

Only `Components.host` is stable between re-renders, or you can use listeners on the document.

:::

## Destroy

We do not need to manually destroy components, even though `Component.destroy()` is available.  
We simply need to monitor the state of parent components and define `Component.id` in the parent's template.  
If a child component is no longer needed, do not render its `Component.id` in the template with `data-b-key`, and remove it from the state of the parent `ComponentBase`.

Each child component receives `Component.parent` upon creation and knows about its parent.  
Any change in the parent's state signals its child components to check their `Component.id` in `Component.parent.host`.  
If no element with the corresponding `data-b-key` is found, this signals the component to be destroyed, and Brainful will call `Component.destroy()`.

You may not want to destroy the component and its state but only temporarily unmount it.  
In that case, set `Component.setSlick(() => true)` for it.

```ts title="src/features/StepperWithSaveState"
@injectable()
export class StepperWithSaveState extends ComponentBase<Props, State> {
  constructor() {
    super()

    this.stateSubject = new BehaviorSubject<State>(
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
        stepFirst: true,
        stepSecond: false,
      }),
    )
  }
}
```

## Lifecycle

- `constructor()` - When creating a component, we can start acting here, for example, by initiating event listeners.
- `onMount()` - This method should be used sparingly, as it is often called when the parent's state changes.
- `onUpdate()` - This method is invoked when the component changes its state.
- `onDestroy()` - This method is called when Brainful destroys the component.
- `render()` - We should not perform any actions here other than defining and processing the template.

:::info

When a component changes its state, `render()` and `mount()` of all child components in the subtree will be triggered.  
Brainful will call `onDestroy()` when you remove the `data-b-key` bindings from the parent's template and change its state.

:::

## Root

To initiate the rendering of the component tree, it must be done by the root component.
The `RootCreator` class creates a pseudo `ComponentBase`, which triggers the rendering of our root component.
We need to provide the root DOM element and a function to obtain the root component to the `rootCreator.render()` method.

```ts title="src/index.ts"
import "reflect-metadata"
import { TYPES as TYPES_BRAINFUL, type RootRender } from "@brainfuljs/brainful"
import { container } from "src/app/compositionRoot/container.ts"
import { List } from "src/features/List"

const rootCreator = container.get<RootRender>(TYPES_BRAINFUL.RootCreator)
const rootElement = document.getElementById("root-list")

if (rootElement) {
  rootCreator.render(rootElement, () => container.get<List>(List))
} else {
  throw Error("Not found root element")
}
```

## Container

We use the Inversify container for dependency management.  
We mark components with the `@injectable` decorator for automatic injection of these classes.

```ts title="src/interfaces"
export interface ErrorHandler {
  handle(error: Error): void
}
```

```ts title="src/domain/ErrorHandler"
import { injectable } from "inversify"
import { ErrorHandler } from "../../interfaces"

@injectable()
export class ErrorService implements ErrorHandler {
  handle(error: Error): void {
    console.log(error)
  }
}
```

```ts title="src/app/compositionRoot/types.ts"
export const TYPES = {
  ErrorService: Symbol.for("service.ErrorService"),
} as const
```

```ts title="src/app/compositionRoot/container.ts"
import { container as containerBrainful } from "@brainfuljs/brainful"
import { Container } from "inversify"
import { ErrorService } from "../../domain/Error"
import { ErrorHandler } from "../../interfaces"
import { TYPES } from "./types.ts"

const container = new Container({
  autoBindInjectable: true,
  skipBaseClassChecks: true,
})

container.parent = containerBrainful

container
  .bind<ErrorHandler>(TYPES.ErrorService)
  .to(ErrorService)
  .inSingletonScope()

export { container }
```

```ts title="src/features/Counter"
import { TYPES } from "../../app/compositionRoot/types"
import type { ErrorHandler } from "../../interfaces"

@injectable()
export class Counter extends ComponentBase<Props, State> {
  constructor(@inject(TYPES.ErrorService) public errorHandler: ErrorHandler) {
    super()
  }
}
```

## Configuration

Using the container, we can override some Brainful classes.

```ts title="src/app/configuration/ComponentId"
import { IdGenerator } from "@brainfuljs/brainful"
import { nanoid } from "nanoid/non-secure"

@injectable()
export class ComponentId implements IdGenerator {
  generate(): string {
    return `b-${nanoid(8)}`
  }
}
```

```ts title="src/app/compositionRoot/container.ts"
import {
  container as containerBrainful,
  type IdGenerator,
  TYPES as TYPES_BRAINFUL,
} from "@brainfuljs/brainful"
import { Container } from "inversify"
import { ComponentId } from "../configuration"

containerBrainful
  .rebind<IdGenerator>(TYPES_BRAINFUL.ComponentId)
  .to(ComponentId)

const container = new Container({
  autoBindInjectable: true,
  skipBaseClassChecks: true,
})

container.parent = containerBrainful

export { container }
```

## Conclusion

- We handle reactivity in components using RxJS.
- We effectively manage state with Immutable.
- We control event handling.
- We process templates with Mustache.
- We delegate dependency management to the container.
- We can override implementations of certain Brainful classes.
- Brainful is responsible for mounting and unmounting components.
