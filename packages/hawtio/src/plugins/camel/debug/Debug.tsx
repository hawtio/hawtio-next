import { HawtioEmptyCard, HawtioLoadingCard, MBeanNode } from '@hawtiosrc/plugins/shared'
import { compareArrays } from '@hawtiosrc/util/arrays'
import { childText, parseXML } from '@hawtiosrc/util/xml'
import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardTitle,
  Text,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import {
  BanIcon,
  BarsIcon,
  ExclamationCircleIcon,
  LongArrowAltDownIcon,
  MinusIcon,
  PlayIcon,
  PlusCircleIcon,
  PlusIcon,
  TimesCircleIcon,
} from '@patternfly/react-icons'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import { IResponse } from 'jolokia.js'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as camelService from '../camel-service'
import { CamelContext } from '../context'
import { log } from '../globals'
import { RouteDiagram } from '../route-diagram/RouteDiagram'
import { Annotation, RouteDiagramContext, useRouteDiagramContext } from '../route-diagram/context'
import { CamelNodeData } from '../route-diagram/visualization-service'
import { ConditionalBreakpointModal } from './ConditionalBreakpointModel'
import './Debug.css'
import { MessageDrawer } from './MessageDrawer'
import { ConditionalBreakpoint, MessageData, debugService as ds } from './debug-service'

