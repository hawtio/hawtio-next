import { Button, Modal } from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React, { useState } from 'react'
import { Job } from '../quartz-service'

export const JobsTableRow: React.FunctionComponent<{ job: Job }> = ({ job }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleDetailToggle = () => {
    setIsDetailOpen(!isDetailOpen)
  }

  return (
    <React.Fragment>
      <Tr onRowClick={handleDetailToggle}>
        <Td dataLabel='group'>{job.group}</Td>
        <Td dataLabel='name'>{job.name}</Td>
        <Td dataLabel='durable'>{String(job.durability)}</Td>
        <Td dataLabel='recover'>{String(job.shouldRecover)}</Td>
        <Td dataLabel='jobClass'>{job.jobClass}</Td>
        <Td dataLabel='description'>{job.description}</Td>
      </Tr>
      <JobDetailModal isOpen={isDetailOpen} onClose={handleDetailToggle} input={job} />
    </React.Fragment>
  )
}

const JobDetailModal: React.FunctionComponent<{
  isOpen: boolean
  onClose: () => void
  input: Job
}> = ({ isOpen, onClose, input }) => {
  const { group, name, jobDataMap } = input

  return (
    <Modal
      id='quartz-jobs-detail-modal'
      variant='medium'
      title={`Job Detail: ${group}/${name}`}
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button key='close' variant='primary' onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <TableComposable id='quartz-jobs-detail-table' variant='compact' aria-label='Job Detail Table' isStriped>
        <Thead>
          <Tr>
            <Th>Key</Th>
            <Th>Value</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.entries(jobDataMap).map(([key, value], index) => (
            <Tr key={index}>
              <Td>{key}</Td>
              <Td>{value}</Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </Modal>
  )
}
