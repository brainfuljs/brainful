---
sidebar_position: 2
---

# Classes

Library Classes.

## ComponentPure

```ts title="ComponentPure.ts"
export abstract class ComponentPure<TProps = any>
  implements ComponentStateless<TProps>
{
  protected constructor() {}

  abstract render(): string

  onMounted(): void {}
  onDestroy(): void {}

  get id(): string {}
  get host(): Element {}
  get parent(): ComponentStateful | undefined {}
  get props(): TProps {}
  get slick(): boolean {}

  setSlick(cb: () => boolean): this {}
  setParent(parent: ComponentStateful): this {}
  setProps(cb: () => TProps): this {}

  mount(): void {}
  destroy(): void {}
}
```

## ComponentBase

```ts title="ComponentBase.ts"
export abstract class ComponentBase<TProps = any, TState = any>
  implements ComponentStateful<TProps, TState>
{
  abstract stateSubject: BehaviorSubject<TState>
  abstract state: Observable<TState>

  protected constructor() {}

  abstract render(): string

  onMounted(): void {}
  onUpdated(): void {}
  onDestroy(): void {}

  get id(): string {}
  get host(): Element {}
  get parent(): ComponentStateful | undefined {}
  get props(): TProps {}
  get slick(): boolean {}

  setSlick(cb: () => boolean): this {}
  setParent(parent: ComponentStateful): this {}
  setProps(cb: () => TProps): this {}

  children(): ChildrenIterator {}

  mount(): void {}
  destroy(): void {}
}
```

## ComponentId

```ts title="ComponentId.ts"
@injectable()
export class ComponentId implements IdGenerator {
  constructor() {}

  generate(): string {}
}
```

## ElementFinder

```ts title="ElementFinder.ts"
@injectable()
export class ElementFinder implements DomFinder {
  attr = "data-b-key"

  constructor() {}

  find(element?: Element | null, id?: string | null): Element | null {}
}
```

## RootCreator

```ts title="RootCreator.ts"
@injectable()
export class RootCreator implements RootRender {
  constructor() {}

  render(rootElement: Element, rootComponent: () => ComponentStateful): void {}
}
```
