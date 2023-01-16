import { Logger } from '@hawtio/core'
import { escapeDots, escapeTags } from '@hawtio/util/jolokia'
import { stringSorter, trimQuotes } from '@hawtio/util/strings'
import { TreeViewDataItem } from '@patternfly/react-core'
import { CubeIcon, FolderIcon, FolderOpenIcon } from '@patternfly/react-icons'
import { IJmxDomain, IJmxDomains, IJmxMBean } from 'jolokia.js'
import React from 'react'
import { pluginName } from '../globals'

const log = Logger.get(`${pluginName}-tree`)

export class MBeanTree {
  private tree: MBeanNode[] = []

  constructor(domains: IJmxDomains) {
    this.populate(domains)
  }

  private populate(domains: IJmxDomains) {
    Object.entries(domains).forEach(([name, domain]) => {
      // Domain name is displayed in the tree, so let's escape it here.
      // Use a custom escaping method here as escaping '"' breaks Camel tree.
      const escapedName = escapeTags(name)
      this.populateDomain(escapedName, domain)
    })

    this.sortTree()

    // TODO: tree post processors
  }

  private populateDomain(name: string, domain: IJmxDomain) {
    log.debug("JMX tree domain:", name)
    const domainNode = this.getOrCreateNode(name)
    Object.entries(domain).forEach(([propList, mbean]) => {
      domainNode.populateMBean(propList, mbean)
    })
  }

  private getOrCreateNode(name: string): MBeanNode {
    const node = this.tree.find(node => node.name === name)
    if (node) {
      return node
    }

    const id = escapeDots(name)
    const newNode = new MBeanNode(id, name, true)
    this.tree.push(newNode)
    return newNode
  }

  private sortTree() {
    this.tree.sort((a, b) => stringSorter(a.name, b.name))
    this.tree.forEach(node => node.sort(true))
  }

  getTree(): MBeanNode[] {
    return this.tree
  }

  isEmpty(): boolean {
    return this.tree.length === 0
  }
}

const Icons = {
  folder: React.createElement(FolderIcon),
  folderOpen: React.createElement(FolderOpenIcon),
  mbean: React.createElement(CubeIcon),
} as const

export class MBeanNode implements TreeViewDataItem {
  id: string
  name: string
  icon: React.ReactNode
  expandedIcon?: React.ReactNode
  children?: MBeanNode[]

  // MBean info
  objectName?: string
  mbean?: IJmxMBean

  constructor(id: string, name: string, folder: boolean) {
    this.id = id
    this.name = name
    if (folder) {
      this.icon = Icons.folder
      this.expandedIcon = Icons.folderOpen
      this.children = []
    } else {
      this.icon = Icons.mbean
    }
  }

  populateMBean(propList: string, mbean: IJmxMBean) {
    log.debug("  JMX tree mbean:", propList)
    const props = new PropertyList(this, propList)
    this.createMBeanNode(props.getPaths(), props, mbean)
  }

  private createMBeanNode(paths: string[], props: PropertyList, mbean: IJmxMBean) {
    log.debug("    JMX tree property:", paths[0])
    if (paths.length === 1) {
      // final mbean node
      const mbeanNode = this.create(paths[0], false)
      mbeanNode.configureMBean(props, mbean)
      return
    }

    const path = paths.shift()
    if (path === undefined) {
      throw new Error("path should not be empty")
    }
    const child = this.getOrCreate(path, true)
    child.createMBeanNode(paths, props, mbean)
  }

  configureMBean(propList: PropertyList, mbean: IJmxMBean) {
    this.objectName = propList.objectName()
    this.mbean = mbean
  }

  get(name: string): MBeanNode | null {
    return this.children?.find(node => node.name === name) || null
  }

  create(name: string, folder: boolean): MBeanNode {
    // this method should be invoked on a folder node
    if (this.children === undefined) {
      log.warn(`node "${this.name}" should be a folder`)
      // re-init as folder
      this.icon = Icons.folder
      this.expandedIcon = Icons.folderOpen
      this.children = []
    }

    const id = escapeDots(name)
    const newChild = new MBeanNode(id, name, folder)
    this.children.push(newChild)
    return newChild
  }

