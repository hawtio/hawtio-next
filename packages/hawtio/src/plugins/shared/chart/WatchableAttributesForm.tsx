import { Button, DualListSelector, DualListSelectorTreeItemData, Modal, ModalVariant } from '@patternfly/react-core'
import { AttributesToWatch } from './Chart'
import { ReactNode, useState } from 'react'

export const WatchableAttributesForm = ({
  isOpen,
  onClose,
  attributesToWatch,
  onAttributesToWatchUpdate,
}: {
  isOpen: boolean
  onClose: (isClosed: boolean) => void
  attributesToWatch: AttributesToWatch
  onAttributesToWatchUpdate: (newAttributes: AttributesToWatch) => void
}) => {
  const [modalAttributesToWatch, setModalAttributesToWatch] = useState<AttributesToWatch>(attributesToWatch)

  return (
    <Modal
      variant={ModalVariant.large}
      title='Modify watches'
      isOpen={isOpen}
      onClose={() => onClose(false)}
      actions={[
        <Button key='close' variant='primary' onClick={() => onClose(false)}>
          Close
        </Button>,
      ]}
    >
      <DualListSelector
        isSearchable
        isTree
        availableOptionsTitle='Watched attributes'
        chosenOptionsTitle='Unwatched attributes'
        availableOptions={Object.entries(modalAttributesToWatch)
          .filter(([_, attributes]) => Object.values(attributes).some(isWatched => isWatched))
          .map(([node, attributes]) => ({
            id: node,
            text: node,
            isChecked: false,
            children: Object.entries(attributes)
              .filter(([_, isWatched]) => isWatched)
              .map(([attributeName, _]) => ({
                id: `${node} ${attributeName}`,
                text: attributeName,
                isChecked: false,
              })),
          }))}
        chosenOptions={Object.entries(modalAttributesToWatch)
          .filter(([_, attributes]) => Object.values(attributes).some(isWatched => !isWatched))
          .map(([node, attributes]) => ({
            id: node,
            text: node,
            isChecked: false,
            children: Object.entries(attributes)
              .filter(([_, isWatched]) => !isWatched)
              .map(([attributeName, _]) => ({
                id: `${node} ${attributeName}`,
                text: attributeName,
                isChecked: false,
              })),
          }))}
        onListChange={
          ((
            newWatchedAttributes: DualListSelectorTreeItemData[],
            newUnwatchedAttributes: DualListSelectorTreeItemData[],
          ) => {
            const newWatches: AttributesToWatch = {}
            newWatchedAttributes.forEach(newWatchedAttribute => {
              newWatches[newWatchedAttribute.id] = {
                ...Object.fromEntries(newWatchedAttribute.children?.map(({ id }) => [id, true]) || []),
              }
            })
            newUnwatchedAttributes.forEach(newUnwatchedAttribute => {
              newWatches[newUnwatchedAttribute.id] = {
                ...(newWatches[newUnwatchedAttribute.id] || {}),
                ...Object.fromEntries(newUnwatchedAttribute.children?.map(({ id }) => [id, false]) || []),
              }
            })

            onAttributesToWatchUpdate(newWatches)
            setModalAttributesToWatch({ ...newWatches })
          }) as unknown as (newAvailableOptions: ReactNode[], newChosenOptions: ReactNode[]) => void
        }
      />
    </Modal>
  )
}
