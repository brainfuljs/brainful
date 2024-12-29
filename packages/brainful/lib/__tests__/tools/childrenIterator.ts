import { List, Map } from "immutable"
import { Children, ChildrenIterator } from "../../interface"

export function childrenIterator(stateSubject: any): ChildrenIterator {
  return {
    forEach: (cb: (c: Children) => void) => {
      const traversal = (c: any) => {
        if (Map.isMap(c)) {
          cb(c.get("component") as any)
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
