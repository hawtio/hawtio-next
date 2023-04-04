import { tidyLabels } from './helpers'

describe('camel-preferences-service', () => {
  describe('Helpers', () => {
    describe('Tidy labels', () => {
      test('It tidies labels for an object property name to an human readable string', () => {
        //Given
        const propertyName = 'ObjectName'
        const expected = 'Object Name'
        //When
        const label = tidyLabels(propertyName)
        //Then
        expect(label).toEqual(expected)
      })
      test('It will respect all caps acronyms', () => {
        //Given
        const propertyName = 'XHTTPRequest'
        const expected = 'XHTTP Request'
        //When
        const label = tidyLabels(propertyName)
        //Then
        expect(label).toEqual(expected)
      })
      test('It will respect MBean name', () => {
        //Given
        const propertyName = 'MBeanName'
        const expected = 'MBean Name'
        //When
        const label = tidyLabels(propertyName)
        //Then
        expect(label).toEqual(expected)
      })
      test('It will respect MBean name with multiple caps afters', () => {
        //Given
        const propertyName = 'MBeanHTML'
        const expected = 'MBean HTML'
        //When
        const label = tidyLabels(propertyName)
        //Then
        expect(label).toEqual(expected)
      })
    })
  })
})

export {}
