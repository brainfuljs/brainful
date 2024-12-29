import {
  container as containerBrainful,
  type IdGenerator,
  TYPES as TYPES_BRAINFUL,
} from "@brainfuljs/brainful"
import { Container } from "inversify"
import { ErrorService } from "../../domain/Error"
import { ErrorHandler } from "../../interfaces"
import { ComponentId } from "../configuration"
import { TYPES } from "./types"

containerBrainful
  .rebind<IdGenerator>(TYPES_BRAINFUL.ComponentId)
  .to(ComponentId)

const container = new Container({
  autoBindInjectable: true,
  skipBaseClassChecks: true,
})

container.parent = containerBrainful

container
  .bind<ErrorHandler>(TYPES.ErrorService)
  .to(ErrorService)
  .inSingletonScope()

export { container }
