import { fromJS, FromJS } from "immutable"
import M from "mustache"
import { nanoid } from "nanoid/non-secure"
import { BehaviorSubject, from, Observable, Subject } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { TYPES } from "../compositionRoot/types"
import { ComponentBase } from "../core"
import {
  type ChildrenIterator,
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

describe("ComponentBase: Mount", () => {
  it("should be call to mount()", async () => {
    // arrange
    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<any, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }
    const list = new List()
    const spy = vi.spyOn(list, "mount")

    // act
    await mountRoot(list)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe("ComponentBase: Destroy", () => {
  it("should be call to destroy()", async () => {
    // arrange
    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<any, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }
    const list = new List()
    const spy = vi.spyOn(list, "destroy")

    await mountRoot(list)

    // act
    list.destroy()

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe("ComponentBase: Props", () => {
  it("should be call to setProps()", async () => {
    // arrange
    interface Props {
      caption: string
    }

    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<Props, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <h1>{{caption}}</h1>
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          caption: this.props.caption,
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }
    const list = new List()
    const spy = vi.spyOn(list, "setProps")
    const props = { caption: "List" }

    await mountRoot(list)

    // act
    list.setProps(() => props)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be return props", async () => {
    // arrange
    interface Props {
      caption: string
    }

    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<Props, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <h1>{{caption}}</h1>
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          caption: this.props.caption,
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }
    const list = new List()
    const props = { caption: "List" }
    list.setProps(() => props)

    await mountRoot(list)

    // act
    const propsExpected = list.props

    // assert
    expect(propsExpected).toEqual(props)
  })
})

describe("ComponentBase: Slick", () => {
  it("should be call to setSlick()", async () => {
    // arrange
    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<any, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()
    const spy = vi.spyOn(list, "setSlick")

    await mountRoot(list)

    // act
    list.setSlick(() => true)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be return slick as truthy", async () => {
    // arrange
    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<any, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()
    list.setSlick(() => true)

    await mountRoot(list)

    // act
    const slick = list.slick

    // assert
    expect(slick).toBeTruthy()
  })

  it("should be return slick as falsy", async () => {
    // arrange
    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<any, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    await mountRoot(list)

    // act
    const slick = list.slick

    // assert
    expect(slick).toBeFalsy()
  })
})

describe("ComponentBase: Meta", () => {
  it("should be return id", async () => {
    // arrange
    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<any, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    await mountRoot(list)

    // act
    const id = list.id

    // assert
    expect(id).toBeTruthy()
  })

  it("should be return host", async () => {
    // arrange
    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<any, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    await mountRoot(list)

    // act
    const host = list.host

    // assert
    expect(host).toBeTruthy()
  })
})

describe("ComponentBase: Parent", () => {
  it("should be call to setParent()", async () => {
    // arrange
    interface StateList {
      list: { id: string; content: string }[]
    }

    type StateListImm = FromJS<StateList>

    class List extends ComponentBase<any, StateListImm> {
      stateSubject: BehaviorSubject<StateListImm>
      state: Observable<StateListImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateListImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    interface StateBox {
      children: {
        list: {
          component: ComponentStateful
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
            children: {
              list: {
                component: list,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      children(): ChildrenIterator {
        return childrenIterator(this.stateSubject)
      }

      render() {
        const template = `
          <div class="box">
            <div data-b-key="{{list.id}}"></div>
          </div>
        `

        return M.render(template, {
          list: this.stateSubject
            .getValue()
            .getIn(["children", "list", "component"]),
        })
      }
    }

    const box = new Box()
    const spy = vi.spyOn(list, "setParent")

    // act
    await mountRoot(box)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be return parent", async () => {
    // arrange
    interface StateList {
      list: { id: string; content: string }[]
    }

    type StateListImm = FromJS<StateList>

    class List extends ComponentBase<any, StateListImm> {
      stateSubject: BehaviorSubject<StateListImm>
      state: Observable<StateListImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateListImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    interface StateBox {
      children: {
        list: {
          component: ComponentStateful
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
            children: {
              list: {
                component: list,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      children(): ChildrenIterator {
        return childrenIterator(this.stateSubject)
      }

      render() {
        const template = `
          <div class="box">
            <div data-b-key="{{list.id}}"></div>
          </div>
        `

        return M.render(template, {
          list: this.stateSubject
            .getValue()
            .getIn(["children", "list", "component"]),
        })
      }
    }

    const box = new Box()

    await mountRoot(box)

    // act
    const parent = list.parent

    // assert
    expect(parent).toBeTruthy()
  })

  it("should be return parent as falsy", async () => {
    // arrange
    interface State {
      list: { id: string; content: string }[]
    }

    type StateImm = FromJS<State>

    class List extends ComponentBase<any, StateImm> {
      stateSubject: BehaviorSubject<StateImm>
      state: Observable<StateImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    // act
    const slick = list.parent

    // assert
    expect(slick).toBeFalsy()
  })
})

describe("ComponentBase: Update state", () => {
  it("should be update state for children", async () => {
    // arrange
    interface StateList {
      list: { id: string; content: string }[]
    }

    type StateListImm = FromJS<StateList>

    class List extends ComponentBase<any, StateListImm> {
      stateSubject: BehaviorSubject<StateListImm>
      state: Observable<StateListImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateListImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      addListItem(item: { id: string; content: string }) {
        this.stateSubject.next(
          this.stateSubject.getValue().update("list", (list: any) => {
            return list.push(fromJS(item))
          }),
        )
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    interface StateBox {
      children: {
        list: {
          component: ComponentStateful
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
            children: {
              list: {
                component: list,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="box">
            <div data-b-key="{{list.id}}"></div>
          </div>
        `

        return M.render(template, {
          list: this.stateSubject
            .getValue()
            .getIn(["children", "list", "component"]),
        })
      }
    }

    const box = new Box()

    await mountRoot(box)

    // act
    list.addListItem({ id: "1", content: "Learn" })

    // assert
    expect(list.stateSubject.getValue().toJS().list).toHaveLength(2)
  })

  it("should be update state for parent", async () => {
    // arrange
    interface StateList {
      list: { id: string; content: string }[]
    }

    type StateListImm = FromJS<StateList>

    class List extends ComponentBase<any, StateListImm> {
      stateSubject: BehaviorSubject<StateListImm>
      state: Observable<StateListImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateListImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    interface StateBox {
      counter: 0
      children: {
        list: {
          component: ComponentStateful
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
              list: {
                component: list,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      children(): ChildrenIterator {
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
            <div data-b-key="{{list.id}}"></div>
          </div>
        `

        return M.render(template, {
          list: this.stateSubject
            .getValue()
            .getIn(["children", "list", "component"]),
        })
      }
    }

    const box = new Box()
    const spyList = vi.spyOn(list, "mount")
    const spyBox = vi.spyOn(box, "mount")

    await mountRoot(box)

    // act
    await vi.waitFor(() => {
      box.setCount(1)
    })

    // assert
    expect(box.stateSubject.getValue().toJS().counter).toEqual(1)

    expect(spyBox).toHaveBeenCalledTimes(1)
    expect(spyList).toHaveBeenCalledTimes(2)
  })
})

describe("ComponentBase: Hooks", () => {
  it("should be call to hook onMounted", async () => {
    // arrange
    interface StateList {
      list: { id: string; content: string }[]
    }

    type StateListImm = FromJS<StateList>

    class List extends ComponentBase<any, StateListImm> {
      stateSubject: BehaviorSubject<StateListImm>
      state: Observable<StateListImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateListImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      addListItem(item: { id: string; content: string }) {
        this.stateSubject.next(
          this.stateSubject.getValue().update("list", (list: any) => {
            return list.push(fromJS(item))
          }),
        )
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    interface StateBox {
      counter: 0
      children: {
        list: {
          component: ComponentStateful
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
              list: {
                component: list,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      children(): ChildrenIterator {
        return childrenIterator(this.stateSubject)
      }

      render() {
        const template = `
          <div class="box">
            <div data-b-key="{{list.id}}"></div>
          </div>
        `

        return M.render(template, {
          list: this.stateSubject
            .getValue()
            .getIn(["children", "list", "component"]),
        })
      }
    }

    const box = new Box()
    const spy = vi.spyOn(box, "onMounted")

    await mountRoot(box)

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be call to hook onUpdated", async () => {
    // arrange
    interface StateList {
      list: { id: string; content: string }[]
    }

    type StateListImm = FromJS<StateList>

    class List extends ComponentBase<any, StateListImm> {
      stateSubject: BehaviorSubject<StateListImm>
      state: Observable<StateListImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateListImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      addListItem(item: { id: string; content: string }) {
        this.stateSubject.next(
          this.stateSubject.getValue().update("list", (list: any) => {
            return list.push(fromJS(item))
          }),
        )
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    interface StateBox {
      counter: 0
      children: {
        list: {
          component: ComponentStateful
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
              list: {
                component: list,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      children(): ChildrenIterator {
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
            <div data-b-key="{{list.id}}"></div>
          </div>
        `

        return M.render(template, {
          list: this.stateSubject
            .getValue()
            .getIn(["children", "list", "component"]),
        })
      }
    }

    const box = new Box()
    const spy = vi.spyOn(box, "onUpdated")

    await mountRoot(box)

    await vi.waitFor(() => {
      box.setCount(1)
      box.setCount(1)
    })

    // assert
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("should be call to hook onDestroy", async () => {
    // arrange
    interface StateList {
      list: { id: string; content: string }[]
    }

    type StateListImm = FromJS<StateList>

    class List extends ComponentBase<any, StateListImm> {
      stateSubject: BehaviorSubject<StateListImm>
      state: Observable<StateListImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateListImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      addListItem(item: { id: string; content: string }) {
        this.stateSubject.next(
          this.stateSubject.getValue().update("list", (list: any) => {
            return list.push(fromJS(item))
          }),
        )
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    interface StateBox {
      counter: 0
      children: {
        list: {
          component: ComponentStateful
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
              list: {
                component: list,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      removeList() {
        this.stateSubject.next(
          this.stateSubject.getValue().set("children", fromJS({})),
        )
      }

      children(): ChildrenIterator {
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
            {{#state.children.list.component.id}}
              <div data-b-key="{{state.children.list.component.id}}"></div>
            {{/state.children.list.component.id}}
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const box = new Box()
    const spy = vi.spyOn(list, "onDestroy")

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
        box.removeList()
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

  it("should be call to hook onDestroy with children", async () => {
    // arrange
    interface StateList {
      list: { id: string; content: string }[]
    }

    type StateListImm = FromJS<StateList>

    class List extends ComponentBase<any, StateListImm> {
      stateSubject: BehaviorSubject<StateListImm>
      state: Observable<StateListImm>
      unsubscribe: Subject<void>

      constructor() {
        super()
        this.unsubscribe = new Subject<void>()
        this.stateSubject = new BehaviorSubject<StateListImm>(
          fromJS({ list: [{ id: "1", content: "Learn" }] }),
        )
        this.state = this.stateSubject.asObservable()
      }

      addListItem(item: { id: string; content: string }) {
        this.stateSubject.next(
          this.stateSubject.getValue().update("list", (list: any) => {
            return list.push(fromJS(item))
          }),
        )
      }

      render() {
        const template = `
          <div class="list">
            <ul>
              {{#state.list}}
                <li data-key="{{id}}">{{content}}</li>
              {{/state.list}}
            </ul>
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const list = new List()

    interface StateBox {
      counter: 0
      children: {
        list: {
          component: ComponentStateful
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
              list: {
                component: list,
              },
            },
          } satisfies StateBox),
        )
        this.state = this.stateSubject.asObservable()
      }

      children(): ChildrenIterator {
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
            {{#state.children.list.component.id}}
              <div data-b-key="{{state.children.list.component.id}}"></div>
            {{/state.children.list.component.id}}
          </div>
        `

        return M.render(template, {
          state: this.stateSubject.getValue().toJS(),
        })
      }
    }

    const box = new Box()
    const spy = vi.spyOn(box, "onDestroy")

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
        box.destroy()
      },
      { timeout: 200 },
    )

    // assert
    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
