import { eventService } from '@hawtiosrc/core'
import { stringSorter, trimEnd } from '@hawtiosrc/util/strings'
import { log } from '../globals'
import { OptimisedMBeanOperation, OptimisedMBeanOperations } from '../tree'

/**
 * Factory function for Operation objects.
 */
export function createOperations(jmxOperations: OptimisedMBeanOperations): Operation[] {
  const operations: Operation[] = []
  const errors: string[] = []
  Object.entries(jmxOperations).forEach(([name, op]) => {
    if (Array.isArray(op)) {
      op.forEach(op => addOperation(operations, name, op, errors))
    } else {
      addOperation(operations, name, op, errors)
    }
  })
  if (errors.length > 0) {
    eventService.notify({
      type: 'danger',
      message: `Please try increasing max depth for Jolokia in the Connect preferences. Failed to load operations: ${errors.join(
        ', ',
      )}.`,
      duration: 30 * 1000, // 30 sec.
    })
  }
  return operations.sort((a, b) => stringSorter(a.readableName, b.readableName))
}

function addOperation(operations: Operation[], name: string, op: OptimisedMBeanOperation, errors: string[]) {
  try {
    const operation = new Operation(
      name,
      op.args.map(arg => new OperationArgument(arg.name, arg.type, arg.desc)),
      op.desc,
      op.ret,
      op.canInvoke,
    )
    operations.push(operation)
  } catch (error) {
    // Error can happen when max depth for Jolokia LIST is too small and part of
    // the returned MBeans are compressed in a string form. In that case, the user
    // needs to increase max depth for Jolokia requests in Connect preferences.
    log.error('Operations - Error creating operation:', name, error)
    errors.push(name)
  }
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

  constructor(
    readonly name: string,
    readonly type: string,
    readonly desc: string,
  ) {
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
