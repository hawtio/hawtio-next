import { escapeHtmlId } from '@hawtiosrc/util/htmls'

export class Property {
  readonly id: string
  constructor(
    public name: string,
    public value: string | null,
    public description: string,
  ) {
    this.id = escapeHtmlId(name)
  }

  static sortByName(a: Property, b: Property) {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1

    return 0
  }
}
