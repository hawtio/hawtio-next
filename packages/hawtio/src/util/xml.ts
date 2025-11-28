/**
 * Parse the given xml value using the native parser.
 * If not available then an error will be thrown.
 */
export function parseXML(xml: string): XMLDocument {
  if (!window.DOMParser) throw new Error('Cannot parse xml due to no available native parser')

  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')

  const errorNode = doc.querySelector('parsererror')
  if (errorNode) {
    throw new Error(`Failed to parse XML: ${errorNode.textContent}`)
  }

  return doc
}

export function xmlText(element: Element): string | null {
  const txt = element.firstChild?.textContent
  return !txt ? null : txt
}

export function childText(element: Element, childTag: string): string | null {
  const childEl = element.querySelector(childTag)
  if (!childEl) return null
  return xmlText(childEl)
}
