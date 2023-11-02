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
        <FormSection>
          <FormGroup
            hasNoPaddingTop
            label='Hide option documentation'
            fieldId='camel-form-hide-option-documentation'
            labelIcon={
              <TooltipHelpIcon tooltip='Whether to hide documentation in the properties view and Camel route editor' />
            }
          >
            <Checkbox
              id='camel-form-hide-option-documentation-input'
              isChecked={options.hideOptionDocumentation}
              onChange={updateCheckboxValueFor('hideOptionDocumentation')}
            />
          </FormGroup>
          <FormGroup
            hasNoPaddingTop
            label='Hide default options values'
            fieldId='camel-form-hide-default-option-values'
            labelIcon={
              <TooltipHelpIcon tooltip='Whether to hide options that are using a default value in the properties view' />
            }
          >
            <Checkbox
              id='camel-form-hide-default-option-values-input'
              isChecked={options.hideOptionDefaultValue}
              onChange={updateCheckboxValueFor('hideOptionDefaultValue')}
            />
          </FormGroup>
          <FormGroup
            hasNoPaddingTop
            label='Hide unused options values'
            fieldId='camel-form-hide-unused-option-values'
            labelIcon={<TooltipHelpIcon tooltip='Whether to hide unused/empty options in the properties view' />}
          >
            <Checkbox
              id='camel-form-hide-unused-option-values-input'
              isChecked={options.hideOptionUnusedValue}
              onChange={updateCheckboxValueFor('hideOptionUnusedValue')}
            />
          </FormGroup>
          <FormGroup
            hasNoPaddingTop
            label='Include trace / debug streams'
            fieldId='camel-form-include-trace-debug-streams'
            labelIcon={
              <TooltipHelpIcon tooltip='Whether to include stream based message body when using the tracer and debugger' />
            }
          >
            <Checkbox
              id='camel-form-include-trace-debug-streams-input'
              isChecked={options.traceOrDebugIncludeStreams}
              onChange={updateCheckboxValueFor('traceOrDebugIncludeStreams')}
            />
          </FormGroup>
          <FormGroup
            hasNoPaddingTop
            label='Maximum trace / debug body length'
            fieldId='camel-form-maximum-trace-debug-body-length'
            labelIcon={
              <TooltipHelpIcon tooltip='The maximum length of the body before its clipped when using the tracer and debugger' />
            }
          >
            <TextInput
              id='camel-form-maximum-trace-debug-body-length'
              type='number'
              value={options.maximumTraceOrDebugBodyLength}
              onChange={updateNumberValueFor('maximumTraceOrDebugBodyLength')}
            />
          </FormGroup>
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
          <FormGroup
            hasNoPaddingTop
            label='Route metric maximum seconds'
            fieldId='camel-form-route-metric-maximum-seconds'
            labelIcon={
              <TooltipHelpIcon tooltip='The maximum value in seconds used by the route metrics duration and histogram charts' />
            }
          >
            <TextInput
              id='camel-form-route-metric-maximum-seconds-input'
              type='number'
              value={options.routeMetricMaximumSeconds}
              onChange={updateNumberValueFor('routeMetricMaximumSeconds')}
            />
          </FormGroup>
        </FormSection>
      </Form>
    </CardBody>
  )
}
