import { MBeanNode } from './node'

export type TreeProcessorFunction = (domainNode: MBeanNode) => void

export type Domain = {
  id: string
  processors: TreeProcessorFunction[]
}

class TreeProcessorRegistry {
  private domains: { [id: string]: Domain } = {}

  add(domain: string, processor: TreeProcessorFunction) {
    if (this.domains[domain]) {
      this.domains[domain].processors.push(processor)
    } else {
      this.domains[domain] = { id: domain, processors: [processor] }
    }
  }

  getProcessors(domain: string): TreeProcessorFunction[] {
    if (!this.domains[domain] || !this.domains[domain].processors) return []
    return this.domains[domain].processors
  }

  getDomains(): Domain[] {
    const allDomains: Domain[] = []
    for (const id in this.domains) {
      allDomains.push({ id: id, processors: this.domains[id].processors })
    }
    return allDomains
  }

  reset() {
    this.domains = {}
  }
}

export const treeProcessorRegistry = new TreeProcessorRegistry()
