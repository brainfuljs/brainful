import type { Children } from "./Children"

export interface ChildrenIterator {
  forEach: (cb: (c: Children) => void) => void
}
