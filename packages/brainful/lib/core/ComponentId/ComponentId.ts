import { injectable } from "inversify"
import { nanoid } from "nanoid/non-secure"
import { IdGenerator } from "../../interface"

@injectable()
export class ComponentId implements IdGenerator {
  public generate(): string {
    return `b-${nanoid(10)}`
  }
}
