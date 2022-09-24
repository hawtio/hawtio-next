import React from 'react'

export type Preferences = {
  id: string
  title: string
  component: React.ComponentType<unknown>
  order: number
}

class PreferencesRegistry {

  private preferences: Preferences[] = []

  add(id: string, title: string, component: React.ComponentType<unknown>, order = 100): void {
    this.preferences.push({ id, title, component, order })
  }

  getPreferences(): Preferences[] {
    return this.preferences.sort((a, b) => a.order - b.order)
  }

  reset(): void {
    this.preferences = []
  }
}

const preferencesRegistry = new PreferencesRegistry()

export default preferencesRegistry
