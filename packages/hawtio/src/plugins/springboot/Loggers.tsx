import { FilteredTable } from '@hawtiosrc/ui'
import { Dropdown, DropdownItem, DropdownList, Label, MenuToggle, MenuToggleElement } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { springbootService } from './springboot-service'
import { Logger } from './types'

const SetLogDropdown: React.FunctionComponent<{
  currentLevel: string
  loggerName: string
  logLevels: string[]
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<string | null>>
  isDropdownOpen: string | null
  reloadLoggers: () => void
}> = ({ currentLevel, loggerName, logLevels, setIsDropdownOpen, isDropdownOpen, reloadLoggers }) => {
  const items = logLevels.map(level => (
    <DropdownItem
      key={loggerName + '-' + level}
      onClick={() => {
        springbootService.configureLogLevel(loggerName, level)
        reloadLoggers()
      }}
    >
      <LogLevel level={level} />
    </DropdownItem>
  ))

  return (
    <Dropdown
      onSelect={() => setIsDropdownOpen(null)}
      onOpenChange={() => setIsDropdownOpen(null)}
      defaultValue={currentLevel}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          id={`toggle-basic-${loggerName}`}
          onClick={() => setIsDropdownOpen(prevState => (prevState === loggerName ? null : loggerName))}
        >
          <LogLevel level={currentLevel} />
        </MenuToggle>
      )}
      isOpen={isDropdownOpen === loggerName}
    >
      <DropdownList>{items}</DropdownList>
    </Dropdown>
  )
}
const LogLevel: React.FunctionComponent<{
  level: string
}> = ({ level }) => {
  switch (level) {
    case 'TRACE':
    case 'OFF':
    case 'DEBUG':
      return <Label color='grey'>{level}</Label>
    case 'INFO':
      return <Label color='blue'>{level}</Label>
    case 'WARN':
      return <Label color='orange'>{level}</Label>
    case 'ERROR':
      return <Label color='red'>{level}</Label>
    default:
      return <React.Fragment>{level}</React.Fragment>
  }
}
export const Loggers: React.FunctionComponent = () => {
  const [loggers, setLoggers] = useState<Logger[]>([])
  const [logLevels, setLogLevels] = useState<string[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null)
  const [reloadLoggers, setReloadLoggers] = useState(false)

  useEffect(() => {
    springbootService.getLoggerConfiguration().then(logConf => {
      const sorted = logConf.loggers.sort((logger1, logger2) => {
        if (logger1.name === 'ROOT') return -1
        else if (logger2.name === 'ROOT') return 1
        else return logger1.name.localeCompare(logger2.name)
      })
      setLoggers(sorted)
      setLogLevels([...logConf.levels])
    })
  }, [reloadLoggers])

  return (
    <FilteredTable
      rows={loggers}
      highlightSearch={true}
      tableColumns={[
        {
          name: 'Log Level',
          key: 'configuredLevel',
          percentageWidth: 20,
          renderer: logger => (
            <SetLogDropdown
              loggerName={logger.name}
              currentLevel={logger.configuredLevel}
              logLevels={logLevels}
              setIsDropdownOpen={setIsDropdownOpen}
              isDropdownOpen={isDropdownOpen}
              reloadLoggers={() => {
                setReloadLoggers(!reloadLoggers)
              }}
            />
          ),
        },
        {
          name: 'Logger Name',
          key: 'name',
          percentageWidth: 80,
        },
      ]}
      searchCategories={[{ key: 'name', name: 'Logger Name' }]}
      fixedSearchCategories={[
        {
          name: 'Log Level',
          key: 'configuredLevel',
          ariaLabel: 'Log Level',
          values: logLevels,
          renderer: val => <LogLevel level={val} />,
        },
      ]}
    />
  )
}
