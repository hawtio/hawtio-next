export type Help = {
  id: string
  title: string
  content: string
  order: number
}

class HelpRegistry {
  private helps: { [id: string]: Help } = {}

  add(id: string, title: string, content: string, order = 100) {
    if (this.helps[id]) {
      throw new Error(`Help '${id}' already registered`)
    }
    this.helps[id] = { id, title, content, order }
  }

  getHelps(): Help[] {
    return Object.values(this.helps).sort((a, b) => a.order - b.order)
  }

  reset() {
    this.helps = {}
  }
}

export const helpRegistry = new HelpRegistry()
