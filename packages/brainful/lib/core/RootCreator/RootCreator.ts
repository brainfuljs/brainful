import { inject, injectable } from "inversify"
import * as R from "ramda"
import { from } from "rxjs"
import { TYPES } from "../../compositionRoot/types"
import type { ComponentStateful, DomFinder, RootRender } from "../../interface"

@injectable()
export class RootCreator implements RootRender {
  constructor(@inject(TYPES.ElementFinder) public domFinder: DomFinder) {}

  render(root: Element, rootComponent: () => ComponentStateful): void {
    queueMicrotask(() => {
      R.pipe(
        (state) => {
          state.host.setAttribute(this.domFinder.attr, state.component.id)

          return state
        },
        (state) => {
          state.root.replaceChildren(state.host)

          return state
        },
        (state) => {
          state.component.setParent({
            host: root,
            state: from<any>([]),
          } as unknown as ComponentStateful)

          return state
        },
        (state) => {
          state.component.mount()

          return state
        },
      )({
        root: root,
        component: rootComponent(),
        host: document.createElement("div"),
      })
    })
  }
}
