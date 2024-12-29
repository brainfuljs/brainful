import { describe, expect, it, vi } from "vitest"
import { RootCreator } from "../core"
import { ComponentStateful, DomFinder } from "../interface"

describe("ElementFinder: Meta", () => {
  it("should be call to render()", async () => {
    // arrange
    const root = document.createElement("div")

    const component = {
      mount() {},
      setParent() {},
    } as unknown as ComponentStateful

    const getComponent = () => component

    const domFinder = {
      attr: "data-b-key",
      find() {
        return null
      },
    } satisfies DomFinder

    const rootCreator = new RootCreator(domFinder)

    const spy = vi.spyOn(rootCreator, "render")

    // act
    rootCreator.render(root, getComponent)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be call to component methods", async () => {
    // arrange
    const root = document.createElement("div")

    const component = {
      mount() {},
      setParent() {},
    } as unknown as ComponentStateful

    const getComponent = () => component

    const domFinder = {
      attr: "data-b-key",
      find() {
        return null
      },
    } satisfies DomFinder

    const rootCreator = new RootCreator(domFinder)

    const spySetParent = vi.spyOn(component, "setParent")
    const spyMount = vi.spyOn(component, "mount")

    // act
    await vi.waitFor(() => {
      rootCreator.render(root, getComponent)
    })

    // assert
    expect(spySetParent).toHaveBeenCalledTimes(1)
    expect(spyMount).toHaveBeenCalledTimes(1)
  })
})
