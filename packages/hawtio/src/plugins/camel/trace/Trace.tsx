import { MBeanNode } from '@hawtiosrc/plugins/shared'
import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardTitle,
  Divider,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  Skeleton,
  Text,
} from '@patternfly/react-core'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { BanIcon, PlayIcon } from '@patternfly/react-icons'
import { RouteDiagramContext, useRouteDiagramContext } from '../route-diagram/route-diagram-context'
import * as ccs from '../camel-content-service'
import { tracingService as ts } from './tracing-service'
import { debugService as ds } from '../debug'
import './Tracing.css'
import { IResponse } from 'jolokia.js'
import { log } from '../globals'
import { childText, parseXML } from '@hawtiosrc/util/xml'
import { MessageData } from '../debug/debug-service'
import { RouteDiagram } from '../route-diagram/RouteDiagram'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { MessageDrawer } from '../debug/MessageDrawer'

const MESSAGES_LIMIT = 500

export const Trace: React.FunctionComponent = () => {
  const { selectedNode, graphNodeData, setGraphNodeData, graphSelection, setGraphSelection, setShowStatistics } =
    useRouteDiagramContext()
  const [isReading, setIsReading] = useState(true)
  const [isTracing, setIsTracing] = useState(false)
  const messages = useRef<MessageData[]>([])
  const [message, setMessage] = useState<MessageData>()

  const [msgPanelExpanded, setMsgPanelExpanded] = React.useState(false)

  const setMessages = (newMessages: MessageData[]) => {
    messages.current = newMessages
  }

  const populateRouteMessages = useCallback((value: string, routeNode: MBeanNode) => {
    log.debug('Populating response', value)

    if (!value) return

    // lets parse the XML DOM here...
    const xmlDoc = parseXML(value)
    let allMessages = xmlDoc.getElementsByTagName('fabricTracerEventMessage')
    if (!allMessages || !allMessages.length) {
      // lets try find another element name
      allMessages = xmlDoc.getElementsByTagName('backlogTracerEventMessage')
    }

    if (allMessages.length === 0) return // nothing new to add

    const newMsgs = []
    for (let idx = allMessages.length - 1; idx >= 0; --idx) {
      const message = allMessages[idx]
      const routeId = childText(message, 'routeId')
      if (routeId !== routeNode.name) continue

      const msgData = ds.createMessageFromXml(message)
      if (!msgData) continue

      const toNode = childText(message, 'toNode')
      if (toNode) msgData.toNode = toNode

      newMsgs.push(msgData)
    }

    /*
     * Adds new messages to existing stack
     */
    const msgs = [...newMsgs, ...messages.current]

    /*
     * Remove messages when the array reaches its limit
     * and the user isn't looking at a message details
     */
    if (msgs.length > MESSAGES_LIMIT) msgs.splice(MESSAGES_LIMIT)

    // TODO
    // Do we still need tracer status??
    // keep state of the traced messages on tracerStatus
    // tracerStatus.messages = $scope.messages;

    setMessages(msgs)
  }, [])

  /**
   * Called when isTracing is changed to reload tracing properties
   */
  const tracingChanges = useCallback(
    async (isTracing: boolean) => {
      if (!selectedNode) return

      // Unregister old handles
      ts.unregisterAll()

      setIsTracing(isTracing)
      await ts.setTracing(selectedNode, isTracing)

      const tracingNode = ts.getTracingBean(selectedNode)
      if (!tracingNode) return

      if (isTracing) {
        /*
         * Sets up polling and live updating of tracing
         */
        ts.register(
          {
            type: 'exec',
            mbean: tracingNode.objectName as string,
            operation: 'dumpAllTracedMessagesAsXml()',
          },
          (response: IResponse) => {
            log.debug('Scheduler - Debug:', response.value)
            populateRouteMessages(response?.value as string, selectedNode)
          },
        )
      } else {
        setMessages([])
        ts.unregisterAll()
      }
    },
    [selectedNode, populateRouteMessages],
  )

  useEffect(() => {
    if (!selectedNode) return

    setIsReading(true)

    ts.isTracing(selectedNode).then((value: boolean) => {
      ts.getTracedMessages(selectedNode).then((response: string) => populateRouteMessages(response, selectedNode))

      tracingChanges(value)
      setIsReading(false)
    })
  }, [selectedNode, tracingChanges, populateRouteMessages])

  /*********************************
   *
   * Functions called by events handlers in toolbars
   *
   *********************************/
  const onTracing = async () => {
    tracingChanges(!isTracing)
  }

  const onRowSelected = (message: MessageData) => {
    let nodeId = message.toNode ? message.toNode : ''
    if (nodeId === selectedNode?.name) {
      nodeId = graphNodeData[0].cid
    }

    setMessage(message)
    setGraphSelection(nodeId)
  }

  const isRowSelected = (msg: MessageData): boolean => {
    return msg.uid === message?.uid
  }

  if (!selectedNode) {
    return (
      <Card>
        <CardBody>
          <Skeleton screenreaderText='Loading...' />
        </CardBody>
      </Card>
    )
  }

  if (isReading) {
    return (
      <Card>
        <CardBody>
          <Skeleton data-testid='loading' screenreaderText='Loading...' />
        </CardBody>
      </Card>
    )
  }

  /**
   * Button callback for opening and closing the message panel drawer
   */
  const onMessagePanelToggle = () => {
    setMsgPanelExpanded(!msgPanelExpanded)
  }

  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>Tracing</CardTitle>
        <CardActions>
          <Button
            variant='primary'
            isSmall={true}
            icon={!isTracing ? React.createElement(PlayIcon) : React.createElement(BanIcon)}
            onClick={onTracing}
            isDisabled={!ccs.canTrace(selectedNode)}
          >
            {!isTracing ? 'Start Tracing' : 'Stop Tracing'}
          </Button>
        </CardActions>
      </CardHeader>
      <CardBody>
        {!isTracing && (
          <React.Fragment>
            <Text className='noTracing' data-testid='no-tracing' component='p'>
              Tracing allows you to send messages to a route and then step through and see the messages flow through a
              route to aid debugging and to help diagnose issues.
            </Text>
            <Text className='noTracing' data-testid='no-tracing' component='p'>
              Once you start tracing, you can send messages to the input endpoints, then come back to this page and see
              the flow of messages through your route.
            </Text>
            <Text className='noTracing' data-testid='no-tracing' component='p'>
              As you click on the message table, you can see which node in the flow it came through; moving the
              selection up and down in the message table lets you see the flow of the message through the diagram.
            </Text>
          </React.Fragment>
        )}
        {isTracing && (
          <React.Fragment>
            <Panel id='route-diagram-tracing-view' isScrollable variant='raised'>
              <PanelMain>
                <PanelMainBody>
                  <RouteDiagramContext.Provider
                    value={{
                      selectedNode: selectedNode,
                      graphNodeData: graphNodeData,
                      setGraphNodeData: setGraphNodeData,
                      graphSelection: graphSelection,
                      setGraphSelection: setGraphSelection,
                      setShowStatistics: setShowStatistics,
                    }}
                  >
                    <RouteDiagram />
                  </RouteDiagramContext.Provider>
                </PanelMainBody>
              </PanelMain>
            </Panel>

            <MessageDrawer
              messages={message ? [message] : []}
              expanded={msgPanelExpanded}
              setExpanded={setMsgPanelExpanded}
            >
              <Panel id='route-message-table' isScrollable variant='raised'>
                <PanelHeader>Messages</PanelHeader>
                <Divider />
                <PanelMain>
                  <PanelMainBody>
                    <TableComposable aria-label='message table' variant='compact' isStriped>
                      <Thead>
                        <Tr>
                          <Th>ID</Th>
                          <Th>To Node</Th>
                        </Tr>
                      </Thead>
                      <Tbody isOddStriped>
                        {messages.current.map(message => (
                          <Tr
                            key={message.uid}
                            onRowClick={() => onRowSelected(message)}
                            isRowSelected={isRowSelected(message)}
                          >
                            <Td dataLabel='ID'>
                              <Button variant='link' isDisabled={!message} onClick={onMessagePanelToggle}>
                                {message.headers.breadcrumbId ? message.headers.breadcrumbId : message.uid}
                              </Button>
                            </Td>
                            <Td dataLabel='ToNode'>{message.toNode}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </TableComposable>
                  </PanelMainBody>
                </PanelMain>
              </Panel>
            </MessageDrawer>
          </React.Fragment>
        )}
      </CardBody>
    </Card>
  )
}

//     <div class="camel-trace-message-details" ng-if="message">
//       <button type="button" class="close" aria-hidden="true" ng-click="closeMessageDetails()">
//         <span class="pficon pficon-close"></span>
//       </button>
//       <ul class="pagination">
//         <li ng-class="{disabled: messageIndex === 0}">
//           <a href="#" title="First" ng-disabled="messageIndex === 0" ng-click="changeMessage(0)">
//             <span class="i fa fa-angle-double-left"></span>
//           </a>
//         </li>
//         <li ng-class="{disabled: messageIndex === 0}">
//           <a href="#" title="Previous" ng-disabled="messageIndex === 0" ng-click="changeMessage(messageIndex - 1)">
//             <span class="i fa fa-angle-left"></span>
//           </a>
//         </li>
//         <li ng-class="{disabled: messageIndex === messages.length - 1}">
//           <a href="#" title="Next" ng-disabled="messageIndex === messages.length - 1" ng-click="changeMessage(messageIndex + 1)">
//             <span class="i fa fa-angle-right"></span>
//           </a>
//         </li>
//         <li ng-class="{disabled: messageIndex === messages.length - 1}">
//           <a href="#" title="Last" ng-disabled="messageIndex === messages.length - 1" ng-click="changeMessage(messages.length - 1)">
//             <span class="i fa fa-angle-double-right"></span>
//           </a>
//         </li>
//       </ul>
//       <ul class="nav nav-tabs" ng-init="activeTab = 'headers'">
//         <li ng-class="{'active': activeTab === 'headers'}">
//           <a href="" ng-click="activeTab = 'headers'">Headers</a>
//         </li>
//         <li ng-class="{'active': activeTab === 'body'}">
//           <a href="" ng-click="activeTab = 'body'">Body</a>
//         </li>
//       </ul>
//       <div class="camel-trace-headers-contents" ng-show="activeTab === 'headers'">
//         <div ng-repeat="(key, value) in message.headers"><label>{{key}}:</label> {{value}}</div>
//       </div>
//       <div class="camel-trace-body-contents" ng-show="activeTab === 'body'">
//         <em class="camel-trace-no-body-text" ng-show="message.body === '[Body is null]'">No Body</em>
//         <pre ng-show="message.body !== '[Body is null]'">{{message.body}}</pre>
//       </div>
//     </div>
//   </div>
//
// </div>
