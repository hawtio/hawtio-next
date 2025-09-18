import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { CodeEditor, CodeEditorControl, Language } from '@patternfly/react-code-editor'
import React, { useContext, useEffect, useState } from 'react'
import { log } from '../globals'
import { SaveIcon } from '@patternfly/react-icons/dist/esm/icons/save-icon.js'
import { isRouteNode, isRoutesFolder } from '@hawtiosrc/plugins/camel/camel-service'
import { routesService } from './routes-service'
import { eventService } from '@hawtiosrc/core'
import { Alert, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core'

import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'

loader.config({ monaco })

export const Source: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [xmlSource, setXmlSource] = useState('')
  const [isUpdateEnabled, setIsUpdateEnabled] = useState(false)
  const [isWarningVisible, setIsWarningVisible] = useState(isUpdateEnabled)
  const [codeChanged, setCodeChanged] = useState(false)
  const isRoute: boolean = isRouteNode(selectedNode!) && !isRoutesFolder(selectedNode!)

  useEffect(() => {
    if (!selectedNode) return

    const xml = selectedNode.getMetadata('xml')

    if (isRoute) {
      routesService.isRouteUpdateEnabled(selectedNode).then(enabled => {
        setIsUpdateEnabled(enabled)
        setIsWarningVisible(enabled)
      })
    }

    if (xml) {
      setXmlSource(xml)
    } else {
      log.warn('Source - Unable to fetch XML from', selectedNode)
    }
  }, [isRoute, selectedNode])

  //SelectedNode should be always selected when this view is routed
  if (!selectedNode) {
    return
  }

  const onCodeChange = (code: string) => {
    setCodeChanged(code !== xmlSource)
  }

  const onSaveClick = (code: string) => {
    if (isRoute && code !== xmlSource) {
      try {
        routesService.saveRoute(selectedNode, code)
        setCodeChanged(false)
        eventService.notify({
          type: 'success',
          message: 'Route was updated',
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        eventService.notify({ type: 'danger', message: 'Failed to save route' })
      }
    }
  }

  const saveButton = (
    <CodeEditorControl
      icon={<SaveIcon />}
      isVisible={isUpdateEnabled}
      aria-label='Save the changes'
      tooltipProps={{ content: codeChanged ? 'Save the changes' : 'Saved' }}
      isDisabled={!codeChanged}
      onClick={onSaveClick}
    />
  )

  return (
    <div style={{ height: '100%' }}>
      {isUpdateEnabled && isWarningVisible && (
        <Alert
          isInline
          variant={AlertVariant['warning']}
          title={'The source update of the route is enabled'}
          actionClose={<AlertActionCloseButton title={'Close warning'} onClose={() => setIsWarningVisible(false)} />}
        />
      )}

      <CodeEditor
        isReadOnly={!isUpdateEnabled}
        customControls={saveButton}
        code={xmlSource}
        language={Language.xml}
        height={'75vh'}
        onCodeChange={onCodeChange}
      />
    </div>
  )
}
