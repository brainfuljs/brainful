import { BehaviorSubject, Observable } from "rxjs"
import { ChildrenIterator } from "./ChildrenIterator"

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
