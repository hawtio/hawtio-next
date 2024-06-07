import { JmxOptions, jmxPreferencesService } from '@hawtiosrc/plugins/shared/jmx-preferences-service'
import { TooltipHelpIcon } from '@hawtiosrc/ui/icons'
import { CardBody, Checkbox, Form, FormGroup } from '@patternfly/react-core'
import React, { useState } from 'react'

export const JmxPreferences: React.FunctionComponent = () => {
  const [options, setOptions] = useState(jmxPreferencesService.loadOptions())

  const updateOptions = (updated: Partial<JmxOptions>) => {
    jmxPreferencesService.saveOptions(updated)
    setOptions({ ...options, ...updated })
  }

  return (
    <CardBody>
      <Form isHorizontal>
        <FormGroup
          label='Serialize long to string'
          fieldId='serialize-long-to-string'
          labelIcon={<TooltipHelpIcon tooltip='Serialize long values in the JSON responses from Jolokia to string' />}
        >
          <Checkbox
            id='serialize-long-to-string-input'
            isChecked={options.serializeLong}
            onChange={(_event, serializeLong) => updateOptions({ serializeLong })}
          />
        </FormGroup>
      </Form>
    </CardBody>
  )
}
