export type Help = {
  id: string
  title: string
  content: string
  order: number
}

class HelpRegistry {

  private helps: Help[] = []

  async add(id: string, title: string, content: string, order = 100): Promise<void> {
    const res = await fetch(content)
    const text = await res.text()
    this.helps.push({ id, title, content: text, order })
  }

  getHelps(): Help[] {
    return this.helps.sort((a, b) => a.order - b.order)
  }

  reset(): void {
    this.helps = []
  }
}

const helpRegistry = new HelpRegistry()

export default helpRegistry
