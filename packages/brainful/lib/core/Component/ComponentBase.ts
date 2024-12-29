import { is } from "immutable"
import * as R from "ramda"
import {
  animationFrameScheduler,
  BehaviorSubject,
  concatMap,
  distinctUntilChanged,
  filter,
  Observable,
  observeOn,
  skip,
  Subject,
  take,
  takeUntil,
  tap,
} from "rxjs"
import { container } from "../../compositionRoot/container"
import { TYPES } from "../../compositionRoot/types"
import type {
  Children,
  ChildrenIterator,
  ComponentStateful,
  DomFinder,
  IdGenerator,
} from "../../interface"

type Event = EventSetParent | EventDestroy

interface EventSetParent {
  name: "setParent"
  value: ComponentStateful
}

interface EventDestroy {
  name: "destroy"
  value: null
}

export abstract class ComponentBase<TProps = any, TState = any>
  implements ComponentStateful<TProps, TState>
{
  #idGenerator = container.get<IdGenerator>(TYPES.ComponentId)
  #domFinder = container.get<DomFinder>(TYPES.ElementFinder)

  #unsubscribe: Subject<void>
  #eventsSubject: Subject<Event>
  #events: Observable<Event>

  #id: string
  #host: Element
  #parent: ComponentStateful | undefined
  #slick: () => boolean
  #props: () => TProps

  abstract stateSubject: BehaviorSubject<TState>
  abstract state: Observable<TState>

  protected constructor() {
    this.#unsubscribe = new Subject<void>()
    this.#eventsSubject = new Subject<Event>()
    this.#events = this.#eventsSubject.asObservable()

    this.#id = this.#idGenerator.generate()
    this.#host = document.createElement("div")
    this.#parent = undefined
    this.#slick = () => false
    this.#props = () => ({}) as TProps

    this._handleSetParent()
    this._handleStateUpdated()
    this._handleDestroy()
    this._handleCleaner()
  }

  abstract render(): string

  onMounted(): void {}
  onUpdated(): void {}
  onDestroy(): void {}

  get id(): string {
    return this.#id
  }

  get host(): Element {
    return this.#host
  }

  get parent(): ComponentStateful | undefined {
    return this.#parent
  }

  get props(): TProps {
    return this.#props()
  }

  get slick(): boolean {
    return this.#slick()
  }

  setSlick(cb: () => boolean): this {
    this.#slick = cb
    return this
  }

  setParent(parent: ComponentStateful): this {
    this.#eventsSubject.next({
      name: "setParent",
      value: parent,
    })

    return this
  }

  setProps(cb: () => TProps): this {
    this.#props = cb
    return this
  }

  children(): ChildrenIterator {
    return []
  }

  mount(): void {
    queueMicrotask(() => {
      R.ifElse(
        (parentElement: Element | null) => Boolean(parentElement),
        (parentElement) => {
          queueMicrotask(() => {
            this.#host.innerHTML = this.render()
            ;(parentElement as Element).replaceChildren(this.#host)

            this.children().forEach((c: Children) => {
              c.setParent(this).mount()
            })

            requestAnimationFrame(() => {
              this.onMounted()
            })
          })
        },
        R.T,
      )(this.#domFinder.find(this.#parent?.host, this.#id))
    })
  }

  destroy(): void {
    queueMicrotask(() => {
      this.#eventsSubject.next({ name: "destroy", value: null })
    })
  }

  private _handleSetParent() {
    this.#events
      .pipe(
        takeUntil(this.#unsubscribe),
        filter((evt) => R.equals("setParent", evt.name)),
        take(1),
        tap((evt) => {
          this.#parent = (evt as EventSetParent).value
        }),
      )
      .subscribe()
  }

  private _handleStateUpdated(): void {
    queueMicrotask(() => {
      this.state
        .pipe(
          takeUntil(this.#unsubscribe),
          skip(1),
          distinctUntilChanged((previous: any, current: any) =>
            is(previous, current),
          ),
          tap(() => {
            queueMicrotask(() => {
              this.#host.innerHTML = this.render()

              this.children().forEach((c: Children) => {
                c.setParent(this).mount()
              })

              requestAnimationFrame(() => {
                this.onUpdated()
              })
            })
          }),
        )
        .subscribe()
    })
  }

  private _handleDestroy() {
    this.#events
      .pipe(
        takeUntil(this.#unsubscribe),
        filter((evt) => R.equals("destroy", evt.name)),
        tap(() => {
          queueMicrotask(() => {
            this.onDestroy()
          })

          queueMicrotask(() => {
            R.ifElse(
              () => this.#unsubscribe.observed,
              () => {
                this.#unsubscribe.next()
                this.#unsubscribe.complete()
                this.#eventsSubject.complete()
                this.#host.innerHTML = ""
                this.#parent = undefined
              },
              R.T,
            )()
          })

          this.children().forEach((c: Children) => {
            c.destroy()
          })
        }),
      )
      .subscribe()
  }

  private _handleCleaner() {
    const parentSubscribe = () =>
      (this.#parent as ComponentStateful).state.pipe(
        takeUntil(this.#unsubscribe),
        observeOn(animationFrameScheduler),
        skip(1),
        filter(() => R.not(this.#slick())),
        tap(() => {
          R.ifElse(
            () => R.isNil(this.#domFinder.find(this.#parent?.host, this.id)),
            () => {
              this.destroy()
            },
            R.T,
          )()
        }),
      )

    this.#events
      .pipe(
        takeUntil(this.#unsubscribe),
        filter((evt) => R.equals("setParent", evt.name)),
        take(1),
        concatMap(parentSubscribe),
      )
      .subscribe()
  }
}
