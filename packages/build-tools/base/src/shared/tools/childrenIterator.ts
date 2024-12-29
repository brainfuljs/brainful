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
