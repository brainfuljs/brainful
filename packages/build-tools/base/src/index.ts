import "reflect-metadata"

import { RootCreator } from "@brainfuljs/brainful"
import { container } from "./app/compositionRoot/container"
import { HelloWorld } from "./features/HelloWorld"

const rootCreator = container.get<RootCreator>(RootCreator)

const rootList = document.getElementById("root")

if (rootList) {
  rootCreator.render(rootList, () => container.get<HelloWorld>(HelloWorld))
} else {
  throw Error("Not found root element")
}
