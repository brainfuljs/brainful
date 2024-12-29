import { Container } from "inversify"
import { ComponentId, ElementFinder, RootCreator } from "../core"
import type { DomFinder, IdGenerator, RootRender } from "../interface"
import { TYPES } from "./types"

const container = new Container({
  autoBindInjectable: true,
  skipBaseClassChecks: true,
})

container.bind<IdGenerator>(TYPES.ComponentId).to(ComponentId)
container.bind<DomFinder>(TYPES.ElementFinder).to(ElementFinder)
container.bind<RootRender>(TYPES.RootCreator).to(RootCreator)

export { container }
