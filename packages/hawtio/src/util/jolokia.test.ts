import { escapeHtmlId, escapeTags, operationToString } from './jolokia'

describe('jolokia', () => {
  test('escapeTags', () => {
    expect(escapeTags('domain-name')).toEqual('domain-name')
    expect(escapeTags('<domain-name>')).toEqual('&lt;domain-name&gt;')
    expect(escapeTags('"SampleContext"')).toEqual('"SampleContext"')
  })

  test('escapeHtmlId', () => {
    expect(escapeHtmlId('java.lang')).toEqual('java.lang')
    expect(escapeHtmlId('Camel Contexts')).toEqual('CamelContexts')
  })

  test('operationToString', () => {
    expect(operationToString('getCamelId', [])).toEqual('getCamelId()')
    expect(
      operationToString('browseMessageAsXml', [
        {
          name: 'p1',
          type: 'java.lang.Integer',
          desc: '',
        },
        {
          name: 'p2',
          type: 'java.lang.Boolean',
          desc: '',
        },
      ]),
    ).toEqual('browseMessageAsXml(java.lang.Integer,java.lang.Boolean)')
  })
})
