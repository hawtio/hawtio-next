import React from 'react'

export type Preferences = {
  id: string
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
  order: number
}

class PreferencesRegistry {
  private preferences: { [id: string]: Preferences } = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(id: string, title: string, component: React.ComponentType<any>, order = 100) {
    if (this.preferences[id]) {
      throw new Error(`Preferences '${id}' already registered`)
    }
    this.preferences[id] = { id, title, component, order }
  }

  getPreferences(): Preferences[] {
    return Object.values(this.preferences).sort((a, b) => a.order - b.order)
  }

  reset() {
    this.preferences = {}
  }
}

export const preferencesRegistry = new PreferencesRegistry()
