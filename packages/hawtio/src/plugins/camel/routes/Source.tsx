import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import React, { useContext, useEffect, useState } from 'react'
import { log } from '../globals'

export const Source: React.FunctionComponent = () => {
  const { selectedNode } = useContext(CamelContext)
  const [xmlSource, setXmlSource] = useState('')

  useEffect(() => {
    const xml = selectedNode?.getProperty('xml')
    if (xml) {
      setXmlSource(xml)
    } else {
      log.warn('Source - Unable to fetch XML from', selectedNode)
    }
  }, [selectedNode])

  return <CodeEditor isReadOnly code={xmlSource} language={Language.xml} height='500px' />
}
