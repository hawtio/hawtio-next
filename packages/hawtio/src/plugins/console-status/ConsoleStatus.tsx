import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Card,
  CardBody,
  PageSection,
  PageSectionVariants,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
} from '@patternfly/react-core'
import { HawtioLoadingCard, workspace } from '@hawtiosrc/plugins/shared'
import './ConsoleStatus.css'

export const ConsoleStatus: React.FunctionComponent = () => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [errors, setErrors] = useState<Error[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const waitLoading = async () => {
      const hasErrors = await workspace.hasErrors()

      if (hasErrors) {
        const errors = [...(await workspace.getErrors())]
        errors.reverse() // reverse so as to show latest first
        setErrors(errors)
      }

      setLoading(false)
    }

    timerRef.current = setTimeout(waitLoading, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (loading) {
    return (
      <PageSection variant={PageSectionVariants.light}>
        <Panel>
          <PanelHeader>Waiting workspace to load ...</PanelHeader>
          <PanelMain>
            <PanelMainBody>
              <HawtioLoadingCard />
            </PanelMainBody>
          </PanelMain>
        </Panel>
      </PageSection>
    )
  }

  const hasCause = (error: Error) => {
    if (!error || !error.cause) return false
    return error.cause instanceof Error
  }

  return (
    <PageSection variant={PageSectionVariants.light}>
      <Card>
        <CardBody>
          <Alert variant='warning' title='Application returned no mbeans' />

          {errors.map((error, index) => (
            <Alert key={index} variant='danger' title={error.message} className='console-alert'>
              {hasCause(error) && <p>Cause: {(error.cause as Error).message}</p>}
            </Alert>
          ))}
        </CardBody>
      </Card>
    </PageSection>
  )
}
