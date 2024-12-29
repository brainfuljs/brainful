export interface DomFinder {
  attr: string
  find(node?: Element | null, id?: string | null): Element | null
}
