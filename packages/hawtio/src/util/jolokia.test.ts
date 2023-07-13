import { operationToString } from './jolokia'

describe('jolokia', () => {
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
