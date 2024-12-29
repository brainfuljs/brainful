---
sidebar_position: 3
---

# Container

Library Container.

## Types

```ts title="types.ts"
export const TYPES = {
  ComponentPure: Symbol.for("class.ComponentPure"),
  ComponentBase: Symbol.for("class.ComponentBase"),
  ComponentId: Symbol.for("class.ComponentId"),
  ElementFinder: Symbol.for("class.ElementFinder"),
  RootCreator: Symbol.for("class.RootCreator"),
} as const
```

## Container

```ts title="container.ts"
import { Container } from "inversify"
import { ComponentId, ElementFinder, RootCreator } from "../core"
import type { DomFinder, IdGenerator, RootRender } from "../interface"
import { TYPES } from "./types"

const container = new Container()

container.bind<IdGenerator>(TYPES.ComponentId).to(ComponentId)
container.bind<DomFinder>(TYPES.ElementFinder).to(ElementFinder)
container.bind<RootRender>(TYPES.RootCreator).to(RootCreator)

export { container }
```
