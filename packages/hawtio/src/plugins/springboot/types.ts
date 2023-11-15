export type HealthComponent = {
  name: string
  status: string
  details?: HealthComponentDetail[]
}
export type HealthComponentDetail = {
  key: string
  value: string | HealthComponentDetail[]
}
export type HealthData = {
  components: HealthComponent[]
  status: string
}

export type JolokiaHealthData = {
  status: string
  components: {
    [name: string]: {
      details?: {
        [key: string]:
          | string
          | {
              [key: string]: string
            }
      }
      status: string
    }
  }
}
