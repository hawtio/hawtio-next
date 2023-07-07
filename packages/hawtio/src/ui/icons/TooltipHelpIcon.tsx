import { Icon, Tooltip } from '@patternfly/react-core'
import { HelpIcon } from '@patternfly/react-icons'

export const TooltipHelpIcon: React.FunctionComponent<{ tooltip: string }> = ({ tooltip }) => (
  <Icon size='md'>
    <Tooltip content={tooltip} removeFindDomNode>
      <HelpIcon />
    </Tooltip>
  </Icon>
)
