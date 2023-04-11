import { AttributeValues } from './connect/jolokia-service'
import { MBeanNode } from './shared'
import { attributeService } from './shared/attributes/attribute-service'

export type MBeanAttributeData = {
  nodeData: MBeanAttributes | void
  children: {
    [id: string]: MBeanAttributes | void
  }
}

export type MBeanChartData = {
  nodeData: MBeanChartDataEntries | void
  children: {
    [id: string]: MBeanChartDataEntries | void
  }
}

export type MBeanAttributes = {
  node: MBeanNode
  data: AttributeValues
}

export type MBeanChartDataEntries = {
  node: MBeanNode
  entries: MBeanChartDataEntriesTime[]
}

export type MBeanChartDataEntriesTime = {
  time: number
  data: AttributeValues[]
}

export interface ISelectionNodeData {
  getAttributesForNode: (node: MBeanNode | null) => Promise<MBeanAttributeData>
}

class SelectionNodeData implements ISelectionNodeData {
  private async getAttributesForSpecificNode(node: MBeanNode): Promise<MBeanAttributes | null> {
    if (!node || !node?.objectName) return Promise.resolve(null)

    return Promise.resolve({ node, data: await attributeService.read(node.objectName) })
  }

  async getAttributesForNode(node: MBeanNode | null): Promise<MBeanAttributeData> {
    if (!node) return Promise.resolve({ nodeData: undefined, children: {} })

    return {
      nodeData: (await this.getAttributesForSpecificNode(node)) ?? undefined,
      children: Object.fromEntries(
        await Promise.all(
          node.getChildren().map(async child => [child.id, await this.getAttributesForSpecificNode(child)]),
        ),
      ),
    }
  }
}

export const selectionNodeDataService = new SelectionNodeData()
