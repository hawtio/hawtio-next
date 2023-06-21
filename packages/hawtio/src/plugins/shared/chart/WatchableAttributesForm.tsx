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
  // Take care when switching the text prop. As right now it's used to identify the key in attributes to watch prop.
  // Because the key needs to be unique across all trees (or else there is a bug where the check selection applies to
  // any element in any tree with the same key), I had to change the keys and no longer can use that prop for storing the key
  // to the original attributes to watch.
  // There is a way around this building a dictionary storing attribute names - keys, but it seemed too overengineered
  // when the text is currently the same attribute name as the key in attributes to watch

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
              newWatches[newWatchedAttribute.text] = {
                ...Object.fromEntries(newWatchedAttribute.children?.map(({ text }) => [text, true]) || []),
              }
            })
            newUnwatchedAttributes.forEach(newUnwatchedAttribute => {
              newWatches[newUnwatchedAttribute.text] = {
                ...(newWatches[newUnwatchedAttribute.text] || {}),
                ...Object.fromEntries(newUnwatchedAttribute.children?.map(({ text }) => [text, false]) || []),
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
