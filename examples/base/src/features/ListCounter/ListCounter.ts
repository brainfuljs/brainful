import type { ChildrenIterator } from "@brainfuljs/brainful"
import {
  Children,
  ComponentBase,
  ComponentStateful,
} from "@brainfuljs/brainful"
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
import { container } from "../../app/compositionRoot/container"
import { TYPES } from "../../app/compositionRoot/types"
import type { ErrorHandler } from "../../interfaces"
import { Button } from "../../shared/components/Button"
import { childrenIterator } from "../../shared/tools/childrenIterator"
import { delegate } from "../../shared/tools/delegate"
import { Counter } from "../Counter"

interface State {
  children: {
    buttonAdd: {
      component: Children
    }
    buttonRemove: {
      component: Children
    }
    list: {
      component: Children
    }[]
  }
}

type StateImm = FromJS<State>

@injectable()
export class ListCounter extends ComponentBase {
  public unsubscribe: Subject<void>
  public stateSubject: BehaviorSubject<StateImm>
  public state: Observable<StateImm>
  public childrenMap: { counter: () => { component: ComponentStateful } }

  constructor(@inject(TYPES.ErrorService) public errorHandler: ErrorHandler) {
    super()
    this.unsubscribe = new Subject<void>()

    this.childrenMap = {
      counter: () => ({
        component: container.get<Counter>(Counter),
      }),
    }

    this.stateSubject = new BehaviorSubject<StateImm>(
      fromJS({
        children: {
          buttonAdd: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-counter btn-counter-add",
              content: "add",
            })),
          },
          buttonRemove: {
            component: container.get<Button>(Button).setProps(() => ({
              classes: "btn-counter btn-counter-remove",
              content: "remove",
            })),
          },
          list: [
            {
              component: container.get<Counter>(Counter),
            },
          ],
        },
      }),
    )
    this.state = this.stateSubject.asObservable()

    this._handleList()
  }

  children(): ChildrenIterator {
    return childrenIterator(this.stateSubject)
  }

  onDestroy() {
    this.unsubscribe.next()
    this.unsubscribe.complete()
  }

  private _handleList() {
    fromEvent(this.host, "click")
      .pipe(
        takeUntil(this.unsubscribe),
        delegate("btn-counter"),
        tap((evt) => {
          R.ifElse(
            (evt: any) => evt.target.classList.contains("btn-counter-add"),
            () =>
              this._handleUpdateList((list: any) =>
                list.push(fromJS(this.childrenMap.counter())),
              ),
            () =>
              this._handleUpdateList((list: any) =>
                list.pop(fromJS(this.childrenMap.counter())),
              ),
          )(evt as unknown as HTMLElement)
        }),
        catchError((error) => {
          this.errorHandler.handle(error)
          return of(error)
        }),
      )
      .subscribe()
  }

  private _handleUpdateList(cb: any) {
    this.stateSubject.next(
      this.stateSubject
        .getValue()
        .updateIn(["children", "list"], (list: any) => cb(list)),
    )
  }

  render() {
    const template = `
      <div>
        <h2>List Counter</h2>
        {{#state.children.list}}
          <div data-b-key="{{component.id}}"></div>
        {{/state.children.list}}

        <div>
          <div data-b-key="{{state.children.buttonAdd.component.id}}"></div>
          <div data-b-key="{{state.children.buttonRemove.component.id}}"></div>
        </div>
      </div>
    `

    return M.render(template, {
      state: this.stateSubject.getValue().toJS(),
    })
  }
}
