import { TooltipHelpIcon } from '@hawtiosrc/ui/icons'
import { CardBody, Checkbox, Form, FormGroup, FormGroupProps, FormSection, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import { LogsOptions, logsService } from './logs-service'

export const LogsPreferences: React.FunctionComponent = () => {
  const [options, setOptions] = useState(logsService.loadOptions())
  const [logCacheSizeValidated, setLogCacheSizeValidated] = useState<FormGroupProps['validated']>('default')
  const [logCacheSizeInvalidText, setLogCacheSizeInvalidText] = useState('')
  const [logBatchSizeValidated, setLogBatchSizeValidated] = useState<FormGroupProps['validated']>('default')
  const [logBatchSizeInvalidText, setLogBatchSizeInvalidText] = useState('')

  const updateOptions = (updated: Partial<LogsOptions>) => {
    logsService.saveOptions(updated)
    setOptions({ ...options, ...updated })
  }

  const onSortAscendingChanged = (sortAscending: boolean) => {
    updateOptions({ sortAscending })
  }

  const onAutoScrollChanged = (autoScroll: boolean) => {
    updateOptions({ autoScroll })
  }

  const onLogCacheSizeChanged = (cacheSize: string) => {
    const intValue = parseInt(cacheSize)
    if (!intValue) {
      setLogCacheSizeValidated('error')
      setLogCacheSizeInvalidText('Must be a number')
      return
    }
    if (intValue <= 0) {
      setLogCacheSizeValidated('error')
      setLogCacheSizeInvalidText('Must be greater than 0')
      return
    }

    updateOptions({ cacheSize: intValue })
    setLogCacheSizeValidated('success')
  }

  const onLogBatchSizeChanged = (batchSize: string) => {
    const intValue = parseInt(batchSize)
    if (!intValue) {
      setLogBatchSizeValidated('error')
      setLogBatchSizeInvalidText('Must be a number')
      return
    }
    if (intValue <= 0) {
      setLogBatchSizeValidated('error')
      setLogBatchSizeInvalidText('Must be greater than 0')
      return
    }

    updateOptions({ batchSize: intValue })
    setLogCacheSizeValidated('success')
  }

  return (
    <CardBody>
      <Form isHorizontal>
        <FormSection>
          <FormGroup
            label='Sort ascending'
            fieldId='logs-form-sort-ascending'
            labelIcon={<TooltipHelpIcon tooltip='Sort log entries by timestamp ascending' />}
          >
            <Checkbox
              id='logs-form-sort-ascending-input'
              isChecked={options.sortAscending}
              onChange={onSortAscendingChanged}
            />
          </FormGroup>
          <FormGroup
            label='Auto scroll'
            fieldId='logs-form-auto-scroll'
            labelIcon={<TooltipHelpIcon tooltip='Automatically scroll when new log entries are added' />}
          >
            <Checkbox id='logs-form-auto-scroll-input' isChecked={options.autoScroll} onChange={onAutoScrollChanged} />
          </FormGroup>
          <FormGroup
            label='Log cache size'
            fieldId='logs-form-log-cache-size'
            validated={logCacheSizeValidated}
            helperTextInvalid={logCacheSizeInvalidText}
            labelIcon={<TooltipHelpIcon tooltip='The number of log messages to keep in the browser' />}
          >
            <TextInput
              id='logs-form-log-cache-size-input'
              type='number'
              value={options.cacheSize}
              validated={logCacheSizeValidated}
              onChange={onLogCacheSizeChanged}
            />
          </FormGroup>
          <FormGroup
            label='Log batch size'
            fieldId='logs-form-log-batch-size'
            validated={logBatchSizeValidated}
            helperTextInvalid={logBatchSizeInvalidText}
            labelIcon={
              <TooltipHelpIcon tooltip='The maximum number of log messages to retrieve when loading new log lines' />
            }
          >
            <TextInput
              id='logs-form-log-batch-size-input'
              type='number'
              value={options.batchSize}
              validated={logBatchSizeValidated}
              onChange={onLogBatchSizeChanged}
            />
          </FormGroup>
        </FormSection>
      </Form>
    </CardBody>
  )
}
