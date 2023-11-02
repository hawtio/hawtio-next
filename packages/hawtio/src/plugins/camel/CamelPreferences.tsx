import { TooltipHelpIcon } from '@hawtiosrc/ui/icons'
import { CardBody, Checkbox, Form, FormGroup, FormSection, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import './CamelPreferences.css'
import { CamelOptions, camelPreferencesService } from './camel-preferences-service'

export const CamelPreferences: React.FunctionComponent = () => {
  const [options, setOptions] = useState(camelPreferencesService.loadOptions())

  const updateOptions = (key: keyof CamelOptions, value: boolean | number) => {
    const updated = { ...options, ...{ [key]: value } }
    camelPreferencesService.saveOptions(updated)
    setOptions(updated)
  }

  const updateNumberValueFor = (key: keyof CamelOptions) => (value: string) => {
    const intValue = parseInt(value)
    if (!intValue) return
    updateOptions(key, intValue)
  }

  const updateCheckboxValueFor = (key: keyof CamelOptions) => (value: boolean) => {
    updateOptions(key, value)
  }

  return (
    <CardBody>
      <Form isHorizontal>
        <FormSection title='Route diagram' titleElement='h2'>
          <FormGroup
            hasNoPaddingTop
            label='Maximum label width'
            fieldId='camel-form-maximum-label-width'
            labelIcon={
              <TooltipHelpIcon tooltip='The maximum length of a label in Camel diagrams before it is clipped' />
            }
          >
            <TextInput
              id='camel-form-maximum-label-width-input'
              type='number'
              value={options.maximumLabelWidth}
              onChange={updateNumberValueFor('maximumLabelWidth')}
            />
          </FormGroup>
          <FormGroup
            hasNoPaddingTop
            label='Ignore ID for label'
            fieldId='camel-form-ignore-id-for-label'
            labelIcon={
              <TooltipHelpIcon tooltip='If enabled then we will ignore the ID value when viewing a pattern in a Camel diagram; otherwise we will use the ID value as the label (the tooltip will show the actual detail)' />
            }
          >
            <Checkbox
              id='camel-form-ignore-id-for-label-input'
              isChecked={options.ignoreIdForLabel}
              onChange={updateCheckboxValueFor('ignoreIdForLabel')}
            />
          </FormGroup>
          <FormGroup
            hasNoPaddingTop
            label='Show inflight counter'
            fieldId='camel-show-inflight-counter'
            labelIcon={<TooltipHelpIcon tooltip='Whether to show inflight counter in route diagram' />}
          >
            <Checkbox
              id='camel-show-inflight-counter-input'
              isChecked={options.showInflightCounter}
              onChange={updateCheckboxValueFor('showInflightCounter')}
            />
          </FormGroup>
        </FormSection>
        <FormSection title='Trace / debug' titleElement='h2'>
          <FormGroup
            hasNoPaddingTop
            label='Include streams'
            fieldId='camel-form-include-streams'
            labelIcon={
              <TooltipHelpIcon tooltip='Whether to include stream based message body when using the tracer and debugger' />
            }
          >
            <Checkbox
              id='camel-form-include-streams-input'
              isChecked={options.traceOrDebugIncludeStreams}
              onChange={updateCheckboxValueFor('traceOrDebugIncludeStreams')}
            />
          </FormGroup>
          <FormGroup
            hasNoPaddingTop
            label='Maximum body length'
            fieldId='camel-form-maximum-body-length'
            labelIcon={
              <TooltipHelpIcon tooltip='The maximum length of the body before its clipped when using the tracer and debugger' />
            }
          >
            <TextInput
              id='camel-form-maximum-body-length-input'
              type='number'
              value={options.maximumTraceOrDebugBodyLength}
              onChange={updateNumberValueFor('maximumTraceOrDebugBodyLength')}
            />
          </FormGroup>
        </FormSection>
      </Form>
    </CardBody>
  )
}
