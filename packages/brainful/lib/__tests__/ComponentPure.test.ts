import { fromJS, FromJS } from "immutable"
import M from "mustache"
import { nanoid } from "nanoid/non-secure"
import { BehaviorSubject, from, Observable, Subject } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { TYPES } from "../compositionRoot/types"
import { ComponentBase, ComponentPure } from "../core"
import {
  Children,
  ComponentStateful,
  ComponentStateless,
  DomFinder,
  IdGenerator,
} from "../interface"
import { childrenIterator } from "./tools/childrenIterator.ts"

vi.mock("../compositionRoot/container.ts", async () => {
  return {
    container: {
      get(args: symbol) {
        if (args === TYPES.ComponentId) {
          return {
            generate() {
              return `b-${nanoid(10)}`
            },
          } satisfies IdGenerator
        }

        if (args === TYPES.ElementFinder) {
          return {
            attr: "data-b-key",
            find(node: Element, id: string) {
              if (node && id) {
                return node.querySelector(`[${this.attr}=${id}]`)
              } else {
                return null
              }
            },
          } satisfies DomFinder
        }
      },
    },
  }
})

vi.stubGlobal("requestAnimationFrame", (cb: () => any) => {
  cb()
})

async function mountRoot(component: ComponentStateful | ComponentStateless) {
  await vi.waitFor(() => {
    const root = document.createElement("div")
    const host = document.createElement("div")
    host.setAttribute("data-b-key", component.id)

    root.replaceChildren(host)

    component.setParent({
      host: root,
      state: from<any>([]),
    } as unknown as ComponentStateful)

    component.mount()
  })
}

describe("ComponentPure: Mount", () => {
  it("should be call to mount()", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    const spy = vi.spyOn(button, "mount")

    // act
    await mountRoot(button)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe("ComponentPure: Destroy", () => {
  it("should be call to destroy()", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    const spy = vi.spyOn(button, "destroy")
    await mountRoot(button)

    // act
    button.destroy()

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe("ComponentPure: Props", () => {
  it("should be call to setProps()", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    const props = { content: "button" }
    const spy = vi.spyOn(button, "setProps")

    await mountRoot(button)

    // act
    button.setProps(() => props)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be return props", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    const props = { content: "button" }
    button.setProps(() => props)

    await mountRoot(button)

    // act
    const propsExpected = button.props

    // assert
    expect(propsExpected).toEqual(props)
  })
})

describe("ComponentPure: Slick", () => {
  it("should be call to setSlick()", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    const spy = vi.spyOn(button, "setSlick")
    await mountRoot(button)

    // act
    button.setSlick(() => true)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be return slick as truthy", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    await mountRoot(button)

    // act
    button.setSlick(() => true)
    const slick = button.slick

    // assert
    expect(slick).toBeTruthy()
  })

  it("should be return slick as falsy", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()

    await mountRoot(button)

    // act
    const slick = button.slick

    // assert
    expect(slick).toBeFalsy()
  })
})

describe("ComponentPure: Meta", () => {
  it("should be return id", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()

    await mountRoot(button)

    // act
    const id = button.id

    // assert
    expect(id).toBeTruthy()
  })

  it("should be return host", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()

    await mountRoot(button)

    // act
    const host = button.host

    // assert
    expect(host).toBeTruthy()
  })
})

describe("ComponentPure: Parent", () => {
  it("should be call to setParent()", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    const spy = vi.spyOn(button, "setParent")

    // act
    await mountRoot(button)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be return parent", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    await mountRoot(button)

    // act
    const parent = button.parent

    // assert
    expect(parent).toBeTruthy()
  })

  it("should be return parent as falsy", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()

    // act
    const parent = button.parent

    // assert
    expect(parent).toBeFalsy()
  })
})

describe("ComponentPure: Hooks", () => {
  it("should be call to hook onMounted", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }
    const button = new Button()
    const spy = vi.spyOn(button, "onMounted")
    await mountRoot(button)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be call to hook onDestroy", async () => {
    // arrange
    interface Props {
      content: string
    }

    class Button extends ComponentPure<Props> {
      constructor() {
        super()
      }

      render() {
        const template = `
          <button class="button">
            {{props.content}}
          </button>
        `

        return M.render(template, {
          props: this.props,
        })
      }
    }

    const button = new Button()

    interface StateBox {
      counter: 0
      children: {
        button: {
          component: ComponentStateless
        }
      }
    }

    type StateBoxImm = FromJS<StateBox>

    class Box extends ComponentBase<any, StateBoxImm> {
      stateSubject: BehaviorSubject<StateBoxImm>
      state: Observable<StateBoxImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateBoxImm>(
          fromJS({
            counter: 0,
            children: {
              button: {
                component: button,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      removeChildren() {
        this.stateSubject.next(
          this.stateSubject.getValue().set("children", fromJS({})),
        )
      }

      children(): { forEach: (cb: (c: Children) => void) => void } {
        return childrenIterator(this.stateSubject)
      }

      setCount(value: number) {
        this.stateSubject.next(
          this.stateSubject.getValue().setIn(["counter"], value),
        )
      }

      render() {
        const template = `
          <div class="box">
            {{#state.children.button.component.id}}
              <div data-b-key="{{state.children.button.component.id}}"></div>
            {{/state.children.button.component.id}}
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const box = new Box()
    const spy = vi.spyOn(button, "onDestroy")

    await mountRoot(box)

    // act
    await vi.waitFor(
      () => {
        box.setCount(1)
      },
      { timeout: 200 },
    )

    await vi.waitFor(
      () => {
        box.removeChildren()
      },
      { timeout: 200 },
    )

    await vi.waitFor(
      () => {
        box.setCount(2)
      },
      { timeout: 200 },
    )

    // assert
    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
