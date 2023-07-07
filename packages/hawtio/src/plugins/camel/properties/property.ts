export class Property {
  constructor(
    public name: string,
    public value: string | null,
    public description: string,
  ) {}

  static sortByName(a: Property, b: Property) {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1

    return 0
  }
}
