import { describe, expect, it, vi } from "vitest"
import { ComponentId } from "../core"

describe("ComponentId", () => {
  it("should be generate string id", async () => {
    // arrange
    const generator = new ComponentId()

    // act
    const value = generator.generate()

    // assert
    expect(value).toBeTruthy()
  })

  it("should be call to generate()", async () => {
    // arrange
    const generator = new ComponentId()
    const spy = vi.spyOn(generator, "generate")

    // act
    generator.generate()

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
