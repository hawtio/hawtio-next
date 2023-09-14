import { Card, CardBody, CardHeader, Grid, GridItem, Title } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { getMetrics, REFRESH_INTERVAL } from '@hawtiosrc/plugins/runtime/runtime-service'
import { Metric } from '@hawtiosrc/plugins/runtime/types'
import { ChartBullet } from '@patternfly/react-charts'

export const Metrics: React.FunctionComponent = () => {
  const [metrics, setMetrics] = useState<Metric[]>([])

  useEffect(() => {
    let timeoutHandle: NodeJS.Timeout
    const readMetrics = async () => {
      const metrics = await getMetrics()
      setMetrics(metrics)

      timeoutHandle = setTimeout(readMetrics, REFRESH_INTERVAL)
    }

    readMetrics()
    return () => timeoutHandle && clearTimeout(timeoutHandle)
  }, [])

  return (
    <Grid hasGutter span={6}>
      <GridItem>
        <Card>
          <CardHeader>
            {' '}
            <Title headingLevel='h3'>System</Title>
          </CardHeader>
          <CardBody>
            {' '}
            {metrics
              .filter(m => m.type === 'System')
              .map((metric, index) => {
                return (
                  <div key={index}>
                    {metric.name} :
                    <span>
                      {metric.value} {metric.unit ?? ''}
                      {metric.available && ' of ' + metric.available + ' ' + (metric.unit ?? '')}
                    </span>
                    {metric.chart && (
                      <ChartBullet
                        ariaDesc={metric.unit}
                        ariaTitle={metric.value + ' ' + metric.unit}
                        comparativeWarningMeasureData={[{ name: 'Warning', y: 0.9 * (metric.available as number) }]}
                        constrainToVisibleArea
                        maxDomain={{ y: metric.available as number }}
                        name={metric.name}
                        primarySegmentedMeasureData={[{ name: metric.unit, y: metric.value }]}
                        width={600}
                      />
                    )}
                  </div>
                )
              })}
          </CardBody>
        </Card>
      </GridItem>
      <GridItem>
        <Card>
          <CardHeader>
            {' '}
            <Title headingLevel='h3'>JVM</Title>
          </CardHeader>

          <CardBody>
            {metrics
              .filter(m => m.type === 'JVM')
              .map((metric, index) => {
                return (
                  <div key={index}>
                    {metric.name} :{' '}
                    <span>
                      {metric.value} {metric.unit ?? ''}{' '}
                      {metric.available && 'of' + metric.available + ' ' + metric.unit}
                    </span>
                  </div>
                )
              })}
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  )
}
