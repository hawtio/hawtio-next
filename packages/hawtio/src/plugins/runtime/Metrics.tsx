import { ChartBullet } from '@patternfly/react-charts'
import { Card, CardBody, CardHeader, Grid, GridItem, Title } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { runtimeService } from './runtime-service'
import { Metric } from './types'

export const Metrics: React.FunctionComponent = () => {
  const [metrics, setMetrics] = useState<Record<string, Metric>>({})

  useEffect(() => {
    const registerMetricsRequests = () => {
      let metricsRecord: Record<string, Metric> = {}
      runtimeService.registerMetrics(metric => {
        metricsRecord = { ...metricsRecord, [metric.name]: metric }
        setMetrics(metricsRecord)
      })
    }

    const readMetrics = async () => {
      const metricsList = await runtimeService.loadMetrics()
      let metricsRecord: Record<string, Metric> = {}
      metricsList.forEach(metric => (metricsRecord = { ...metricsRecord, [metric.name]: metric }))
      setMetrics(metricsRecord)
    }

    readMetrics()
    registerMetricsRequests()
    return () => runtimeService.unregisterAll()
  }, [])

  return (
    <Grid hasGutter span={6}>
      <GridItem>
        <Card>
          <CardHeader>
            <Title headingLevel='h2'>System</Title>
          </CardHeader>
          <CardBody>
            {Object.values(metrics)
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
            <Title headingLevel='h2'>JVM</Title>
          </CardHeader>

          <CardBody>
            {Object.values(metrics)
              .filter(m => m.type === 'JVM')
              .map((metric, index) => {
                return (
                  <div key={index}>
                    {metric.name} :
                    <span>
                      {metric.value} {metric.unit ?? ''}
                      {metric.available && 'of' + metric.available + ' ' + (metric.unit ?? '')}
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
