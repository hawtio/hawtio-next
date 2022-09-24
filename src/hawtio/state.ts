export interface Config {
  branding?: Branding
  login?: Login
  about?: About
  disabledRoutes?: string[]
}

export interface Branding {
  [key: string]: string
}

export interface Login {
  description?: string
  links?: LoginLink[]
}

export interface LoginLink {
  url: string
  text: string
}

export interface About {
  title?: string
  description?: string
  productInfo?: AboutProductInfo[]
}

export interface AboutProductInfo {
  name: string
  value: string
}

export class HawtioState {
  config?: Config
}
