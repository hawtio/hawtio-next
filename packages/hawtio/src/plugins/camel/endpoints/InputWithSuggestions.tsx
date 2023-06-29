import React, { useEffect, useRef } from 'react'
import { Menu, MenuContent, MenuItem, MenuList, Text, TextInput } from '@patternfly/react-core'

export const InputWithSuggestions: React.FunctionComponent<{
  suggestions: string[]
  value: string
  onChange: (value: string) => void
}> = ({ suggestions, value, onChange }) => {
  const [menuIsOpen, setMenuIsOpen] = React.useState(false)
  const suggestionsRef = useRef(null)

  const handleOutsideClick = (event: MouseEvent) => {
    if (suggestionsRef.current && !(suggestionsRef.current as HTMLElement).contains(event.target as Node)) {
      setMenuIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const onSelect = (event: React.MouseEvent<Element, MouseEvent> | undefined, itemId: string | number | undefined) => {
    const selectedText = itemId as string
    onChange(selectedText)
    setMenuIsOpen(false)
    event?.stopPropagation()
  }

  const suggestionsList = suggestions
    ?.filter(e => e.toLowerCase().includes(value.toLowerCase()))
    .map((e, index) => {
      const regex = value.replace(/[-\\/^$*+?.()|[\]{}]/g, '\\$&')
      const suggestion =
        value !== ''
          ? e
              .split(new RegExp(`(${regex})`, 'gi'))
              .map((part, i) =>
                part.toLowerCase() === value.toLowerCase() ? <strong key={part + i}>{part}</strong> : part,
              )
          : e

      return (
        <MenuItem key={e} itemId={e}>
          <Text>{suggestion}</Text>
        </MenuItem>
      )
    })

  const suggestionsElement = (
    <div ref={suggestionsRef}>
      <Menu
        style={{ position: 'absolute', top: '100%', zIndex: '999' }}
        onSelect={onSelect}
        onBlur={() => setMenuIsOpen(false)}
        isScrollable
      >
        <MenuContent menuHeight='250px'>
          <MenuList data-testid='suggestions-menu-list'>{suggestionsList}</MenuList>
        </MenuContent>
      </Menu>
    </div>
  )

  return (
    <div style={{ position: 'relative' }}>
      <TextInput
        value={value}
        onChange={onChange}
        onFocus={() => setMenuIsOpen(true)}
        placeholder=''
        aria-label='Search input'
      />
      {suggestionsList.length > 0 && menuIsOpen && suggestionsElement}
    </div>
  )
}
