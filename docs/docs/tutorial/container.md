---
sidebar_position: 1
---

# Container

Inversion of Control.

## Base Modules

Definition of core interfaces for the project.

### Configuration

Brainful generates unique identifiers for components, and we can override the implementation.  
A description of what can be configured can be found in the API section.

```ts title="src/app/configuration/ComponentId"
import { IdGenerator } from "@brainfuljs/brainful"
import { nanoid } from "nanoid/non-secure"

export class ComponentId implements IdGenerator {
  generate(): string {
    return `b-${nanoid(8)}`
  }
}
```

### Error handling

Let's define the error handler interface for the project.  
The `ErrorHandler` will complement the demonstration of working with the container.

```ts title="src/interfaces"
export interface ErrorHandler {
  handle(error: Error): void
}
```

### Implementation

As an implementation, we will simply log the errors.

```ts title="src/domain/Error"
import { injectable } from "inversify"
import type { ErrorHandler } from "../../interfaces"

@injectable()
export class ErrorService implements ErrorHandler {
  handle(error: Error): void {
    console.log(error)
  }
}
```

## IoC

Set up dependency management in the project.

### Identifiers

Define identifiers.

```ts title="src/app/compositionRoot/types.ts"
export const TYPES = {
  ErrorService: Symbol.for("service.ErrorService"),
} as const
```

### Container

We initialize the container and define its settings.
We will also specify that we want to override the implementation of the identifier generator for components and bind the error handler implementation.  
Specify the Brainful container as the parent.

```ts title="src/app/compositionRoot/container.ts"
import {
  container as containerBrainful,
  type IdGenerator,
  TYPES as TYPES_BRAINFUL,
} from "@brainfuljs/brainful"
import { Container } from "inversify"
import { ErrorService } from "../../domain/Error"
import { ErrorHandler } from "../../interfaces"
import { ComponentId } from "../configuration"
import { TYPES } from "./types.ts"

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
```

:::info

The configuration of the container depends on the needs of the project.  
Using the Brainful container as a parent is necessary to provide certain classes.

:::

## Conclusion

- We define the project's interfaces and register identifiers for them.
- We implement our interfaces and mark classes for automatic injection.
- We can override certain Brainful classes.
- Inversify manages the injection of our dependencies.
