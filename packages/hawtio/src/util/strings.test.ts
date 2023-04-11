import { humanizeLabels, parseBoolean, toString, trimQuotes } from './strings'

describe('strings', () => {
  test('toString', () => {
    expect(toString(null)).toEqual('{}')
    expect(toString({})).toEqual('{  }')
    const obj = { a: 'x', b: 'y', c: 'z' }
    expect(toString(obj)).toEqual('{ a: x, b: y, c: z }')
  })

  test('trimQuotes()', () => {
    // it should only trim enclosing quotes
    expect(trimQuotes('"0.0.0.0"')).toBe('0.0.0.0')
    expect(trimQuotes("'0.0.0.0'")).toBe('0.0.0.0')
    expect(trimQuotes("CodeHeap 'non-nmethods'")).toBe("CodeHeap 'non-nmethods'")
    expect(trimQuotes('CodeHeap "non-nmethods"')).toBe('CodeHeap "non-nmethods"')

    // it should not cause exception when null is passed
    expect(trimQuotes(null as never)).toBeNull()
  })

  test('parseBoolean()', () => {
    expect(parseBoolean('true')).toBeTruthy()
    expect(parseBoolean('TRUE')).toBeTruthy()
    expect(parseBoolean('tRuE')).toBeTruthy()
    expect(parseBoolean('1')).toBeTruthy()

    expect(parseBoolean('')).toBeFalsy()
    expect(parseBoolean('false')).toBeFalsy()
    expect(parseBoolean('FALSE')).toBeFalsy()
    expect(parseBoolean('FaLsE')).toBeFalsy()
    expect(parseBoolean('0')).toBeFalsy()
  })

  test('humanizeLabels()', () => {
    expect(humanizeLabels('ObjectName')).toEqual('Object Name')
    expect(humanizeLabels('XHTTPRequest')).toEqual('XHTTP Request')
    expect(humanizeLabels('MBeanName')).toEqual('MBean Name')
    expect(humanizeLabels('MBeanHTML')).toEqual('MBean HTML')

    expect(humanizeLabels('object-name')).toEqual('Object Name')
    expect(humanizeLabels('double--dashes')).toEqual('Double Dashes')
    expect(humanizeLabels('mbean-name')).toEqual('MBean Name')

    expect(humanizeLabels('-Object-Name-')).toEqual('Object Name')

    expect(humanizeLabels('')).toEqual('')
    expect(humanizeLabels('            ')).toEqual('')
    expect(humanizeLabels('Object       Name')).toEqual('Object Name')
  })
})
