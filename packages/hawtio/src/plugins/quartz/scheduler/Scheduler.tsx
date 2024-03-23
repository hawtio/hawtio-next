import { AttributeValues, HawtioLoadingCard } from '@hawtiosrc/plugins/shared'
import { attributeService } from '@hawtiosrc/plugins/shared/attributes/attribute-service'
import {
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardHeaderMain,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Icon,
  Stack,
  Switch,
} from '@patternfly/react-core'
import { CheckCircleIcon, PauseCircleIcon } from '@patternfly/react-icons'
import React, { useContext, useEffect, useState } from 'react'
import { QuartzContext } from '../context'
import { log } from '../globals'
import { QUARTZ_OPERATIONS, quartzService } from '../quartz-service'
import './Scheduler.css'

export const Scheduler: React.FunctionComponent = () => {
  const { selectedNode } = useContext(QuartzContext)
  const [attributes, setAttributes] = useState<AttributeValues>({})
  const [isReading, setIsReading] = useState(true)
  const [reload, setReload] = useState(false)

  useEffect(() => {
    if (!selectedNode || !selectedNode.objectName) {
      return
    }

    setIsReading(true)
    const { objectName } = selectedNode
    attributeService.readWithCallback(objectName, attrs => {
      setAttributes(attrs)
      setIsReading(false)
    })

    attributeService.register({ type: 'read', mbean: objectName }, response => {
      log.debug('Scheduler - Attributes:', response.value)
      setAttributes(response.value as AttributeValues)
    })

    return () => attributeService.unregisterAll()
  }, [selectedNode])

  // When forcing reload
  useEffect(() => {
    if (!selectedNode || !selectedNode.objectName || !reload) {
      return
    }

    log.debug('Reload scheduler attributes')

    setIsReading(true)
    const { objectName } = selectedNode
    attributeService.readWithCallback(objectName, attrs => {
      setAttributes(attrs)
      setIsReading(false)
    })

    setReload(false)
  }, [selectedNode, reload])

  if (!selectedNode || !selectedNode.objectName) {
    return null
  }

  if (isReading) {
    return <HawtioLoadingCard />
  }

  const { name, objectName } = selectedNode

  const canStartPauseScheduler = () => {
    return selectedNode.hasInvokeRights(QUARTZ_OPERATIONS.start, QUARTZ_OPERATIONS.standby)
  }

  const handleSchedulerSwitchChange = async (start: boolean) => {
    await (start ? quartzService.start(name, objectName) : quartzService.pause(name, objectName))
    setReload(true)
  }

  const canUpdateSampleStatisticsEnabled = () => {
    // TODO: currently using the same criteria as start/pause scheduler, as it requires writing to an attribute
    return selectedNode.hasInvokeRights(QUARTZ_OPERATIONS.start, QUARTZ_OPERATIONS.standby)
  }

  const handleSampledStatisticsSwitchChange = async (value: boolean) => {
    await quartzService.updateSampleStatisticsEnabled(name, objectName, value)
    setReload(true)
  }

  const scheduler = {
    // scheduler
    started: attributes['Started'] as boolean,
    name: attributes['SchedulerName'] as string,
    instance: attributes['SchedulerInstanceId'] as string,
    version: attributes['Version'] as string,
    jobStoreClassName: attributes['JobStoreClassName'] as string,
    threadPoolClassName: attributes['ThreadPoolClassName'] as string,
    threadPoolSize: attributes['ThreadPoolSize'] as number,
    // sampled statistics
    sampledStatisticsEnabled: attributes['SampledStatisticsEnabled'] as boolean,
    jobsCompleted: attributes['JobsCompletedMostRecentSample'] as number,
    jobsExecuted: attributes['JobsExecutedMostRecentSample'] as number,
    jobsScheduled: attributes['JobsScheduledMostRecentSample'] as number,
  }

  return (
    <Stack id='quartz-scheduler' hasGutter>
      <Card id='quartz-scheduler-main'>
        <CardHeader>
          <CardHeaderMain>
            {scheduler.started ? (
              <Icon status='success'>
                <CheckCircleIcon />
              </Icon>
            ) : (
              <Icon>
                <PauseCircleIcon />
              </Icon>
            )}
          </CardHeaderMain>
          <CardTitle>Scheduler</CardTitle>
          <CardActions>
            <Switch
              id='quartz-scheduler-main-switch'
              label='Started'
              labelOff='Paused'
              isChecked={scheduler.started}
              isDisabled={!canStartPauseScheduler()}
              onChange={handleSchedulerSwitchChange}
              isReversed
            />
          </CardActions>
        </CardHeader>
        <CardBody>
          <DescriptionList isCompact isHorizontal>
            <DescriptionListGroup>
              <DescriptionListTerm>Name</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.name}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Instance</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.instance}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Version</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.version}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Job store class name</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.jobStoreClassName}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Thread pool class name</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.threadPoolClassName}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Thread pool size</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.threadPoolSize}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>
      <Card id='quartz-scheduler-statistics'>
        <CardHeader>
          <CardHeaderMain>
            {scheduler.sampledStatisticsEnabled ? (
              <Icon status='success'>
                <CheckCircleIcon />
              </Icon>
            ) : (
              <Icon>
                <PauseCircleIcon />
              </Icon>
            )}
          </CardHeaderMain>
          <CardTitle>Sampled Statistics (Most Recent Samples)</CardTitle>
          <CardActions>
            <Switch
              id='quartz-scheduler-statistics-switch'
              label='Enabled'
              labelOff='Disabled'
              isChecked={scheduler.sampledStatisticsEnabled}
              isDisabled={!canUpdateSampleStatisticsEnabled()}
              onChange={handleSampledStatisticsSwitchChange}
              isReversed
            />
          </CardActions>
        </CardHeader>
        <CardBody>
          <DescriptionList isCompact isHorizontal>
            <DescriptionListGroup>
              <DescriptionListTerm>Jobs completed</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.jobsCompleted}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Jobs executed</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.jobsExecuted}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Jobs scheduled</DescriptionListTerm>
              <DescriptionListDescription>{scheduler.jobsScheduled}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>
    </Stack>
  )
}
