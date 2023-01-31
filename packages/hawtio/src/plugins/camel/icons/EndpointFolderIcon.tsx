import React from 'react'
import endpointFolderSvg from './svg/endpoint-folder.svg'

const EndPointFolderIcon = ({ size = 16 }) => {
  return (
    <img src={endpointFolderSvg}
         width={size + 'px'} height={size + 'px'}
         alt="EndPoint Folder Icon"
    />
  )
}

export { EndPointFolderIcon }
