import { Logger } from '@hawtio/core'
import { escapeDots, escapeTags } from '@hawtio/util/jolokia'
import { stringSorter } from '@hawtio/util/strings'
import { IJmxDomain, IJmxDomains } from 'jolokia.js'
import { ILogger } from 'js-logger'
import { MBeanNode } from './node'
import { treeProcessorRegistry, TreeProcessorFunction } from './registry'

export class MBeanTree {

  private id: string
  private log: ILogger

  static createEmptyTree(id: string): MBeanTree {
    return new MBeanTree(id)
  }

  static createMBeanTreeFromDomains(id: string, domains: IJmxDomains): MBeanTree {
    const mBeanTree = new MBeanTree(id)
    mBeanTree.populate(domains)
    return mBeanTree
  }

  static createMBeanTreeFromNodes(id: string, nodes: MBeanNode[]) {
    const mBeanTree = new MBeanTree(id)
    mBeanTree.tree = nodes
    return mBeanTree
  }

  static createFilteredTree(originalTree: MBeanNode[], filter: (node: MBeanNode) => boolean): MBeanNode[] {
    const filteredTree: MBeanNode[] = []
    for (const node of originalTree) {
      const copy = node.filterClone(filter)
      if (copy) {
        filteredTree.push(copy)
      }
    }

    return filteredTree
  }

  private tree: MBeanNode[] = []

  private constructor(id: string) {
    this.id = `hawtio-${id}`
    this.log = Logger.get(this.id + '-tree')
  }

  private populate(domains: IJmxDomains) {
    Object.entries(domains).forEach(([name, domain]) => {
      // Domain name is displayed in the tree, so let's escape it here.
      // Use a custom escaping method here as escaping '"' breaks Camel tree.
      const escapedName = escapeTags(name)
      this.populateDomain(escapedName, domain)
    })

    this.sortTree()
  }

  private populateDomain(name: string, domain: IJmxDomain) {
    this.log.debug("JMX tree domain:", name)
    const domainNode = this.getOrCreateNode(name)
    Object.entries(domain).forEach(([propList, mbean]) => {
      domainNode.populateMBean(propList, mbean)
    })

    // Execute any post-processors for the domain
    const processors: TreeProcessorFunction[] = treeProcessorRegistry.getProcessors(name)
    processors.forEach((processor: TreeProcessorFunction) => {
      processor(domainNode)
    })
  }

  private getOrCreateNode(name: string): MBeanNode {
    const node = this.tree.find(node => node.name === name)
    if (node) {
      return node
    }

    const id = escapeDots(name)
    const newNode = new MBeanNode(this.id, id, name, true)
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

  get(name: string): MBeanNode | null {
    const node = this.tree.find(node => {
      return node.name === name
    })

    return (node) ? node : null
  }

  isEmpty(): boolean {
    return this.tree.length === 0
  }

  /**
   * Searches this folder and all its descendants for the first folder to match the filter
   * @method findDescendant
   * @for Folder
   * @param {Function} filter
   * @return {Folder}
   */
  findDescendant(filter: (node: MBeanNode) => boolean): MBeanNode | null {
    let answer: MBeanNode | null = null
    this.tree.forEach((child) => {
      if (!answer) {
        answer = child.findDescendant(filter)
      }
    })
    return answer
  }
}
