import { log } from '../globals'
import { CamelImageIcon } from './CamelImageIcon'
import * as svg from './svg'

const elementMap: Map<string, JSX.Element> = new Map<string, JSX.Element>()

function buildIcon(name: string, svg: string, size: number) {
  return <CamelImageIcon name={name} svg={svg} size={size} />
}

// Populate the element map with the react rendered svg components
for (const [key, value] of Object.entries(svg)) {
  if (key === 'IconNames') {
    continue // not applicable
  }
  const iconName = (key[0]?.toUpperCase() ?? '') + key.substring(1) + 'Icon'
  elementMap.set(iconName, buildIcon(iconName, value, 16))
}

export const IconNames = svg.IconNames

export interface IconProperties {
  size: number
  inline: boolean
}

export function getIcon(name: string, size?: number): JSX.Element {
  let element: JSX.Element | undefined
  if (!size)
    // No size defined so return the default cached icon
    element = elementMap.get(name)
  else {
    // Custom sized icons are not indexed by default but cached after first build
    log.debug("Fetching custom sized icon '" + name + "' with size '" + size + "'")

    // Store the icon against the name & size
    const customIconName = name + '_' + size
    element = elementMap.get(customIconName)

    if (!element) {
      // No icon in cache so build the icon then cache it
      const iconKey = name.replace('Icon', '').toLowerCase()
      Object.entries(svg)
        .filter(([key, _]) => iconKey === key)
        .forEach(([_, value]) => {
          log.debug("Building custom sized icon '" + name + "' with size '" + size + "'")
          element = buildIcon(customIconName, value, size)
          elementMap.set(customIconName, element)
        })
    }
  }

  return element ? element : elementMap.get(IconNames.GenericIcon) ?? svg.generic
}
