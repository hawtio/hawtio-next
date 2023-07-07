import { TooltipHelpIcon } from '@hawtiosrc/ui/icons'
import { CardBody, Checkbox, Form, FormGroup, FormSection, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import './CamelPreferences.css'
import { CamelOptions, camelPreferencesService } from './camel-preferences-service'

export const CamelPreferences: React.FunctionComponent = () => (
  <CardBody>
    <Form isHorizontal>
      <CamelPreferencesForm />
    </Form>
  </CardBody>
)

const CamelPreferencesForm: React.FunctionComponent = () => {
  const [camelPreferences, setCamelPreferences] = useState(camelPreferencesService.loadCamelPreferences())

  const updatePreferences = (value: boolean | number, key: keyof CamelOptions): void => {
    const updatedPreferences = { ...camelPreferences, ...{ [key]: value } }

    camelPreferencesService.saveCamelPreferences(updatedPreferences)
    setCamelPreferences(updatedPreferences)
  }

  const updateNumberValueFor = (key: keyof CamelOptions): ((value: string) => void) => {
    //Returning an arrow function to reduce boilerplate
    return (value: string) => {
      const intValue = parseInt(value)

      if (!intValue) return

      updatePreferences(intValue, key)
    }
  }

  const updateCheckboxValueFor = (key: keyof CamelOptions): ((value: boolean, _: React.FormEvent) => void) => {
    //Utility function generator to reduce boilerplate
    return (value: boolean, _: React.FormEvent) => {
      updatePreferences(value, key)
    }
  }

  return (
    <FormSection title='Camel' titleElement='h2'>
      <FormGroup
        hasNoPaddingTop
        label='Hide option documentation'
        fieldId='camel-form-hide-option-documentation'
        labelIcon={
          <TooltipHelpIcon tooltip='Whether to hide documentation in the properties view and Camel route editor' />
        }
      >
        <Checkbox
          id='camel-form-hide-option-documentation'
          isChecked={camelPreferences.isHideOptionDocumentation}
          onChange={updateCheckboxValueFor('isHideOptionDocumentation')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Hide default options values'
        fieldId='camel-form-hide-default-option-value'
        labelIcon={
          <TooltipHelpIcon tooltip='Whether to hide options that are using a default value in the properties view' />
        }
      >
        <Checkbox
          id='camel-form-hide-default-option-value'
          isChecked={camelPreferences.isHideDefaultOptionValues}
          onChange={updateCheckboxValueFor('isHideDefaultOptionValues')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Hide unused options values'
        fieldId='camel-form-hide-unused-option-value'
        labelIcon={<TooltipHelpIcon tooltip='Whether to hide unused/empty options in the properties view' />}
      >
        <Checkbox
          id='camel-form-hide-unused-option-value'
          isChecked={camelPreferences.isHideUnusedOptionValues}
          onChange={updateCheckboxValueFor('isHideUnusedOptionValues')}
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
          id='camel-form-include-trace-debug-streams'
          isChecked={camelPreferences.isIncludeTraceDebugStreams}
          onChange={updateCheckboxValueFor('isIncludeTraceDebugStreams')}
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
          value={camelPreferences.maximumTraceDebugBodyLength}
          onChange={updateNumberValueFor('maximumTraceDebugBodyLength')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Maximum label width'
        fieldId='camel-form-maximum-label-width'
        labelIcon={<TooltipHelpIcon tooltip='The maximum length of a label in Camel diagrams before it is clipped' />}
      >
        <TextInput
          id='camel-form-maximum-label-width'
          type='number'
          value={camelPreferences.maximumLabelWidth}
          onChange={updateNumberValueFor('maximumLabelWidth')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Ignore ID for label'
        fieldId='camel-form-ignore-id-for-label'
        labelIcon={
          <TooltipHelpIcon tooltip='If enabled then we will ignore the ID value when viewing a pattern in a Camel diagram; otherwise we will use the ID value as the label (the tooltip will show the actual detail' />
        }
      >
        <Checkbox
          id='camel-form-ignore-id-for-label'
          isChecked={camelPreferences.isIgnoreIDForLabel}
          onChange={updateCheckboxValueFor('isIgnoreIDForLabel')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Show inflight counter'
        fieldId='camel-show-inflight-counter'
        labelIcon={<TooltipHelpIcon tooltip='Whether to show inflight counter in route diagram' />}
      >
        <Checkbox
          id='camel-show-inflight-counter'
          isChecked={camelPreferences.isShowInflightCounter}
          onChange={updateCheckboxValueFor('isShowInflightCounter')}
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
          id='camel-form-route-metric-maximum-seconds'
          type='number'
          value={camelPreferences.routeMetricMaximumSeconds}
          onChange={updateNumberValueFor('routeMetricMaximumSeconds')}
        />
      </FormGroup>
    </FormSection>
  )
}
