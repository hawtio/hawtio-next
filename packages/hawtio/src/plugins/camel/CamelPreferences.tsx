import { CardBody, Checkbox, Form, FormGroup, FormSection, TextInput } from '@patternfly/react-core'
import React, { useState } from 'react'
import { camelPreferencesService } from './camel-preferences-service'

export const CamelPreferences: React.FunctionComponent = () => (
  <CardBody>
    <Form isHorizontal>
      <CamelPreferencesForm />
    </Form>
  </CardBody>
)

const CamelPreferencesForm: React.FunctionComponent = () => {
  const [isHideOptionDocumentation, setIsHideOptionDocumentation] = useState(
    camelPreferencesService.loadIsHideOptionDocumentation(),
  )
  const [isHideDefaultOptionValues, setIsHideDefaultOptionValues] = useState(
    camelPreferencesService.loadIsHideDefaultOptionValues(),
  )
  const [isHideUnusedOptionValues, setIsHideUnusedOptionValues] = useState(
    camelPreferencesService.loadIsHideUnusedOptionValues(),
  )
  const [isIncludeTraceDebugStreams, setIsIncludeTraceDebugStreams] = useState(
    camelPreferencesService.loadIsIncludeTraceDebugStreams(),
  )
  const [maximumTraceDebugBodyLength, setMaximumTraceDebugBodyLength] = useState(
    camelPreferencesService.loadMaximumTraceDebugBodyLength(),
  )
  const [maximumLabelWidth, setMaximumLabelWidth] = useState(camelPreferencesService.loadMaximumLabelWidth())
  const [isIgnoreIDForLabel, setIsIgnoreIDForLabel] = useState(camelPreferencesService.loadIsIgnoreIDForLabel())
  const [isShowInflightCounter, setIsShowInflightCounter] = useState(camelPreferencesService.loadIsShowInflightCounter())
  const [routeMetricMaximumSeconds, setRouteMetricMaximumSeconds] = useState(
    camelPreferencesService.loadRouteMetricMaximumSeconds(),
  )

  const onBooleanValueUpdated = (
    value: boolean,
    updateFunction: (value: boolean) => void,
    saveToStorageFunction: (value: boolean) => void,
  ): void => {
    updateFunction(value)
    saveToStorageFunction(value)
  }

  const onNumberValueUpdated = (
    value: string,
    updateFunction: (value: number) => void,
    saveToStorageFunction: (value: number) => void,
  ): void => {
    const intValue = parseInt(value)

    if (!intValue) return

    updateFunction(intValue)
    saveToStorageFunction(intValue)
  }

  const onIsHideOptionDocumentationChange = (value: boolean) =>
    onBooleanValueUpdated(
      value,
      value => setIsHideOptionDocumentation(value),
      value => camelPreferencesService.setIsHideOptionDocumentation(value),
    )

  const onIsHideDefaultOptionValuesChange = (value: boolean) =>
    onBooleanValueUpdated(
      value,
      value => setIsHideDefaultOptionValues(value),
      value => camelPreferencesService.setIsHideDefaultOptionValues(value),
    )

  const onIsHideUnusedOptionValuesChange = (value: boolean) =>
    onBooleanValueUpdated(
      value,
      value => setIsHideUnusedOptionValues(value),
      value => camelPreferencesService.setIsHideUnusedOptionValues(value),
    )

  const onIsIncludeTraceDebugStreamsChange = (value: boolean) =>
    onBooleanValueUpdated(
      value,
      value => setIsIncludeTraceDebugStreams(value),
      value => camelPreferencesService.setIsIncludeTraceDebugStreams(value),
    )

  const onMaximumTraceDebugBodyLengthChange = (value: string) =>
    onNumberValueUpdated(
      value,
      value => setMaximumTraceDebugBodyLength(value),
      value => camelPreferencesService.setMaximumTraceDebugBodyLength(value),
    )

  const onMaximumLabelWidthChange = (value: string) =>
    onNumberValueUpdated(
      value,
      value => setMaximumLabelWidth(value),
      value => camelPreferencesService.setMaximumLabelWidth(value),
    )

  const onIsIgnoreIDForLabelChange = (value: boolean) =>
    onBooleanValueUpdated(
      value,
      value => setIsIgnoreIDForLabel(value),
      value => camelPreferencesService.setIsIgnoreIDForLabel(value),
    )

  const onIsShowInflightCounterChange = (value: boolean) =>
    onBooleanValueUpdated(
      value,
      value => setIsShowInflightCounter(value),
      value => camelPreferencesService.setIsShowInflightCounter(value),
    )

  const onRouteMetricMaximumSecondsChange = (value: string) =>
    onNumberValueUpdated(
      value,
      value => setRouteMetricMaximumSeconds(value),
      value => camelPreferencesService.setRouteMetricMaximumSeconds(value),
    )

  return (
    <FormSection>
      <FormGroup label='Hide option documentation' fieldId='camel-form-hide-option-documentation'>
        <Checkbox
          id='camel-form-hide-option-documentation'
          isChecked={isHideOptionDocumentation}
          onChange={(value, _) => onIsHideOptionDocumentationChange(value)}
        />
      </FormGroup>
      <FormGroup label='Hide default options values' fieldId='camel-form-hide-default-option-value'>
        <Checkbox
          id='camel-form-hide-default-option-value'
          isChecked={isHideDefaultOptionValues}
          onChange={(value, _) => onIsHideDefaultOptionValuesChange(value)}
        />
      </FormGroup>
      <FormGroup label='Hide unused options values' fieldId='camel-form-hide-unused-option-value'>
        <Checkbox
          id='camel-form-hide-unused-option-value'
          isChecked={isHideUnusedOptionValues}
          onChange={(value, _) => onIsHideUnusedOptionValuesChange(value)}
        />
      </FormGroup>
      <FormGroup label='Include trace / debug streams' fieldId='camel-form-include-trace-debug-streams'>
        <Checkbox
          id='camel-form-include-trace-debug-streams'
          isChecked={isIncludeTraceDebugStreams}
          onChange={(value, _) => onIsIncludeTraceDebugStreamsChange(value)}
        />
      </FormGroup>
      <FormGroup label='Maximum trace / debug body length' fieldId='camel-form-maximum-trace-debug-body-length'>
        <TextInput
          id='camel-form-maximum-trace-debug-body-length'
          type='number'
          value={maximumTraceDebugBodyLength}
          onChange={onMaximumTraceDebugBodyLengthChange}
        />
      </FormGroup>
      <FormGroup label='Maximum label width' fieldId='camel-form-maximum-label-width'>
        <TextInput
          id='camel-form-maximum-label-width'
          type='number'
          value={maximumLabelWidth}
          onChange={onMaximumLabelWidthChange}
        />
      </FormGroup>
      <FormGroup label='Ignore ID for label' fieldId='camel-form-ignore-id-for-label'>
        <Checkbox
          id='camel-form-ignore-id-for-label'
          isChecked={isIgnoreIDForLabel}
          onChange={(value, _) => onIsIgnoreIDForLabelChange(value)}
        />
      </FormGroup>
      <FormGroup label='Show inflight counter' fieldId='camel-show-inflight-counter'>
        <Checkbox
          id='camel-show-inflight-counter'
          isChecked={isShowInflightCounter}
          onChange={(value, _) => onIsShowInflightCounterChange(value)}
        />
      </FormGroup>
      <FormGroup label='Route metric maximum seconds' fieldId='camel-form-route-metric-maximum-seconds'>
        <TextInput
          id='camel-form-route-metric-maximum-seconds'
          type='number'
          value={routeMetricMaximumSeconds}
          onChange={onRouteMetricMaximumSecondsChange}
        />
      </FormGroup>
    </FormSection>
  )
}
