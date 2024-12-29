import { IdGenerator } from "@brainfuljs/brainful"
import { nanoid } from "nanoid/non-secure"
import {injectable} from "inversify";

@injectable()
export class ComponentId implements IdGenerator {
  generate(): string {
    return `b-${nanoid(8)}`
  }
}
