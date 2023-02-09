import { eventService, Notification, NotificationType } from '@hawtio/core'
import { Alert, AlertActionCloseButton, AlertGroup, AlertProps } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'

export const HawtioNotification: React.FunctionComponent = () => {
  const [alerts, setAlerts] = useState<Partial<AlertProps>[]>([])

  const addAlert = (title: string, variant: NotificationType, key: React.Key) => {
    setAlerts(alerts => [...alerts, { title, variant, key }])
  }

  const removeAlert = (key: React.Key) => {
    setAlerts(alerts => [...alerts.filter(alert => alert.key !== key)])
  }

  const getUniqueKey = () => new Date().getTime()

  useEffect(() => {
    const listener = (notification: Notification) => {
      const key = getUniqueKey()
      addAlert(notification.message, notification.type, key)
      if (notification.duration) {
        setTimeout(() => {
          removeAlert(key)
        }, notification.duration)
      }
    }
    eventService.onNotify(listener)

    return () => eventService.removeListener(listener)
  }, [])

  return (
    <AlertGroup isToast isLiveRegion>
      {alerts.map(({ key, variant, title }) => (
        <Alert
          variant={variant}
          title={title}
          actionClose={
            <AlertActionCloseButton
              title={title as string}
              variantLabel={`${variant} alert`}
              onClose={() => key && removeAlert(key)}
            />
          }
          key={key}
        />
      ))}
    </AlertGroup>
  )
}
