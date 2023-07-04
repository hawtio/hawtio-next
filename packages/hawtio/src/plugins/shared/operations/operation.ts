import { isEmpty } from '@hawtiosrc/util/objects'
import { stringSorter, trimEnd } from '@hawtiosrc/util/strings'
import { IJmxOperation, IJmxOperations } from 'jolokia.js'

export function createOperations(objectName: string, jmxOperations: IJmxOperations): Operation[] {
  const operations: Operation[] = []
  const operationMap: Record<string, Operation> = {}
  Object.entries(jmxOperations).forEach(([name, op]) => {
    if (Array.isArray(op)) {
      op.forEach(op => addOperation(operations, operationMap, name, op))
    } else {
      addOperation(operations, operationMap, name, op)
    }
  })
  operations.sort((a, b) => stringSorter(a.readableName, b.readableName))
  if (!isEmpty(operationMap)) {
    fetchPermissions(operationMap, objectName)
  }

  return operations
}

function addOperation(
  operations: Operation[],
  operationMap: Record<string, Operation>,
  name: string,
  op: IJmxOperation,
): void {
  const operation = new Operation(
    name,
    op.args.map(arg => new OperationArgument(arg.name, arg.type, arg.desc)),
    op.desc,
    op.ret,
    op.canInvoke,
  )
  operations.push(operation)
  operationMap[operation.name] = operation
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchPermissions(operationMap: Record<string, Operation>, objectName: string) {
  // TODO: impl fetch permissions
}

export class Operation {
  readonly name: string
  readonly readableName: string
  readonly readableReturnType: string

  static readonly IGNORED_PACKAGES = ['java.util', 'java.lang']

  constructor(
    readonly method: string,
    readonly args: OperationArgument[],
    readonly description: string,
    readonly returnType: string,
    readonly canInvoke: boolean = true,
  ) {
    this.name = this.buildName(method)
    this.readableName = this.buildReadableName(method)
    this.readableReturnType = this.buildReadableReturnType()
  }

  private buildName(method: string): string {
    return method + '(' + this.args.map(arg => arg.type).join() + ')'
  }

  private buildReadableName(method: string): string {
    return method + '(' + this.args.map(arg => arg.readableType).join(', ') + ')'
  }

  private buildReadableReturnType(): string {
    const splitName = this.returnType.split('.')
    const typeName = splitName.pop()
    const packageName = splitName.join('.')

    if (typeName && Operation.IGNORED_PACKAGES.includes(packageName)) {
      return typeName
    } else {
      return this.returnType
    }
  }
}

export class OperationArgument {
  readonly readableType: string

  constructor(readonly name: string, readonly type: string, readonly desc: string) {
    this.readableType = this.buildReadableType()
  }

  private buildReadableType(): string {
    const lastDotIndex = this.type.lastIndexOf('.')
    let answer = lastDotIndex > 0 ? this.type.substring(lastDotIndex + 1) : this.type
    if (this.type.startsWith('[') && this.type.endsWith(';')) {
      answer = trimEnd(answer, ';') + '[]'
    }
    return answer
  }

  helpText(): string {
    let help = this.desc
    if (help && help !== this.name) {
      if (help.charAt(help.length - 1) !== '.') {
        help = help + '.'
      }
    } else {
      help = ''
    }
    return `${help} Type: ${this.readableType}`
  }
}
