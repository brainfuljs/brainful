---
sidebar_position: 2
---

# Root

Render root component.

## Element

Defining the root elements for rendering the root component.

### Root Element

Define the root element for rendering the root component.  
In this demonstration, we will create two root elements for the convenience of showcasing the `List` and `Stepper` components.  
In a real scenario, there will typically be only one root element.

```html title="index.html"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Brainful</title>
  </head>
  <body>
    <div id="root-list-counter"></div>
    <div id="root-stepper-with-save-state"></div>
    <script type="module" src="src/index.ts"></script>
  </body>
</html>
```

## Component

Brainful provides the `RootCreator` class for rendering root components in the DOM.  
The root component serves as the parent for other components.

### Root Component

At the entry point of the application, visualize the root component using the `RootCreator` class.  
In this demonstration, we will create two root components for the convenience of showcasing the `List` and `Stepper` components.  
In a real scenario, there will typically be only one root component.

```ts title="src/index.ts"
import "reflect-metadata"
import { TYPES as TYPES_BRAINFUL, type RootRender } from "@brainfuljs/brainful"
import { container } from "./app/compositionRoot/container"
import { ListCounter } from "./features/ListCounter"
import { StepperWithSaveState } from "./features/StepperWithSaveState"

const rootCreatorListCounter = container.get<RootRender>(
  TYPES_BRAINFUL.RootCreator,
)
const rootListCounter = document.getElementById("root-list-counter")

if (rootListCounter) {
  rootCreatorListCounter.render(rootListCounter, () =>
    container.get<ListCounter>(ListCounter),
  )
} else {
  throw Error("Not found root element")
}

const rootCreatorStepperWithSaveState = container.get<RootRender>(
  TYPES_BRAINFUL.RootCreator,
)
const rootStepperWithSaveState = document.getElementById(
  "root-stepper-with-save-state",
)

if (rootStepperWithSaveState) {
  rootCreatorStepperWithSaveState.render(rootStepperWithSaveState, () =>
    container.get<StepperWithSaveState>(StepperWithSaveState),
  )
} else {
  throw Error("Not found root element")
}
```

## Conclusion

- We pass the root component and the root element to `RootCreator.render()`.
- Brainful handles the rendering of the root of our component tree.
