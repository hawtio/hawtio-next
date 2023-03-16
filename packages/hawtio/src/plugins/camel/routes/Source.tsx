import React, { useContext, useEffect, useState } from 'react'
import { jolokiaService } from '@hawtiosrc/plugins'
import { CodeEditor, Language } from '@patternfly/react-code-editor'
import { isRoutesFolder } from '@hawtiosrc/plugins/camel/camel-content-service'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { MBeanNode } from '@hawtiosrc/plugins/shared'

export const findParentContext = (child: MBeanNode, root: MBeanNode): MBeanNode | undefined => {
  let found: MBeanNode | undefined
  root.children?.every(mb => {
    if (mb.id === child.id) {
      found = root
      return false
    } else found = findParentContext(child, mb)
    return true
  })

  return found
}
export const Source: React.FunctionComponent = () => {
  const { selectedNode, tree } = useContext(CamelContext)
  const [xmlSource, setxmlSource] = useState<string>('')

  useEffect(() => {
    if (selectedNode) {
      if (isRoutesFolder(selectedNode)) {
        const contextMbean = findParentContext(selectedNode, tree.getTree()[0])

        if (contextMbean?.objectName) {
          jolokiaService.execute(contextMbean.objectName, 'dumpRoutesAsXml()').then(xml => {
            setxmlSource(xml as string)
          })
        }
      } else {
        const xml = selectedNode?.getProperty('xml')
        if (xml) {
          setxmlSource(xml)
        }
      }
    }
  }, [tree, selectedNode])

  return (
    <div>
      <CodeEditor isReadOnly code={xmlSource} language={Language.xml} height='500px' />
    </div>
  )
}
