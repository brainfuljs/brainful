import { describe, expect, it, vi } from "vitest"
import { ElementFinder } from "../core"

describe("ElementFinder: Meta", () => {
  it("should be contain attr", async () => {
    // arrange
    const finder = new ElementFinder()

    // act
    const value = finder.attr

    // assert
    expect(value).toBeTruthy()
  })

  it("should be call to find()", async () => {
    // arrange
    const finder = new ElementFinder()
    const root = document.createElement("div")
    const element = document.createElement("div")
    root.replaceChildren(element)

    const id = "abc"
    element.setAttribute(finder.attr, id)

    const spy = vi.spyOn(finder, "find")

    // act
    finder.find(root, id)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be find as truthy", async () => {
    // arrange
    const finder = new ElementFinder()
    const root = document.createElement("div")
    const element = document.createElement("div")
    root.replaceChildren(element)

    const id = "abc"
    element.setAttribute(finder.attr, id)

    // act
    const elementExpected = finder.find(root, id)

    // assert
    expect(elementExpected).toBeTruthy()
  })

  it("should be find as falsy", async () => {
    // arrange
    const finder = new ElementFinder()
    const root = document.createElement("div")
    const element = document.createElement("div")
    root.replaceChildren(element)

    const id = "abc"
    element.setAttribute(finder.attr, id)

    // act
    const elementExpected = finder.find(root, id + "d")

    // assert
    expect(elementExpected).toBeFalsy()
  })

  it("should be find as falsy without args", async () => {
    // arrange
    const finder = new ElementFinder()
    const root = document.createElement("div")
    const element = document.createElement("div")
    root.replaceChildren(element)

    const id = "abc"
    element.setAttribute(finder.attr, id)

    // act
    const elementExpected = finder.find()

    // assert
    expect(elementExpected).toBeFalsy()
  })
})
