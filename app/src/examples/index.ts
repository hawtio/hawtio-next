import { HawtioPlugin } from '@hawtio/react'
import { registerDisabled } from './disabled'
import { registerExample1 } from './example1'
import { registerExample2 } from './example2'
import { registerExample3 } from './example3'

export const registerExamples: HawtioPlugin = () => {
  registerExample1()
  registerExample2()
  registerExample3()
  registerDisabled()
}
