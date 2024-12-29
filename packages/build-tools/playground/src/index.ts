import "reflect-metadata"

import { type RootRender, TYPES as TYPES_BRAINFUL } from "@brainfuljs/brainful"
import { container } from "./app/compositionRoot/container"
import { List } from "./features/List"
import { ListCounter } from "./features/ListCounter"
import { StepperWithSaveState } from "./features/StepperWithSaveState"
import { StepperWithoutSaveState } from "./features/StepperWithoutSaveState"

// Example List
const rootCreatorList = container.get<RootRender>(TYPES_BRAINFUL.RootCreator)
const rootList = document.getElementById("root-list")

if (rootList) {
  rootCreatorList.render(rootList, () => container.get<List>(List))
} else {
  throw Error("Not found root element")
}

// Example List Counter
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

// Example Stepper
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

// Example Stepper
const rootCreatorStepperWithoutSaveState = container.get<RootRender>(
  TYPES_BRAINFUL.RootCreator,
)
const rootStepperWithoutSaveState = document.getElementById(
  "root-stepper-without-save-state",
)

if (rootStepperWithoutSaveState) {
  rootCreatorStepperWithoutSaveState.render(rootStepperWithoutSaveState, () =>
    container.get<StepperWithoutSaveState>(StepperWithoutSaveState),
  )
} else {
  throw Error("Not found root element")
}
