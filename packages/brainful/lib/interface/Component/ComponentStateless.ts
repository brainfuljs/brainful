import { ComponentStateful } from "./ComponentStateful"

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