export const Debug: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const {
    graphNodeData,
    setGraphNodeData,
    graphSelection,
    setGraphSelection,
    setShowStatistics,
    doubleClickAction,
    setDoubleClickAction,
    annotations,
    setAnnotations,
  } = useRouteDiagramContext()
  const [isReading, setIsReading] = useState(true)
  const [isDebugging, setIsDebugging] = useState(false)
  const [breakpoints, setBreakpoints] = useState<string[]>([])
  const [suspendedBreakpoints, setSuspendedBreakpoints] = useState<string[]>([])
  const [breakpointCounter, setBreakpointCounter] = useState(0)
  const [isConditionalBreakpointOpen, setIsConditionalBreakpointOpen] = useState(false)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [debugPanelExpanded, setDebugPanelExpanded] = React.useState(false)
  const bkpsRef = useRef<string[]>([])

  const applyBreakpoints = useCallback((response: unknown) => {
    if (!Array.isArray(response)) {
      bkpsRef.current = []
      setBreakpoints([])
      return
    }

    const responseArr: string[] = response as string[]
    if (compareArrays(bkpsRef.current, responseArr)) return

    const bkps = [...responseArr]
    bkpsRef.current = bkps
    setBreakpoints(bkps)
  }, [])

  /**
   * Callback function that updates breakpoint counter and suspended
   * breakpoints from info transmitted by JMX nodes
   */
  const applyBreakpointCounter = useCallback(
    async (counter: number, routeNode: MBeanNode) => {
      if (!counter || counter === breakpointCounter) return

      setBreakpointCounter(counter)
      const suspendedBkps = await ds.getSuspendedBreakpointIds(routeNode)

      setSuspendedBreakpoints(suspendedBkps)
      if (suspendedBkps.length === 0) {
        setDebugPanelExpanded(false)
        return
      }
      const suspendedBreakpoint = suspendedBkps[0]
      if (!suspendedBreakpoint) {
        return
      }

      setGraphSelection(suspendedBreakpoint)

      const msgs = await ds.getTracedMessages(routeNode, suspendedBreakpoint)
      log.debug('onMessage ->', msgs)

      if (!msgs || msgs.length === 0) {
        log.warn('WARNING: dumpTracedMessagesAsXml() returned no results!')
        return
      }

      const xmlDoc = parseXML(msgs)
      let allMessages = xmlDoc.getElementsByTagName('fabricTracerEventMessage')
      if (!allMessages || !allMessages.length) {
        // lets try find another element name
        allMessages = xmlDoc.getElementsByTagName('backlogTracerEventMessage')
      }

      const messages: MessageData[] = []
      for (const message of allMessages) {
        const msgData = ds.createMessageFromXml(message)
        if (!msgData) continue

        const toNode = childText(message, 'toNode')
        if (toNode) msgData.toNode = toNode

        messages.push(msgData)
      }

      setMessages(messages)
    },
    [breakpointCounter, setGraphSelection],
  )

  /**
   * Handler for the addition of a breakpoint
   */
  const handleAddBreakpoint = useCallback(
    async (contextNode: MBeanNode, breakpointId: string) => {
      const result = await ds.addBreakpoint(contextNode, breakpointId)
      if (result) {
        const result = await ds.getBreakpoints(contextNode)
        applyBreakpoints(result)
      }
    },
    [applyBreakpoints],
  )

  /**
   * Handle for the addition of a conditional breakpoint
   */
  const handleAddConditionalBreakpoint = async (contextNode: MBeanNode, breakpoint: ConditionalBreakpoint) => {
    const result = await ds.addConditionalBreakpoint(contextNode, breakpoint)
    if (result) {
      const result = await ds.getBreakpoints(contextNode)
      applyBreakpoints(result)
    }
    setIsConditionalBreakpointOpen(false)
  }

  /**
   * Handler for the removal of a breakpoint
   */
  const handleRemoveBreakpoint = useCallback(
    async (contextNode: MBeanNode, breakpointId: string) => {
      const result = await ds.removeBreakpoint(contextNode, breakpointId)
      if (result) {
        const result = await ds.getBreakpoints(contextNode)
        applyBreakpoints(result)
      }
    },
    [applyBreakpoints],
  )

  /**
   * Action executed when node in diagram is clicked
   */
  const doubleClickNodeAction = useCallback((): ((nodeData: CamelNodeData) => void) => {
    return async (nodeData: CamelNodeData) => {
      if (!selectedNode) return

      if (nodeData.routeIdx === 0) {
        camelService.notifyError('Cannot breakpoint on the first node in the route')
        return
      }

      const bkps = await ds.getBreakpoints(selectedNode)
      if (bkps.includes(nodeData.cid)) {
        handleRemoveBreakpoint(selectedNode, nodeData.cid)
      } else handleAddBreakpoint(selectedNode, nodeData.cid)
    }
  }, [selectedNode, handleAddBreakpoint, handleRemoveBreakpoint])

  const createAnnotation = useCallback((breakpointId: string, bkps: string[], suspendedBkps: string[]): Annotation => {
    const element: JSX.Element = (
      <div className='breakpoint-symbol'>
        {suspendedBkps.includes(breakpointId) && <LongArrowAltDownIcon />}
        {bkps.includes(breakpointId) && <ExclamationCircleIcon />}
      </div>
    )

    return {
      nodeId: breakpointId,
      element: element,
    }
  }, [])

  /**
   * Called when isDebugging is changed to reload breakpoint properties
   */
  const reloadBreakpointChanges = useCallback(
    async (isDebugging: boolean, contextNode: MBeanNode) => {
      // Unregister old handles
      ds.unregisterAll()

      const debugNode = ds.getDebugBean(contextNode)
      if (!debugNode || !debugNode.objectName) return

      if (isDebugging) {
        const result = await ds.getBreakpoints(contextNode)
        applyBreakpoints(result)

        const bc = await ds.getBreakpointCounter(contextNode)
        applyBreakpointCounter(bc, contextNode)

        /*
         * Sets up polling and updating of counter when it changes
         */
        ds.register(
          {
            type: 'exec',
            mbean: debugNode.objectName,
            operation: 'getDebugCounter',
          },
          (response: IResponse) => {
            log.debug('Scheduler - Debug:', response.value)
            applyBreakpointCounter(response?.value as number, contextNode)
          },
        )
      } else {
        setBreakpoints([])
        setSuspendedBreakpoints([])
        setBreakpointCounter(0)
      }
    },
    [applyBreakpointCounter, applyBreakpoints],
  )

  useEffect(() => {
    if (!selectedNode) return

    setIsReading(true)

    // Turn off statistics display in diagram view
    setShowStatistics(false)
    setDoubleClickAction(doubleClickNodeAction)

    ds.isDebugging(selectedNode).then((value: boolean) => {
      setIsDebugging(value)
      reloadBreakpointChanges(value, selectedNode)
      setIsReading(false)
    })
  }, [selectedNode, doubleClickNodeAction, setDoubleClickAction, setShowStatistics, reloadBreakpointChanges])

  useEffect(() => {
    const annotations: Annotation[] = []
    for (const breakpointId of breakpoints) {
      annotations.push(createAnnotation(breakpointId, breakpoints, suspendedBreakpoints))
    }

    for (const breakpointId of suspendedBreakpoints) {
      annotations.push(createAnnotation(breakpointId, breakpoints, suspendedBreakpoints))
    }

    setAnnotations(annotations)
  }, [breakpoints, suspendedBreakpoints, createAnnotation, setAnnotations])

  /**
   * Is the given breakpoint id, the first node in the route
   */
  const isFirstGraphNode = (breakpointId: string): boolean => {
    const firstNodeData = graphNodeData?.at(0)
    if (!firstNodeData) return false

    return firstNodeData.cid === breakpointId
  }

  /**
   * Does the breakpoints array contain the given node id
   */
  const isBreakpointSet = (nodeId: string): boolean => {
    if (!nodeId || nodeId.length === 0 || breakpoints.length === 0) return false
    return breakpoints.indexOf(nodeId) !== -1
  }

  /*********************************
   *
   * Function for determining if toolbars buttons should displayed
   *
   *********************************/
  const hasSelectedBreakpoint = (): boolean => {
    if (!graphSelection) return false

    return isBreakpointSet(graphSelection)
  }

  /*********************************
   *
   * Function for determining if toolbar buttons should be disabled
   *
   *********************************/
  const shouldDisableAddBreakpoint = () => {
    return !graphSelection ? true : isFirstGraphNode(graphSelection)
  }

  /*********************************
   *
   * Functions called by events handlers in toolbar
   *
   *********************************/
  const onDebugging = async () => {
    if (!selectedNode) return

    const isDb = await ds.setDebugging(selectedNode, !isDebugging)
    setIsDebugging(isDb)
    reloadBreakpointChanges(isDb, selectedNode)
  }

  const onAddBreakpoint = () => {
    if (!selectedNode) return

    if (!graphSelection || isFirstGraphNode(graphSelection)) return
    handleAddBreakpoint(selectedNode, graphSelection)
  }

  const onRemoveBreakpoint = () => {
    if (!selectedNode) return

    if (!hasSelectedBreakpoint()) return
    handleRemoveBreakpoint(selectedNode, graphSelection)
  }

  const onAddConditionalBreakpointToggle = () => {
    setIsConditionalBreakpointOpen(!isConditionalBreakpointOpen)
  }

  const onStep = async () => {
    if (!selectedNode) return

    if (!suspendedBreakpoints || suspendedBreakpoints.length === 0) return

    const suspendedBreakpoint = suspendedBreakpoints[0]
    if (!suspendedBreakpoint) return

    await ds.stepBreakpoint(selectedNode, suspendedBreakpoint)
  }

  const onResume = () => {
    if (!selectedNode) return

    ds.resume(selectedNode)
    setMessages([])
    setSuspendedBreakpoints([])
  }

  if (!selectedNode) {
    return <HawtioEmptyCard message='No selection has been made.' />
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  /**
   * Button callback for opening and closing the message panel drawer
   */
  const onDebugPanelToggle = () => {
    setDebugPanelExpanded(!debugPanelExpanded)
  }

  /**
   * Extra panel to add to the drawer slide-in
   */
  const debugPanelBreakpointsTab = (): JSX.Element => {
    return (
      <TableComposable key='breakpoints' aria-label='Breakpoints table' variant='compact'>
        <Thead>
          <Tr>
            <Th>Breakpoint</Th>
            <Th>Remove</Th>
          </Tr>
        </Thead>
        <Tbody>
          {breakpoints.map(breakpoint => (
            <Tr key={breakpoint}>
              <Td dataLabel='Breakpoint'>{breakpoint}</Td>
              <Td dataLabel='Remove'>
                <Button
                  variant='plain'
                  isSmall={true}
                  icon={<TimesCircleIcon />}
                  onClick={() => handleRemoveBreakpoint(selectedNode, breakpoint)}
                ></Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    )
  }

  const toolbarButtons = (
    <React.Fragment>
      {hasSelectedBreakpoint() && (
        <ToolbarItem spacer={{ default: 'spacerSm' }} title='Remove the breakpoint on the selected node'>
          <Button
            variant='secondary'
            isSmall={true}
            icon={<MinusIcon />}
            isDisabled={!graphSelection}
            onClick={onRemoveBreakpoint}
          >
            Remove breakpoint
          </Button>
        </ToolbarItem>
      )}
      {!hasSelectedBreakpoint() && (
        <React.Fragment>
          <ToolbarItem spacer={{ default: 'spacerSm' }} title='Add a breakpoint on the selected node'>
            <Button
              variant='secondary'
              isSmall={true}
              icon={<PlusIcon />}
              isDisabled={shouldDisableAddBreakpoint()}
              onClick={onAddBreakpoint}
            >
              Add breakpoint
            </Button>
          </ToolbarItem>
          <ToolbarItem spacer={{ default: 'spacerSm' }} title='Add a conditional breakpoint on the selected node'>
            <Button
              variant='secondary'
              isSmall={true}
              icon={<PlusCircleIcon />}
              isDisabled={shouldDisableAddBreakpoint()}
              onClick={onAddConditionalBreakpointToggle}
            >
              Add conditional breakpoint
            </Button>
          </ToolbarItem>
        </React.Fragment>
      )}
      <ToolbarItem variant='separator' spacer={{ default: 'spacerSm' }}></ToolbarItem>
      <ToolbarItem spacer={{ default: 'spacerSm' }} title='Step into the next node'>
        <Button
          variant='secondary'
          isSmall={true}
          icon={<LongArrowAltDownIcon />}
          isDisabled={suspendedBreakpoints.length === 0}
          onClick={onStep}
        >
          Step
        </Button>
      </ToolbarItem>
      <ToolbarItem spacer={{ default: 'spacerSm' }} title='Resume running'>
        <Button
          variant='secondary'
          isSmall={true}
          icon={<PlayIcon />}
          isDisabled={suspendedBreakpoints.length === 0}
          onClick={onResume}
        >
          Resume
        </Button>
      </ToolbarItem>
      {suspendedBreakpoints.length > 0 && (
        <React.Fragment>
          <ToolbarItem variant='separator' spacer={{ default: 'spacerSm' }}></ToolbarItem>
          <ToolbarItem spacer={{ default: 'spacerSm' }} title='Show Debug Panel'>
            <Button
              variant='secondary'
              isSmall={true}
              icon={<BarsIcon />}
              isDisabled={suspendedBreakpoints.length === 0}
              onClick={onDebugPanelToggle}
            >
              Details
            </Button>
          </ToolbarItem>
        </React.Fragment>
      )}
    </React.Fragment>
  )

  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>Debug</CardTitle>
        <CardActions>
          <Button
            variant='primary'
            isSmall={true}
            icon={!isDebugging ? React.createElement(PlayIcon) : React.createElement(BanIcon)}
            onClick={onDebugging}
            isDisabled={!camelService.canGetBreakpoints(selectedNode)}
          >
            {!isDebugging ? 'Start Debugging' : 'Stop Debugging'}
          </Button>
        </CardActions>
      </CardHeader>
      <CardBody>
        {!isDebugging && (
          <Text data-testid='no-debugging' component='p'>
            Debugging allows you to step through camel routes to diagnose issues.
          </Text>
        )}
        {isDebugging && (
          <React.Fragment>
            <Toolbar id='toolbar-items'>
              <ToolbarContent>{toolbarButtons}</ToolbarContent>
            </Toolbar>

            <MessageDrawer
              messages={messages}
              expanded={debugPanelExpanded}
              setExpanded={setDebugPanelExpanded}
              extraPanel={{
                id: 'debug-panel-tab-breakpoints',
                label: 'Breakpoints',
                panelFn: debugPanelBreakpointsTab,
              }}
            >
              <div id='route-diagram-breakpoint-view'>
                <RouteDiagramContext.Provider
                  value={{
                    graphNodeData,
                    setGraphNodeData,
                    graphSelection,
                    setGraphSelection,
                    setShowStatistics,
                    doubleClickAction,
                    setDoubleClickAction,
                    annotations,
                    setAnnotations,
                  }}
                >
                  <RouteDiagram />
                </RouteDiagramContext.Provider>
              </div>
            </MessageDrawer>
          </React.Fragment>
        )}
        <ConditionalBreakpointModal
          selectedNode={selectedNode}
          selection={graphSelection}
          isConditionalBreakpointOpen={isConditionalBreakpointOpen}
          onAddConditionalBreakpointToggle={onAddConditionalBreakpointToggle}
          addConditionalBreakpoint={handleAddConditionalBreakpoint}
        />
      </CardBody>
    </Card>
  )
}
