import React from 'react'
import { preferencesRegistry } from './registry'

describe('preferencesRegistry', () => {
  beforeEach(() => preferencesRegistry.reset())

  test('add preferences', () => {
    expect(preferencesRegistry).not.toBeNull()
    expect(preferencesRegistry.getPreferences()).toEqual([])
    preferencesRegistry.add('test', 'Test', () => <React.Fragment />)
    expect(preferencesRegistry.getPreferences()).toHaveLength(1)
    expect(preferencesRegistry.getPreferences()[0]?.id).toEqual('test')
    expect(preferencesRegistry.getPreferences()[0]?.title).toEqual('Test')
    expect(preferencesRegistry.getPreferences()[0]?.component).not.toBeNull()

    // duplicate preferences not allowed
    expect(() => preferencesRegistry.add('test', 'Test', () => <React.Fragment />)).toThrowError(
      /Preferences 'test' already registered/,
    )
  })

  test('return preferences in order', () => {
    expect(preferencesRegistry).not.toBeNull()
    expect(preferencesRegistry.getPreferences()).toEqual([])

    preferencesRegistry.add('id3', 'Pref3', () => <React.Fragment />, 3)
    preferencesRegistry.add('id1', 'Pref1', () => <React.Fragment />, 1)
    preferencesRegistry.add('id2', 'Pref2', () => <React.Fragment />, 2)

    expect(preferencesRegistry.getPreferences()).toHaveLength(3)
    expect(preferencesRegistry.getPreferences().map(h => h.id)).toEqual(['id1', 'id2', 'id3'])
  })
})
