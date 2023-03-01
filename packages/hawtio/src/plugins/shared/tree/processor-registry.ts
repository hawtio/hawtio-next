import { MBeanNode } from './node'

export type TreeProcessor = (node: MBeanNode) => void

export type TreeProcessors = {
  [domain: string]: TreeProcessor[]
}

export interface ITreeProcessorRegistry {
  add(domain: string, processor: TreeProcessor): void
  process(domain: string, node: MBeanNode): void
  getProcessors(): TreeProcessors
  reset(): void
}

class TreeProcessorRegistry implements ITreeProcessorRegistry {
  private processors: TreeProcessors = {}

  add(domain: string, processor: TreeProcessor) {
    if (!this.processors[domain]) {
      this.processors[domain] = []
    }
    this.processors[domain].push(processor)
  }

  process(domain: string, node: MBeanNode) {
    const processors = this.processors[domain]
    if (!processors) {
      return
    }

    processors.forEach(processor => processor(node))
  }

  getProcessors(): TreeProcessors {
    return this.processors
  }

  reset() {
    this.processors = {}
  }
}

export const treeProcessorRegistry = new TreeProcessorRegistry()
