import { PluginNodeSelectionContext } from '@hawtiosrc/plugins/context'
import { AttributeValues } from '@hawtiosrc/plugins/shared/jolokia-service'
import { MBeanNode } from '@hawtiosrc/plugins/shared/tree'
import { isNumber } from '@hawtiosrc/util/objects'
import { ChartArea, ChartAxis, Chart as ChartDraw, ChartVoronoiContainer } from '@patternfly/react-charts'
import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  PageSection,
  PageSectionVariants,
  Text,
} from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { IResponse } from 'jolokia.js'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { HawtioEmptyCard } from '../HawtioEmptyCard'
import { HawtioLoadingCard } from '../HawtioLoadingCard'
import { attributeService } from '../attributes/attribute-service'
import { WatchableAttributesForm } from './WatchableAttributesForm'

type MBeanChartData = {
  [name: string]: MBeanChartDataEntriesTime[]
}

type MBeanChartDataEntriesTime = {
  name: string
  time: number
  data: AttributeValues
}

export type AttributesToWatch = {
  [name: string]: {
    [attributeName: string]: boolean
  }
}

export const Chart: React.FunctionComponent = () => {
  const { selectedNode } = useContext(PluginNodeSelectionContext)
  const [chartData, setChartData] = useState<MBeanChartData>({})
  const attributesToWatch = useRef<AttributesToWatch>({})
  const [initialTime, setInitialTime] = useState<number>(-1)
  const [isWatchableAttributesModalOpen, setIsWatchableAttributesModalOpen] = useState<boolean>(false)

  // Two ways to go about this: either I query for the attributes, pick up the ones with number value
  // and create the job for those, or just fetch all the data and filter the unwatched, non-numeric values
  // The base version uses the second so I went for that.

  function updateNumericAttributesToWatch(
    currentWatchedAttributes: { [attributeName: string]: boolean },
    newData: AttributeValues,
  ) {
    // Shouldn't be a costly operation plus this way I ensure that if any attributes come undefined on the first call
    // they will actually be added.

    const numberAttributes = Object.entries(newData)
      .filter(([_, value]) => isNumber(value))
      .map(([name, _]) => name)

    //Now we set it if it's not already set
    numberAttributes.forEach(name => {
      if (currentWatchedAttributes[name] === undefined) {
        currentWatchedAttributes[name] = true
      }
    })
  }

  function updateNode(mbeanObjectName: string, data: MBeanChartDataEntriesTime): void {
    if (!chartData[mbeanObjectName]) chartData[mbeanObjectName] = []

    // Don't add repeated responses to avoid duplicate points
    if (!chartData[mbeanObjectName]?.find(value => value.time === data.time)) {
      chartData[mbeanObjectName]?.push(data)
    }

    if (!attributesToWatch.current[data.name]) {
      attributesToWatch.current[data.name] = {}
    }

    const current = attributesToWatch.current[data.name] ?? {}
    updateNumericAttributesToWatch(current, data.data)

    setChartData({ ...chartData })
    attributesToWatch.current = { ...attributesToWatch.current }
  }

  function updateChartData(mbeanObjectName: string, data: MBeanChartDataEntriesTime): void {
    if (!selectedNode) return
    else updateNode(mbeanObjectName, data)
  }

  async function setJobForSpecificNode(
    node: MBeanNode | null,
    updateCallback: (mbeanObjectName: string, data: MBeanChartDataEntriesTime) => void,
  ): Promise<void> {
    if (!node || !node?.objectName) return

    attributeService.register({ type: 'read', mbean: node.objectName }, (response: IResponse) => {
      updateCallback(node.name, {
        name: node.name,
        time: response.timestamp,
        data: response.value as AttributeValues,
      })
    })
  }

  async function setJobsForNode(node: MBeanNode): Promise<void> {
    if (!node) return
    ;[node, ...node.getChildren()].forEach(async node => await setJobForSpecificNode(node, updateChartData))
  }

  useEffect(() => {
    if (!selectedNode) {
      return
    }

    if (initialTime === -1) {
      setInitialTime(new Date().getTime())
    }

    setJobsForNode(selectedNode)

    return () => {
      attributeService.unregisterAll()
      setChartData({})
      attributesToWatch.current = {}
      setInitialTime(-1)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode])

  if (
    !selectedNode ||
    !(selectedNode.mbean || (selectedNode.getChildren() && selectedNode.getChildren().some(child => child.mbean)))
  ) {
    return null
  }

  if (Object.values(chartData).length === 0) {
    // Data is still loading
    return <HawtioLoadingCard />
  }

  if (Object.values(attributesToWatch.current).flatMap(node => Object.values(node)).length === 0) {
    // Data has been loaded but there are no numeric attributes.
    return <HawtioEmptyCard message='There are no chartable data in the MBean or its children.' />
  }

  if (
    !Object.values(attributesToWatch.current)
      .flatMap(node => Object.values(node))
      .some(isWatched => isWatched)
  ) {
    // No currently watched attributes.
    return (
      <PageSection variant={PageSectionVariants.light} isFilled>
        <WatchableAttributesForm
          isOpen={isWatchableAttributesModalOpen}
          onClose={(isClosed: boolean) => {
            setIsWatchableAttributesModalOpen(isClosed)
          }}
          attributesToWatch={attributesToWatch.current}
          onAttributesToWatchUpdate={newAttributes => (attributesToWatch.current = newAttributes)}
        />
        <Card>
          <CardHeader>
            <CardActions>
              <Button onClick={() => setIsWatchableAttributesModalOpen(true)}>Edit watches</Button>
            </CardActions>
          </CardHeader>
          <CardBody>
            <Text component='p'>
              <InfoCircleIcon /> There are currently no watches. Please click on the button to select any Chart
            </Text>
          </CardBody>
        </Card>
      </PageSection>
    )
  }

  const AttributeChart = ({ name, data }: { name: string; data: { name: string; x: number; y: number }[] }) => (
    <div style={{ height: '140px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ width: '20%', overflow: 'hidden', fontSize: 10, paddingRight: 10, flexGrow: 1, flexShrink: 0 }}>
        {name}
      </div>
      <div style={{ width: '80%', maxWidth: '80%', height: '140px', flexGrow: 0, flexShrink: 0 }}>
        <ChartDraw
          ariaTitle={name}
          containerComponent={
            <ChartVoronoiContainer labels={({ datum }) => `${datum.name}: ${datum.y}`} constrainToVisibleArea />
          }
          height={50}
          name={name}
          key={name}
          padding={{ left: 50, right: 50 }}
          width={700}
        >
          <ChartArea data={data} />
          <ChartAxis
            fixLabelOverlap
            orientation='bottom'
            width={700}
            tickFormat={time => {
              const date = new Date(time * 1000)
              return `${date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()}:${
                date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds()
              }`
            }}
          />
        </ChartDraw>
      </div>
    </div>
  )

  return (
    <React.Fragment>
      <WatchableAttributesForm
        isOpen={isWatchableAttributesModalOpen}
        onClose={(isClosed: boolean) => {
          setIsWatchableAttributesModalOpen(isClosed)
        }}
        attributesToWatch={attributesToWatch.current}
        onAttributesToWatchUpdate={newAttributes => (attributesToWatch.current = newAttributes)}
      />
      <Card isFullHeight>
        <CardHeader>
          <CardActions>
            <Button onClick={() => setIsWatchableAttributesModalOpen(true)}>Edit watches</Button>
          </CardActions>
        </CardHeader>
        <CardBody>
          {Object.entries(attributesToWatch.current)
            .flatMap(([name, attributes]) =>
              Object.entries(attributes)
                .filter(([_, isShown]) => isShown)
                .map(([attributeName, _]) => [name, attributeName]),
            )
            .map(
              ([name, attributeName]) =>
                name &&
                attributeName && (
                  <AttributeChart
                    key={`${name} ${attributeName}`}
                    name={`${name} ${attributeName}`}
                    data={[
                      ...(chartData[name] ?? []).map(value => ({
                        name: new Date(value.time * 1000).toLocaleTimeString(),
                        x: value.time,
                        y: (value.data[attributeName] as number) ?? 0,
                      })),
                    ]}
                  />
                ),
            )}
        </CardBody>
      </Card>
    </React.Fragment>
  )
}
