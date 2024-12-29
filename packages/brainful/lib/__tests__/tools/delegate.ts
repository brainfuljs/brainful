import { filter } from "rxjs"

export function delegate(selector: string) {
  return filter((event: Event) => {
    const target = event.target as HTMLElement
    return target.classList.contains(selector)
  })
}
