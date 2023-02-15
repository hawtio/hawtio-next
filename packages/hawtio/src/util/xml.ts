/**
 * Parse the given xml value using the native parser.
 * If not available then an error will be thrown
 */
export function parseXML(xml: string): XMLDocument {
  if (!window.DOMParser) throw new Error(`Cannot parse xml due to no available native parser`)

  const parser = new DOMParser()
  return parser.parseFromString(xml, 'text/xml')
}
