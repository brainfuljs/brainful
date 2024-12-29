import { container as containerFramework } from "@brainfuljs/brainful"
import { Container } from "inversify"

const container = new Container({
  autoBindInjectable: true,
  skipBaseClassChecks: true,
})

container.parent = containerFramework

export { container }
