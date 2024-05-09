import { eventService } from '@hawtiosrc/core'
import { Button, FileUpload, Modal, ModalVariant } from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { ConnectContext } from '../context'

export const ImportModal: React.FunctionComponent<{
  isOpen: boolean
  onClose: () => void
}> = ({ isOpen, onClose }) => {
  const { dispatch } = useContext(ConnectContext)

  const [fileContent, setFileContent] = useState('')
  const [filename, setFilename] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleFileInputChange = (
    _event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
    file: File,
  ) => {
    setFilename(file.name)
  }

  const handleTextChange = (value: string) => {
    setFileContent(value)
  }

  const handleClear = () => {
    setFilename('')
    setFileContent('')
  }

  const clearAndClose = () => {
    handleClear()
    onClose()
  }

  const handleFileReadStarted = () => {
    setIsLoading(true)
  }

  const handleFileReadFinished = () => {
    setIsLoading(false)
  }

  const importConnections = () => {
    try {
      const connections = JSON.parse(fileContent)
      if (Array.isArray(connections)) {
        dispatch({ type: 'IMPORT', connections })
        clearAndClose()
        eventService.notify({ type: 'success', message: 'Connections imported successfully' })
      } else {
        clearAndClose()
        eventService.notify({ type: 'danger', message: 'Unexpected connections data format' })
      }
    } catch (e) {
      clearAndClose()
      let msg = 'Invalid connections data format'
      if (e instanceof Error) {
        msg = (e as Error).message
      }
      eventService.notify({ type: 'danger', message: msg })
    }
  }

  return (
    <Modal
      variant={ModalVariant.medium}
      title='Import connections'
      isOpen={isOpen}
      onClose={clearAndClose}
      actions={[
        <Button key='import' variant='primary' onClick={importConnections}>
          Import
        </Button>,
        <Button key='cancel' variant='link' onClick={clearAndClose}>
          Cancel
        </Button>,
      ]}
    >
      <FileUpload
        id='connect-import-connections-file-upload'
        type='text'
        value={fileContent}
        filename={filename}
        filenamePlaceholder='Drag and drop or upload an exported JSON file'
        onFileInputChange={handleFileInputChange}
        onDataChange={handleTextChange}
        onTextChange={handleTextChange}
        onReadStarted={handleFileReadStarted}
        onReadFinished={handleFileReadFinished}
        onClearClick={handleClear}
        isLoading={isLoading}
        allowEditingUploadedText={false}
        browseButtonText='Upload'
      />
    </Modal>
  )
}
