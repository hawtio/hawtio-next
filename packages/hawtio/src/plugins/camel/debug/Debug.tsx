import React, { useCallback, useEffect, useState } from 'react'
import {
  Card,
  CardBody,
  Text,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button,
  CardTitle,
  CardHeader,
  CardActions,
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
import { ConditionalBreakpoint, debugService as ds, MessageData } from './debug-service'
import * as ccs from '../camel-content-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { isArray } from '@hawtiosrc/util/objects'
import { RouteDiagram } from '../route-diagram/RouteDiagram'
import './Debug.css'
import { Annotation, RouteDiagramContext, useRouteDiagramContext } from '../route-diagram/route-diagram-context'
import { CamelNodeData } from '../route-diagram/visualization-service'
import { IResponse } from 'jolokia.js'
import { log } from '../globals'
import { childText, parseXML } from '@hawtiosrc/util/xml'
import { MessageDrawer } from './MessageDrawer'
import { ConditionalBreakpointModal } from './ConditionalBreakpointModel'

export const Debug: React.FunctionComponent = () => {
  const {
    selectedNode,
    graphNodeData,
    setGraphNodeData,
    graphSelection,
    setGraphSelection,
    showStatistics,
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
  const [breakpointCounter, setBreakpointCounter] = useState<number>(0)
  const [isConditionalBreakpointOpen, setIsConditionalBreakpointOpen] = useState<boolean>(false)
  const [messages, setMessages] = useState<MessageData[]>([])

  const [debugPanelExpanded, setDebugPanelExpanded] = React.useState(false)

  const applyBreakpoints = useCallback((response: unknown) => {
    const bkps: string[] = []
    if (isArray(response)) {
      bkps.push(...(response as string[]))
    }
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

      setGraphSelection(suspendedBkps[0])

      const msgs = await ds.getTracedMessages(routeNode, suspendedBkps[0])
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
        const msgData = ds.createMessageFromXml(message) as MessageData
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
      if (nodeData.routeIdx === 0) {
        ccs.notifyError('Cannot breakpoint on the first node in the route')
        return
      }

      const bkps = await ds.getBreakpoints(selectedNode as MBeanNode)
      if (bkps.includes(nodeData.cid)) {
        handleRemoveBreakpoint(selectedNode as MBeanNode, nodeData.cid)
      } else handleAddBreakpoint(selectedNode as MBeanNode, nodeData.cid)
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

  useEffect(() => {
    if (!selectedNode) return

    setIsReading(true)

    // Turn off statistics display in diagram view
    setShowStatistics(false)
    setDoubleClickAction(doubleClickNodeAction)

    ds.isDebugging(selectedNode as MBeanNode).then((value: boolean) => {
      setIsDebugging(value)
      setIsReading(false)
    })
  }, [selectedNode, doubleClickNodeAction, setDoubleClickAction, setShowStatistics])

  /**
   * Called when isDebugging is changed to reload breakpoint properties
   */
  const reloadBreakpointChanges = useCallback(
    async (isDebugging: boolean) => {
      // Unregister old handles
      ds.unregisterAll()

      const debugNode = ds.getDebugBean(selectedNode as MBeanNode)
      if (!debugNode) return

      if (isDebugging) {
        const result = await ds.getBreakpoints(selectedNode as MBeanNode)
        applyBreakpoints(result)

        const bc = await ds.getBreakpointCounter(selectedNode as MBeanNode)
        applyBreakpointCounter(bc, selectedNode as MBeanNode)

        /*
         * Sets up polling and updating of counter when it changes
         */
        ds.register(
          {
            type: 'exec',
            mbean: debugNode.objectName as string,
            operation: 'getDebugCounter',
          },
          (response: IResponse) => {
            log.debug('Scheduler - Debug:', response.value)
            applyBreakpointCounter(response?.value as number, selectedNode as MBeanNode)
          },
        )
      } else {
        setBreakpoints([])
        setSuspendedBreakpoints([])
        setBreakpointCounter(0)
      }
    },
    [selectedNode, applyBreakpointCounter, applyBreakpoints],
  )

  /**
   * When isDebugging is updated, reload all the breakpoint properties
   */
  useEffect(() => {
    reloadBreakpointChanges(isDebugging)
  }, [isDebugging, reloadBreakpointChanges])

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
    return isBreakpointSet(graphSelection as string)
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
    const isDb = await ds.setDebugging(selectedNode as MBeanNode, !isDebugging)
    setIsDebugging(isDb)
  }

  const onAddBreakpoint = () => {
    if (!graphSelection || isFirstGraphNode(graphSelection)) return
    handleAddBreakpoint(selectedNode as MBeanNode, graphSelection)
  }

  const onRemoveBreakpoint = () => {
    if (!hasSelectedBreakpoint()) return
    handleRemoveBreakpoint(selectedNode as MBeanNode, graphSelection)
  }

  const onAddConditionalBreakpointToggle = () => {
    setIsConditionalBreakpointOpen(!isConditionalBreakpointOpen)
  }

  const onStep = async () => {
    if (!suspendedBreakpoints || suspendedBreakpoints.length === 0) return

    await ds.stepBreakpoint(selectedNode as MBeanNode, suspendedBreakpoints[0])
  }

  const onResume = () => {
    ds.resume(selectedNode as MBeanNode)
    setMessages([])
    setSuspendedBreakpoints([])
  }

  if (!selectedNode) {
    return (
      <Card>
        <CardBody>
          <Text component='p'>No selection has been made</Text>
        </CardBody>
      </Card>
    )
  }

  if (isReading) {
    return (
      <Card>
        <CardBody>
          <Text data-testid='loading' component='p'>
            Loading...
          </Text>
        </CardBody>
      </Card>
    )
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
                  onClick={() => handleRemoveBreakpoint(selectedNode as MBeanNode, breakpoint)}
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

  const ctx: RouteDiagramContext = {
    selectedNode: selectedNode,
    graphNodeData: graphNodeData,
    setGraphNodeData: setGraphNodeData,
    graphSelection: graphSelection,
    setGraphSelection: setGraphSelection,
    showStatistics: showStatistics,
    setShowStatistics: setShowStatistics,
    doubleClickAction: doubleClickAction,
    setDoubleClickAction: setDoubleClickAction,
    annotations: annotations,
    setAnnotations: setAnnotations,
  }

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
            isDisabled={!ccs.canGetBreakpoints(selectedNode)}
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
                <RouteDiagramContext.Provider value={ctx}>
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