  getOrCreate(name: string, folder: boolean): MBeanNode {
    const node = this.get(name)
    if (node) {
      return node
    }
    return this.create(name, folder)
  }

  sort(recursive: boolean) {
    this.children?.sort((a, b) => stringSorter(a.name, b.name))
    if (recursive) {
      this.children?.forEach(child => child.sort(recursive))
    }
  }
}

class PropertyList {
  private domain: MBeanNode
  private propList: string
  private paths: { key: string, value: string }[] = []
  typeName?: string
  serviceName?: string

  private readonly propRegex = new RegExp('(([^=,]+)=(\\\\"[^"]+\\\\"|\\\\\'[^\']+\\\\\'|"[^"]+"|\'[^\']+\'|[^,]+))|([^=,]+)', 'g')

  constructor(domain: MBeanNode, propList: string) {
    this.domain = domain
    this.propList = propList
    this.parse(propList)
  }

  private parse(propList: string) {
    const props: { [key: string]: string } = {}
    let match
    while ((match = this.propRegex.exec(propList))) {
      const [propKey, propValue] = this.parseProperty(match[0])
      props[propKey] = propValue
      let index = -1
      const lowerKey = propKey.toLowerCase()
      const path = { key: lowerKey, value: propValue }
      switch (lowerKey) {
        case 'type':
          this.typeName = propValue
          if (this.domain.get(propValue)) {
            // if the type name value already exists in the root node
            // of the domain then let's move this property around too
            index = 0
          } else if (props['name']) {
            // else if the name key already exists, insert the type key before it
            index = this.paths.findIndex(p => p.key === 'name')
          }
          break
        case 'service':
          this.serviceName = propValue
          break
      }
      if (index >= 0) {
        this.paths.splice(index, 0, path)
      } else {
        this.paths.push(path)
      }
    }

    this.maybeReorderPaths()
  }

  private parseProperty(property: string): [string, string] {
    let key = property
    let value = property
    // do not use split('=') as it splits wrong when there is a space in the mbean name
    const pos = property.indexOf('=')
    if (pos > 0) {
      key = property.substring(0, pos)
      value = property.substring(pos + 1)
    }
    // mbean property value is displayed in the tree, so let's escape it here
    value = escapeTags(trimQuotes(value || key))
    return [key, value]
  }

  /**
   * Reorders paths when they aren't in the correct order.
   */
  private maybeReorderPaths() {
    switch (this.domain.name) {
      case 'osgi.compendium':
        reorderObjects(this.paths, 'key', ['service', 'version', 'framework'])
        break
      case 'osgi.core':
        reorderObjects(this.paths, 'key', ['type', 'version', 'framework'])
        break
    }
  }

  getPaths(): string[] {
    return this.paths.map(p => p.value)
  }

  objectName(): string {
    return `${this.domain.name}:${this.propList}`
  }
}

/**
 * Reorders objects by the given key according to the given order of values.
 */
export function reorderObjects(objs: object[], key: string, order: string[]) {
  if (!checkReorderNeeded(objs, key, order)) {
    return
  }

  const objKey = key as keyof typeof objs[0]
  order.reverse().forEach(value => {
    const index = objs.findIndex(o => o[objKey] === value)
    if (index >= 0) {
      const obj = objs.splice(index, 1)[0]
      objs.unshift(obj)
    }
  })
}

/**
 * Checks whether the given objects need to be reordered.
 */
export function checkReorderNeeded(objs: object[], key: string, order: string[]): boolean {
  if (objs.length === 0 || order.length === 0) {
    return false
  }

  const objKey = key as keyof typeof objs[0]
  if (objs.length < order.length) {
    return objs.some((o, i) => o[objKey] !== order[i])
  }
  return order.some((v, i) => v !== objs[i][objKey])
}
