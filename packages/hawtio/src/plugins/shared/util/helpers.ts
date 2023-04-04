/**
 * Will format a property to a standart human readable string with its spaces.
 * It will respect MBean and leave it together
 * @param str The property to transform
 * @returns The property with its proper spaces
 */
export const tidyLabels = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
    .replace('M Bean', 'MBean')
    .replace(/^./, function (str) {
      return str.toUpperCase()
    })
