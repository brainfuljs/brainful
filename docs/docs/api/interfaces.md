---
sidebar_position: 1
---

# Interfaces

Library Interfaces.

## ComponentStateless

```ts title="ComponentStateless.ts"
export interface ComponentStateless<TProps = any> {
  id: string
  host: Element
  parent: ComponentStateful | undefined
  props: TProps
  slick: boolean
  setSlick(cb: () => boolean): this
  setProps(cb: () => TProps): this
  setParent(parent: ComponentStateful | undefined): this
  mount(): void
  destroy(): void
  onMounted(): void
  onDestroy(): void
  render(): string
}
```

## ComponentStateful

```ts title="ComponentStateful.ts"
export interface ComponentStateful<TProps = any, TState = any> {
  id: string
  host: Element
  parent: ComponentStateful | undefined
  props: TProps
  stateSubject: BehaviorSubject<TState>
  state: Observable<TState>
  slick: boolean
  children(): ChildrenIterator
  setSlick(cb: () => boolean): this
  setProps(cb: () => TProps): this
  setParent(parent: ComponentStateful | undefined): this
  mount(): void
  destroy(): void
  onMounted(): void
  onUpdated(): void
  onDestroy(): void
  render(): string
}
```

## Children

```ts title="Children.ts"
export type Children = ComponentStateless | ComponentStateful
```

## ChildrenIterator

```ts title="ChildrenIterator.ts"
export interface ChildrenIterator {
  forEach: (cb: (c: Children) => void) => void
}
```

## IdGenerator

```ts title="IdGenerator.ts"
export interface IdGenerator {
  generate(): string
}
```

## DomFinder

```ts title="DomFinder.ts"
export interface DomFinder {
  attr: string
  find(node?: Element | null, id?: string | null): Element | null
}
```

## RootRender

```ts title="RootRender.ts"
export interface RootRender {
  render(rootElement: Element, rootComponent: () => ComponentStateful): void
}
```
