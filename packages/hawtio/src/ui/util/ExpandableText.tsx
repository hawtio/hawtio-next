import * as React from 'react'
import styles from '@patternfly/react-styles/css/components/ExpandableSection/expandable-section.js'
import { css } from '@patternfly/react-styles'
import { c_expandable_section_m_truncate__content_LineClamp as lineClamp } from '@patternfly/react-tokens/dist/esm/c_expandable_section_m_truncate__content_LineClamp.js'
import { debounce, getResizeObserver, getUniqueId, PickOptional } from '@patternfly/react-core'
import { isString } from '@hawtiosrc/util/objects'
import { AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons/angle-right-icon.js'

export enum ExpandableSectionVariant {
  default = 'default',
  truncate = 'truncate',
}

//TODO: this is "borrowed" from PatternFly, the whole ExpandableSection component can be fixed once https://github.com/patternfly/patternfly-react/pull/10870 gets merged and released
/** The main expandable section component. */

export interface ExpandableSectionProps extends React.HTMLProps<HTMLDivElement> {
  /** Content rendered inside the expandable section. */
  children?: React.ReactNode
  /** Additional classes added to the expandable section. */
  className?: string
  /** Id of the content of the expandable section. When passing in the isDetached property, this
   * property's value should match the contenId property of the expandable section toggle sub-component.
   */
  contentId?: string
  /** Id of the toggle of the expandable section, which provides an accessible name to the
   * expandable section content via the aria-labelledby attribute. When the isDetached property
   * is also passed in, the value of this property must match the toggleId property of the
   * expandable section toggle sub-component.
   */
  toggleId?: string
  /** Display size variant. Set to "lg" for disclosure styling. */
  displaySize?: 'default' | 'lg'
  /** Forces active state. */
  isActive?: boolean
  /** Indicates the expandable section has a detached toggle. */
  isDetached?: boolean
  /** Flag to indicate if the content is expanded. */
  isExpanded?: boolean
  /** Flag to indicate if the content is indented. */
  isIndented?: boolean
  /** Flag to indicate the width of the component is limited. Set to "true" for disclosure styling. */
  isWidthLimited?: boolean
  /** Callback function to toggle the expandable section. Detached expandable sections should
   * use the onToggle property of the expandable section toggle sub-component.
   */
  onToggle?: (event: React.MouseEvent, isExpanded: boolean) => void
  /** React node that appears in the attached toggle in place of the toggleText property. */
  toggleContent?: React.ReactNode
  /** Text that appears in the attached toggle. */
  toggleText?: string
  /** Text that appears in the attached toggle when collapsed (will override toggleText if
   * both are specified; used for uncontrolled expandable with dynamic toggle text).
   */
  toggleTextCollapsed?: string
  /** Text that appears in the attached toggle when expanded (will override toggleText if
   * both are specified; used for uncontrolled expandable with dynamic toggle text).
   */
  toggleTextExpanded?: string
  /** @beta Truncates the expandable content to the specified number of lines when using the
   * "truncate" variant.
   */
  truncateMaxLines?: number
  /** @beta Determines the variant of the expandable section. When passing in "truncate" as the
   * variant, the expandable content will be truncated after 3 lines by default.
   */
  variant?: 'default' | 'truncate'
}

interface ExpandableSectionState {
  isExpanded: boolean
  hasToggle: boolean
  previousWidth?: number
}

const setLineClamp = (lines: number, element: HTMLDivElement) => {
  if (!element || lines < 1) {
    return
  }

  element.style.setProperty(lineClamp.name, lines.toString())
}

class ExpandableSection extends React.Component<ExpandableSectionProps, ExpandableSectionState> {
  static displayName = 'ExpandableSection'
  constructor(props: ExpandableSectionProps) {
    super(props)

    this.state = {
      isExpanded: props.isExpanded || false,
      hasToggle: true,
      previousWidth: undefined,
    }
  }

  expandableContentRef = React.createRef<HTMLDivElement>()
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observer: () => void = () => {}

  static defaultProps: PickOptional<ExpandableSectionProps> = {
    className: '',
    toggleText: '',
    toggleTextExpanded: '',
    toggleTextCollapsed: '',
    onToggle: (event, isExpanded): void => undefined,
    isActive: false,
    isDetached: false,
    displaySize: 'default',
    isWidthLimited: false,
    isIndented: false,
    variant: 'default',
  }

  private calculateToggleText(
    toggleText: string | undefined,
    toggleTextExpanded: string | undefined,
    toggleTextCollapsed: string | undefined,
    propOrStateIsExpanded: boolean | undefined,
  ) {
    if (propOrStateIsExpanded && toggleTextExpanded !== '') {
      return toggleTextExpanded
    }
    if (!propOrStateIsExpanded && toggleTextCollapsed !== '') {
      return toggleTextCollapsed
    }
    return toggleText
  }

  componentDidMount() {
    if (this.props.variant === ExpandableSectionVariant.truncate) {
      const expandableContent = this.expandableContentRef.current
      if (!expandableContent) {
        return
      }
      this.setState({ previousWidth: expandableContent.offsetWidth })
      this.observer = getResizeObserver(expandableContent, this.handleResize, false)

      if (this.props.truncateMaxLines) {
        setLineClamp(this.props.truncateMaxLines, expandableContent)
      }

      this.checkToggleVisibility()
    }
  }

  componentDidUpdate(prevProps: ExpandableSectionProps) {
    if (
      this.props.variant === ExpandableSectionVariant.truncate &&
      this.props.truncateMaxLines &&
      this.expandableContentRef.current &&
      (prevProps.truncateMaxLines !== this.props.truncateMaxLines || prevProps.children !== this.props.children)
    ) {
      const expandableContent = this.expandableContentRef.current
      setLineClamp(this.props.truncateMaxLines, expandableContent)
      this.checkToggleVisibility()
    }
  }

  componentWillUnmount() {
    if (this.props.variant === ExpandableSectionVariant.truncate) {
      this.observer()
    }
  }

  checkToggleVisibility = () => {
    if (this.expandableContentRef?.current) {
      const maxLines = this.props.truncateMaxLines || parseInt(lineClamp.value)
      const totalLines =
        this.expandableContentRef.current.scrollHeight /
        parseInt(getComputedStyle(this.expandableContentRef.current).lineHeight)

      this.setState({
        hasToggle: totalLines > maxLines,
      })
    }
  }

  resize = () => {
    if (!this.expandableContentRef.current) {
      return
    }
    const { offsetWidth } = this.expandableContentRef.current
    if (this.state.previousWidth !== offsetWidth) {
      this.setState({ previousWidth: offsetWidth })
      this.checkToggleVisibility()
    }
  }
  handleResize = debounce(this.resize, 250)

  render() {
    const {
      onToggle: onToggleProp,
      isActive,
      className,
      toggleText,
      toggleTextExpanded,
      toggleTextCollapsed,
      toggleContent,
      children,
      isExpanded,
      isDetached,
      displaySize,
      isWidthLimited,
      isIndented,
      contentId,
      toggleId,
      variant,
      truncateMaxLines,
      ...props
    } = this.props

    if (isDetached && !toggleId) {
      /* eslint-disable no-console */
      console.warn(
        'ExpandableSection: The toggleId value must be passed in and must match the toggleId of the ExpandableSectionToggle.',
      )
    }

    let onToggle = onToggleProp
    let propOrStateIsExpanded = isExpanded
    const uniqueContentId = contentId || getUniqueId('expandable-section-content')
    const uniqueToggleId = toggleId || getUniqueId('expandable-section-toggle')

    // uncontrolled
    if (isExpanded === undefined) {
      propOrStateIsExpanded = this.state.isExpanded
      onToggle = (event, isOpen) => {
        this.setState({ isExpanded: isOpen }, () => onToggleProp?.(event, this.state.isExpanded))
      }
    }

    const computedToggleText = this.calculateToggleText(
      toggleText,
      toggleTextExpanded,
      toggleTextCollapsed,
      propOrStateIsExpanded,
    )

    const expandableToggle = !isDetached && (
      <button
        className={css(styles.expandableSectionToggle)}
        type='button'
        aria-expanded={propOrStateIsExpanded}
        aria-controls={uniqueContentId}
        id={uniqueToggleId}
        onClick={event => onToggle?.(event, !propOrStateIsExpanded)}
      >
        {variant !== ExpandableSectionVariant.truncate && (
          <span className={css(styles.expandableSectionToggleIcon)}>
            <AngleRightIcon aria-hidden />
          </span>
        )}
        <span className={css(styles.expandableSectionToggleText)}>{toggleContent || computedToggleText}</span>
      </button>
    )

    return (
      <div
        className={css(
          styles.expandableSection,
          propOrStateIsExpanded && styles.modifiers.expanded,
          isActive && styles.modifiers.active,
          isDetached && styles.modifiers.detached,
          displaySize === 'lg' && styles.modifiers.displayLg,
          isWidthLimited && styles.modifiers.limitWidth,
          isIndented && styles.modifiers.indented,
          variant === ExpandableSectionVariant.truncate && styles.modifiers.truncate,
          className,
        )}
        {...props}
      >
        {variant === ExpandableSectionVariant.default && expandableToggle}
        <div
          ref={this.expandableContentRef}
          className={css(styles.expandableSectionContent)}
          hidden={variant !== ExpandableSectionVariant.truncate && !propOrStateIsExpanded}
          id={uniqueContentId}
          aria-labelledby={uniqueToggleId}
          role='region'
        >
          {children}
        </div>
        {variant === ExpandableSectionVariant.truncate && this.state.hasToggle && expandableToggle}
      </div>
    )
  }
}

export const ExpandableText: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }) => {
  if (isString(children)) {
    return (
      <ExpandableSection
        onClick={e => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          ;(e.target as HTMLElement)?.classList.contains('pf-v5-c-expandable-section__toggle-text') &&
            e.stopPropagation()
        }}
        truncateMaxLines={3}
        variant='truncate'
        toggleTextExpanded='Show less'
        toggleTextCollapsed='Show more'
      >
        {children}
      </ExpandableSection>
    )
  }
  return children
}
