import type { ChildrenIterator } from "@brainfuljs/brainful"
import { type Children, ComponentBase } from "@brainfuljs/brainful"
import { fromJS, FromJS } from "immutable"
import { inject, injectable } from "inversify"
import M from "mustache"
import * as R from "ramda"
import {
  BehaviorSubject,
  catchError,
  fromEvent,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
} from "rxjs"
import { container } from "../../app/compositionRoot/container.ts"
import { TYPES } from "../../app/compositionRoot/types.ts"
import type { ErrorHandler } from "../../interfaces"
import { Button } from "../../shared/components/Button"
import { childrenIterator } from "../../shared/tools/childrenIterator"
import { delegate } from "../../shared/tools/delegate"
import "./styles.css"

interface Todo {
  id: number
  content: string
  complete: boolean
}

interface State {
  children: Record<string, { component: Children }>
  list: Todo[]
}

type StateImm = FromJS<State>

@injectable()
export class List extends ComponentBase<any, StateImm> {
  public unsubscribe: Subject<void>
  public stateSubject: BehaviorSubject<StateImm>
  public state: Observable<StateImm>

  constructor(@inject(TYPES.ErrorService) public errorHandler: ErrorHandler) {
    super()
    this.unsubscribe = new Subject<void>()
    this.stateSubject = new BehaviorSubject<StateImm>(
      fromJS({
        children: {
          toggle: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-todo",
              content: R.ifElse(
                () => this._helperIsCompleteAll(),
                () => "Reset All",
                () => "Toggle All",
              )(),
            })),
          },
        },
        list: [
          { id: "1", content: "Learn OOP", complete: false },
          { id: "2", content: "Learn FP", complete: false },
          { id: "3", content: "Learn RxJS", complete: false },
          { id: "4", content: "Learn Immutable", complete: false },
          { id: "5", content: "Learn Inversify", complete: false },
          { id: "6", content: "Learn Ramda", complete: false },
          { id: "7", content: "Learn Mustache", complete: false },
        ],
      }),
    )
    this.state = this.stateSubject.asObservable()

    this._handleToggle()
    this._handleToggleAll()
  }

  children(): ChildrenIterator {
    return childrenIterator(this.stateSubject)
  }

  private _handleToggle() {
    fromEvent(this.host, "click")
      .pipe(
        takeUntil(this.unsubscribe),
        delegate("list-item"),
        tap((event) => {
          const key = (event.target as HTMLElement).dataset.key as string

          const toggleComplete = R.ifElse(
            (todo: FromJS<Todo>) => R.equals(todo.get("id"), key),
            (todo) =>
              todo.set(
                "complete",
                fromJS(R.complement(Boolean)(todo.get("complete"))),
              ),
            (todo) => todo,
          )

          this.stateSubject.next(
            this.stateSubject.getValue().updateIn(["list"], (list) => {
              const l = list as unknown as FromJS<Todo[]>
              return l.map(toggleComplete)
            }),
          )
        }),
        catchError((error) => {
          this.errorHandler.handle(error)
          return of(error)
        }),
      )
      .subscribe()
  }

  private _handleToggleAll() {
    fromEvent(this.host, "click")
      .pipe(
        takeUntil(this.unsubscribe),
        delegate("btn-todo"),
        tap(() => {
          R.pipe(
            R.ifElse(
              () => this._helperIsCompleteAll(),
              () => false,
              R.T,
            ),
            (isComplete: boolean) => {
              this.stateSubject.next(
                this.stateSubject.getValue().updateIn(["list"], (list) => {
                  const l = list as unknown as FromJS<Todo[]>
                  return l.map((todo) =>
                    todo.set("complete", fromJS(isComplete)),
                  )
                }),
              )
            },
          )()
        }),
      )
      .subscribe()
  }

  private _helperIsCompleteAll() {
    const list = this.stateSubject.getValue().toJS().list as unknown as Todo[]
    return R.all((todo: Todo) => R.prop("complete", todo), list)
  }

  private _adapterViewList() {
    const stateInit = this.stateSubject.getValue().toJS() as unknown as State

    const toggleClasses = R.ifElse(
      (todo: Todo) => R.equals(todo.complete, true),
      (todo: Todo) => R.assoc("classes", "complete", todo),
      (todo: Todo) => todo,
    )

    return R.pipe(R.map(toggleClasses))(stateInit.list)
  }

  render() {
    const template = `
      <div>
        <h2>Todo List</h2>
          <ul class="list">
          {{#list}}
            <li class="list-item {{classes}}" data-key="{{id}}">
              {{content}}
            </li>
          {{/list}}
        </ul>
        <div data-b-key="{{button.id}}"></div>
      </div>
    `

    return M.render(template, {
      button: this.stateSubject
        .getValue()
        .getIn(["children", "toggle", "component"]),
      list: this._adapterViewList(),
    })
  }
}
