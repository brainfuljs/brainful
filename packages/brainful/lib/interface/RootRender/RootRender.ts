import { ComponentStateful } from "../Component"

export interface RootRender {
  render(rootElement: Element, rootComponent: () => ComponentStateful): void
}
