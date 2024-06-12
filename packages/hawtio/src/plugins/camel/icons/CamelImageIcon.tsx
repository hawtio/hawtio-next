type CamelImageIconProps = {
  name: string
  svg: string
  size: number
}

const CamelImageIcon = (props: CamelImageIconProps) => {
  const { name, svg, size = 16 } = props
  return <img src={svg} width={size + 'px'} height={size + 'px'} alt={name} />
}

export { CamelImageIcon }
