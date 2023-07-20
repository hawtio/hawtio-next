import { visualizationService } from './visualization-service'
import path from 'path'
import fs from 'fs'
import { RouteStats } from '@hawtiosrc/plugins/camel/routes-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared'

jest.mock('@hawtiosrc/plugins/shared/jolokia-service')

describe('visualization-service', () => {
  const routesXmlPath = path.resolve(__dirname, '../testdata', 'camel-choice-route.xml')
  const sampleRoutesXml = fs.readFileSync(routesXmlPath, { encoding: 'utf8', flag: 'r' })
  const routesStatsXmlPath = path.resolve(__dirname, '../testdata', 'camel-routes-stats.xml')
  const sampleRoutesStatsXml = fs.readFileSync(routesStatsXmlPath, { encoding: 'utf8', flag: 'r' })

  describe('loadRouteXmlNodes', () => {
    test('nodes and edges were correctly loaded from the file', () => {
      const node = new MBeanNode(null, 'test', true)
      const { camelNodes, edges } = visualizationService.loadRouteXmlNodes(node, sampleRoutesXml)
      expect(camelNodes.length).toBe(11)
      expect(camelNodes[1]?.data.cid).toBe('choice1')
      expect(camelNodes[1]?.data.label).toBe('Choice')
      expect(camelNodes[1]?.id).toBe('1')
      //find choice branches:
      const tmpEdges = edges.filter(e => e.source === '1')
      expect(tmpEdges.length).toBe(3)
      //check if otherwise is connected to choice
      const otherwise = camelNodes.find(n => n.id === tmpEdges[2]?.target)
      expect(otherwise?.data.label).toBe('Otherwise')

      const when1 = camelNodes.find(n => n.id === tmpEdges[0]?.target)
      expect(when1?.data.cid).toBe('when1')

      const when2 = camelNodes.find(n => n.id === tmpEdges[1]?.target)
      expect(when2?.data.cid).toBe('when2')

      // check if label is parsed correctly
      expect(when2?.data.label).toBe(`When: \${body} == 'Hello Camel! - simple'`)
    })
  })
  describe('updateStats', () => {
    test('processor stats were updates on the nodes', () => {
      const node = new MBeanNode(null, 'test', true)
      const { camelNodes } = visualizationService.loadRouteXmlNodes(node, sampleRoutesXml)
      const nodesWithStats = visualizationService.updateStats(sampleRoutesStatsXml, camelNodes)

      const to2 = nodesWithStats.find(n => n.data.cid === 'to2')
      const stats = to2?.data.stats

      expect(stats?.exchangesCompleted).toEqual('3522')
      expect(stats?.id).toEqual('to2')
      expect(stats?.exchangesInflight).toEqual('1')
      expect(stats?.exchangesFailed).toEqual('2')
      expect(stats?.maxProcessingTime).toEqual('6')
      expect(stats?.minProcessingTime).toEqual('6')
      expect(stats?.totalProcessingTime).toEqual('14')
      expect(stats?.lastProcessingTime).toEqual('7')
      expect(stats?.deltaProcessingTime).toEqual('8')
      expect(stats?.meanProcessingTime).toEqual('9')
      expect(stats?.startTimestamp).toEqual('2023-04-04T14:57:34.378+0200')
      expect(stats?.resetTimestamp).toEqual('2023-04-04T14:57:34.378+0200')
      expect(stats?.firstExchangeCompletedTimestamp).toEqual('2023-04-04T14:57:34.470+0200')
      expect(stats?.firstExchangeCompletedExchangeId).toEqual('AD9CBF72FE18D9A-0000000000000000')
      expect(stats?.firstExchangeFailureTimestamp).toEqual('10')
      expect(stats?.firstExchangeFailureExchangeId).toEqual('11')
      expect(stats?.lastExchangeCompletedTimestamp).toEqual('2023-04-05T16:44:21.312+0200')
      expect(stats?.lastExchangeCompletedExchangeId).toEqual('AD9CBF72FE18D9A-0000000000001B83')
      expect(stats?.lastExchangeCreatedTimestamp).toEqual('12')
      expect(stats?.lastExchangeFailureTimestamp).toEqual('13')
      expect(stats?.lastExchangeFailureExchangeId).toEqual('14')
    })
    test('route stats were updates on the from node', () => {
      const node = new MBeanNode(null, 'test', true)
      const { camelNodes } = visualizationService.loadRouteXmlNodes(node, sampleRoutesXml)
      const nodesWithStats = visualizationService.updateStats(sampleRoutesStatsXml, camelNodes)

      const from = nodesWithStats.find(n => n.data.type === 'from')
      const stats = from?.data.stats as RouteStats

      expect(stats?.id).toEqual('route1')
      expect(stats?.state).toEqual('Started')
      expect(stats?.sourceLocation).toEqual('SampleCamelRouter.java:14')
      expect(stats?.exchangesInflight).toEqual('0')
      expect(stats?.exchangesCompleted).toEqual('7044')
      expect(stats?.exchangesFailed).toEqual('1')
      expect(stats?.failuresHandled).toEqual('2')
      expect(stats?.redeliveries).toEqual('3')
      expect(stats?.externalRedeliveries).toEqual('4')
      expect(stats?.minProcessingTime).toEqual('5')
      expect(stats?.maxProcessingTime).toEqual('7')
      expect(stats?.totalProcessingTime).toEqual('39')
      expect(stats?.lastProcessingTime).toEqual('6')
      expect(stats?.deltaProcessingTime).toEqual('7')
      expect(stats?.meanProcessingTime).toEqual('8')
      expect(stats?.startTimestamp).toEqual('2023-04-04T14:57:34.383+0200')
      expect(stats?.resetTimestamp).toEqual('2023-04-04T14:57:34.383+0200')
      expect(stats?.firstExchangeCompletedTimestamp).toEqual('2023-04-04T14:57:34.470+0200')
      expect(stats?.firstExchangeCompletedExchangeId).toEqual('AD9CBF72FE18D9A-0000000000000000')
      expect(stats?.firstExchangeFailureTimestamp).toEqual('9')
      expect(stats?.firstExchangeFailureExchangeId).toEqual('10')
      expect(stats?.lastExchangeFailureTimestamp).toEqual('11')
      expect(stats?.lastExchangeCompletedTimestamp).toEqual('2023-04-05T16:44:21.312+0200')
      expect(stats?.lastExchangeCompletedExchangeId).toEqual('AD9CBF72FE18D9A-0000000000001B83')
      expect(stats?.lastExchangeFailureTimestamp).toEqual('11')
      expect(stats?.lastExchangeFailureExchangeId).toEqual('12')
    })
  })
})
