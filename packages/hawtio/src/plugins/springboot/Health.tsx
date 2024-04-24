import React, { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Flex, FlexItem, Grid, GridItem, Title } from '@patternfly/react-core'
import { springbootService } from './springboot-service'
import { HealthComponentDetail, HealthData } from './types'
import { TableComposable, Tbody, Td, Tr } from '@patternfly/react-table'
import { humanizeLabels } from '@hawtiosrc/util/strings'
import { ChartDonutUtilization } from '@patternfly/react-charts'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons'

const SPAN_6_COMPONENTS = ['diskSpace', 'camelHealth', 'camel']

const ComponentDetails: React.FunctionComponent<{ componentDetails: HealthComponentDetail[] }> = ({
  componentDetails,
}) => {
  return (
    <TableComposable variant='compact' borders={false}>
      <Tbody style={{ fontSize: 'xx-small' }}>
        {componentDetails.map((detail, index) => {
          return (
            <Tr key={'row' + detail.key + index}>
              <Td key={detail.key + index}>{humanizeLabels(detail.key)}:</Td>
              <Td>
                {typeof detail.value === 'string' ? detail.value : <ComponentDetails componentDetails={detail.value} />}
              </Td>
            </Tr>
          )
        })}
      </Tbody>
    </TableComposable>
  )
}
const HealthStatusIcon: React.FunctionComponent<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'UP':
      return <CheckCircleIcon color={'green'} />
    case 'DOWN':
      return <ExclamationCircleIcon color={'red'} />
    case 'OUT_OF_SERVICE':
      return <ExclamationTriangleIcon color={'orange'} />
    case 'UNKNOWN':
      return <QuestionCircleIcon />
    default:
      return <InfoCircleIcon color={'blue'} />
  }
}

const DiskComponentDetails: React.FunctionComponent<{ componentDetails: HealthComponentDetail[] }> = ({
  componentDetails,
}) => {
  const total = Number.parseInt(componentDetails.find(k => k.key === 'total')!.value as string)
  const free = Number.parseInt(componentDetails.find(k => k.key === 'free')!.value as string)
  const usedPercentage = Math.round(((total - free) * 100) / total)

  return (
    <Grid height={'100%'}>
      <GridItem span={6}>
        <ComponentDetails componentDetails={componentDetails} />
      </GridItem>
      <GridItem span={6}>
        <ChartDonutUtilization
          ariaDesc='Storage capacity'
          ariaTitle='Donut utilization chart example'
          constrainToVisibleArea
          data={{ x: 'Used Space', y: usedPercentage }}
          name='chart2'
          subTitle='of available space'
          title={`${usedPercentage}% used`}
          thresholds={[{ value: 90 }]}
          width={300}
        />
      </GridItem>
    </Grid>
  )
}
export const Health: React.FunctionComponent = () => {
  const [healthData, setHealthData] = useState<HealthData>()

  useEffect(() => {
    springbootService.loadHealth().then(healthData => {
      setHealthData(healthData)
    })
  }, [])

  if (!healthData) {
    return null
  }

  return (
    <Grid hasGutter span={4}>
      <GridItem span={12}>
        <Card>
          <CardHeader>
            <Flex>
              <HealthStatusIcon status={healthData?.status} />
              <Title headingLevel='h3'>
                <span>Overall status: {healthData?.status}</span>
              </Title>
            </Flex>
          </CardHeader>
        </Card>
      </GridItem>
      {healthData?.components
        .sort((a, b) => {
          if (SPAN_6_COMPONENTS.includes(a.name)) return -1
          else if (SPAN_6_COMPONENTS.includes(b.name)) return 1
          else return a.name.localeCompare(b.name)
        })
        .map(component => {
          const span = SPAN_6_COMPONENTS.includes(component.name) ? 6 : 4
          return (
            <GridItem span={span} key={component.name}>
              <Card isFullHeight>
                <CardHeader>
                  <Title headingLevel='h3'>{humanizeLabels(component.name!)}</Title>
                </CardHeader>
                <CardBody style={{ overflow: 'auto' }}>
                  <Flex>
                    <FlexItem>
                      <HealthStatusIcon status={component.status} />
                    </FlexItem>
                    <FlexItem>Status: {component.status}</FlexItem>
                    {component.details &&
                      (component.name === 'diskSpace' ? (
                        <DiskComponentDetails componentDetails={component.details} />
                      ) : (
                        <ComponentDetails componentDetails={component.details} />
                      ))}
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>
          )
        })}
    </Grid>
  )
}
