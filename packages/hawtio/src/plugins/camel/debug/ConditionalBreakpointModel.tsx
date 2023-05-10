import { MBeanNode } from '@hawtiosrc/plugins/shared'
import { Button, Form, FormGroup, Modal, ModalVariant, Popover, Radio, TextInput } from '@patternfly/react-core'
import { useState } from 'react'
import { ConditionalBreakpoint, debugService as ds } from './debug-service'
import { ExclamationCircleIcon, HelpIcon } from '@patternfly/react-icons'

interface CondBkpsProps {
  selectedNode: MBeanNode
  selection: string
  isConditionalBreakpointOpen: boolean
  onAddConditionalBreakpointToggle: () => void
  addConditionalBreakpoint: (contextNode: MBeanNode, breakpoint: ConditionalBreakpoint) => void
}

export const ConditionalBreakpointModal: React.FunctionComponent<CondBkpsProps> = (props: CondBkpsProps) => {
  const [language, setLanguage] = useState<string>('')
  const [predicate, setPredicate] = useState<string>('')
  const [error, setError] = useState<string | null>()

  const createBreakpoint = async () => {
    const bkp: ConditionalBreakpoint = {
      nodeId: props.selection,
      language: language,
      predicate: predicate,
    }

    setError(null)

    const invalid = await ds.validateConditionalBreakpoint(props.selectedNode, bkp)
    if (!invalid) {
      // returns null if valid
      props.addConditionalBreakpoint(props.selectedNode, bkp)
    } else setError(invalid)
  }

  const helpLanguageChoice = (type: string): JSX.Element => {
    const camelLink = 'https://camel.apache.org/components/latest/languages/' + type + '-language.html'
    return (
      <div>
        <p>Specify the breakpoint condition as a language predicate of {type} type.</p>
        <br />
        <p>
          See the &nbsp;
          <a target='_blank' href={camelLink} rel='noreferrer'>
            camel documentation
          </a>
          &nbsp; for more information.
        </p>
      </div>
    )
  }

  return (
    <Modal
      variant={ModalVariant.small}
      title='Add Conditional Breakpoint'
      titleIconVariant='default'
      isOpen={props.isConditionalBreakpointOpen}
      onClose={props.onAddConditionalBreakpointToggle}
      actions={[
        <Button key='unblock' variant='danger' data-testid='confirm-add' onClick={createBreakpoint}>
          Add
        </Button>,
        <Button
          key='cancel'
          variant='link'
          data-testid='confirm-cancel'
          onClick={props.onAddConditionalBreakpointToggle}
        >
          Cancel
        </Button>,
      ]}
    >
      <Form id='cond-bkp-form' isHorizontal>
        <FormGroup label='Language' isRequired isStack fieldId='cond-bkp-form-lang'>
          <div>
            <Radio
              label='Simple'
              id='cond-bkp-form-lang-simple'
              className='cond-bkp-form-lang-radio'
              name='simple'
              isChecked={language === 'simple'}
              onChange={() => setLanguage('simple')}
            />
            <Popover bodyContent={helpLanguageChoice('simple')}>
              <Button className='cond-bkp-form-lang-radio-help' variant='plain' isSmall icon={<HelpIcon />} />
            </Popover>
          </div>
          <div>
            <Radio
              label='XPath'
              id='cond-bkp-form-lang-xpath'
              className='cond-bkp-form-lang-radio'
              name='xpath'
              isChecked={language === 'xpath'}
              description=''
              onChange={() => setLanguage('xpath')}
            />
            <Popover bodyContent={helpLanguageChoice('xpath')}>
              <Button className='cond-bkp-form-lang-radio-help' variant='plain' isSmall icon={<HelpIcon />} />
            </Popover>
          </div>
        </FormGroup>
        <FormGroup label='Predicate' isRequired fieldId='cond-bkp-form-pred'>
          <TextInput
            id='cond-bkp-form-pred-input'
            isRequired
            isDisabled={!language || language.length === 0}
            type='text'
            value={predicate}
            onChange={value => setPredicate(value)}
          />
        </FormGroup>
        {error && (
          <div className='cond-bkp-form-error'>
            <ExclamationCircleIcon className='cond-bkp-form-error-icon' />
            <p className='cond-bkp-form-error-msg'>{error}</p>
          </div>
        )}
      </Form>
    </Modal>
  )
}
