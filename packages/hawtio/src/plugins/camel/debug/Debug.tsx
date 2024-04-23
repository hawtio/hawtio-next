import { HawtioLoadingCard, MBeanNode } from '@hawtiosrc/plugins/shared'
import { compareArrays } from '@hawtiosrc/util/arrays'
import { isBlank } from '@hawtiosrc/util/strings'
import { childText, parseXML } from '@hawtiosrc/util/xml'
import {
  Button,
  PanelMainBody,
  Text,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  PanelHeader,
  PanelMain,
  Panel,
  Title,
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
import { Response } from 'jolokia.js'
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
import { ConditionalBreakpoint, MessageData, debugService } from './debug-service'

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
  const breakpointsRef = useRef<string[]>([])

  const applyBreakpoints = useCallback((response: unknown) => {
    if (!Array.isArray(response)) {
      breakpointsRef.current = []
      setBreakpoints([])
      return
    }

    const responseArr: string[] = response as string[]
    if (compareArrays(breakpointsRef.current, responseArr)) return

    const breakpoints = [...responseArr]
    breakpointsRef.current = breakpoints
    setBreakpoints(breakpoints)
  }, [])

  /**
   * Callback function that updates breakpoint counter and suspended
   * breakpoints from info transmitted by JMX nodes
   */
  const applyBreakpointCounter = useCallback(
    async (counter: number, routeNode: MBeanNode) => {
      if (!counter || counter === breakpointCounter) return

      setBreakpointCounter(counter)
      const suspendedBkps = await debugService.getSuspendedBreakpointIds(routeNode)
      log.debug('Debug - suspended breakpoints:', suspendedBkps)
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

      const msgs = await debugService.getTracedMessages(routeNode, suspendedBreakpoint)
      log.debug('Debug - messages as XML:', msgs)
      if (isBlank(msgs)) {
        log.warn('Debug - dumpTracedMessagesAsXml() returned no results!')
        return
      }
      const xmlDoc = parseXML(msgs)
      const allMessages = xmlDoc.getElementsByTagName('backlogTracerEventMessage')

      const messages: MessageData[] = []
      for (const message of Array.from(allMessages)) {
        const msgData = debugService.createMessageFromXml(message)
        if (!msgData) continue

        const toNode = childText(message, 'toNode')
        if (toNode) msgData.toNode = toNode

        messages.push(msgData)
      }
      log.debug('Debug - messages:', messages)

      setMessages(messages)
    },
    [breakpointCounter, setGraphSelection],
  )

  /**
   * Handler for the addition of a breakpoint
   */
  const handleAddBreakpoint = useCallback(
    async (contextNode: MBeanNode, breakpointId: string) => {
      const result = await debugService.addBreakpoint(contextNode, breakpointId)
      if (result) {
        const result = await debugService.getBreakpoints(contextNode)
        applyBreakpoints(result)
      }
    },
    [applyBreakpoints],
  )

  /**
   * Handle for the addition of a conditional breakpoint
   */
  const handleAddConditionalBreakpoint = async (contextNode: MBeanNode, breakpoint: ConditionalBreakpoint) => {
    const result = await debugService.addConditionalBreakpoint(contextNode, breakpoint)
    if (result) {
      const result = await debugService.getBreakpoints(contextNode)
      applyBreakpoints(result)
    }
    setIsConditionalBreakpointOpen(false)
  }

  /**
   * Handler for the removal of a breakpoint
   */
  const handleRemoveBreakpoint = useCallback(
    async (contextNode: MBeanNode, breakpointId: string) => {
      const result = await debugService.removeBreakpoint(contextNode, breakpointId)
      if (result) {
        const result = await debugService.getBreakpoints(contextNode)
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

      const bkps = await debugService.getBreakpoints(selectedNode)
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
      debugService.unregisterAll()

      const debugNode = debugService.getDebugBean(contextNode)
      if (!debugNode || !debugNode.objectName) return

      if (isDebugging) {
        const result = await debugService.getBreakpoints(contextNode)
        applyBreakpoints(result)

        const bc = await debugService.getBreakpointCounter(contextNode)
        applyBreakpointCounter(bc, contextNode)

        /*
         * Sets up polling and updating of counter when it changes
         */
        debugService.register(
          {
            type: 'exec',
            mbean: debugNode.objectName,
            operation: 'getDebugCounter',
          },
          (response: Response) => {
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

    debugService.isDebugging(selectedNode).then((value: boolean) => {
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

  if (!selectedNode) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

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
    log.debug('Debug -', isDebugging ? 'stop' : 'start', 'debugging')
    const result = await debugService.setDebugging(selectedNode, !isDebugging)
    setIsDebugging(result)
    reloadBreakpointChanges(result, selectedNode)
  }

  const onAddBreakpoint = () => {
    log.debug('Debug - add breakpoint')
    if (!graphSelection || isFirstGraphNode(graphSelection)) return
    handleAddBreakpoint(selectedNode, graphSelection)
  }

  const onRemoveBreakpoint = () => {
    log.debug('Debug - remove breakpoint')
    if (!hasSelectedBreakpoint()) return
    handleRemoveBreakpoint(selectedNode, graphSelection)
  }

  const onAddConditionalBreakpointToggle = () => {
    setIsConditionalBreakpointOpen(!isConditionalBreakpointOpen)
  }

  const onStep = async () => {
    log.debug('Debug - step')
    if (!suspendedBreakpoints || suspendedBreakpoints.length === 0) return

    const suspendedBreakpoint = suspendedBreakpoints[0]
    if (!suspendedBreakpoint) return

    const result = await debugService.stepBreakpoint(selectedNode, suspendedBreakpoint)
    log.debug('Debug - next breakpoint:', result)
    reloadBreakpointChanges(isDebugging, selectedNode)
  }

  const onResume = () => {
    log.debug('Debug - resume')
    debugService.resume(selectedNode)
    setMessages([])
    setSuspendedBreakpoints([])
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
  const debugPanelBreakpointsTab = () => (
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
                isSmall
                icon={<TimesCircleIcon />}
                onClick={() => handleRemoveBreakpoint(selectedNode, breakpoint)}
              ></Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </TableComposable>
  )

  const toolbarButtons = (
    <React.Fragment>
      {hasSelectedBreakpoint() && (
        <ToolbarItem spacer={{ default: 'spacerSm' }} title='Remove the breakpoint on the selected node'>
          <Button
            variant='secondary'
            isSmall
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
              isSmall
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
              isSmall
              icon={<PlusCircleIcon />}
              isDisabled={shouldDisableAddBreakpoint()}
              onClick={onAddConditionalBreakpointToggle}
            >
              Add conditional breakpoint
            </Button>
          </ToolbarItem>
        </React.Fragment>
      )}
      <ToolbarItem variant='separator' spacer={{ default: 'spacerSm' }} />
      <ToolbarItem spacer={{ default: 'spacerSm' }} title='Step into the next node'>
        <Button
          variant='secondary'
          isSmall
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
          isSmall
          icon={<PlayIcon />}
          isDisabled={suspendedBreakpoints.length === 0}
          onClick={onResume}
        >
          Resume
        </Button>
      </ToolbarItem>
      {suspendedBreakpoints.length > 0 && (
        <React.Fragment>
          <ToolbarItem variant='separator' spacer={{ default: 'spacerSm' }} />
          <ToolbarItem spacer={{ default: 'spacerSm' }} title='Show Debug Panel'>
            <Button
              variant='secondary'
              isSmall
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
    <Panel>
      <PanelHeader id='debug-header-container'>
        <Title headingLevel='h3'>Debug</Title>
        <Button
          variant='primary'
          isSmall
          icon={!isDebugging ? React.createElement(PlayIcon) : React.createElement(BanIcon)}
          onClick={onDebugging}
          isDisabled={!camelService.canGetBreakpoints(selectedNode)}
        >
          {!isDebugging ? 'Start Debugging' : 'Stop Debugging'}
        </Button>
      </PanelHeader>
      <PanelMain>
        <PanelMainBody>
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
        </PanelMainBody>
      </PanelMain>
    </Panel>
  )
}
