import { injectable } from "inversify"
import * as R from "ramda"
import type { DomFinder } from "../../interface"

@injectable()
export class ElementFinder implements DomFinder {
  public attr = "data-b-key"

  public find(element?: Element | null, id?: string | null): Element | null {
    return R.ifElse(
      () => R.all(Boolean)([element, id]),
      () => element!.querySelector(`[${this.attr}=${id}]`),
      () => null,
    )()
  }
}
