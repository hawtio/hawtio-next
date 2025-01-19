import { joinPaths } from '@hawtiosrc/util/urls'
import { log } from './globals'

export interface RouteOptions {
  index?: boolean
  pathExp: string
  path: string
  parent: string
}

export class RouteService {
  private formatRegExp(str: string) {
    // Escape all special characters except for *
    let s = str.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

    // Replace star with .*
    s = s.replace('/*', '(/.*)?')

    // Make the final / optional
    s = s.replace(/\/$/, '(\\/)?')

    // Add ^ and $ to match the whole string from the start to the end
    return '^' + s + '$'
  }

  private pathExpToPath(pathExp: string) {
    // Removes wilcards and any double-slashes
    return pathExp.replace('*', '').replace('//', '/')
  }

  resolvePath(parent: string, path?: string, index?: boolean) {
    let resolvedPath, resolvedPathExp

    if (index) {
      resolvedPath = joinPaths(parent, '/')
      resolvedPathExp = resolvedPath
    } else {
      if (!path) {
        // If index not defined then path must be
        throw new Error('Route must have either a path or index attribute')
      }

      resolvedPath = joinPaths(parent, this.pathExpToPath(path))
      resolvedPathExp = joinPaths(parent, path)
    }

    return { path: resolvedPath, pathExp: resolvedPathExp }
  }

  private getParent(path: string) {
    return path.substring(0, path.lastIndexOf('/') + 1)
  }

  isRouteApplicable(testRoute: string, options: RouteOptions): boolean {
    if (!options.index && !options.path) {
      throw new Error('Testing if route is applicable, either index or path is required')
    }

    log.debug(
      `Testing Route Applicable ${testRoute}, getParent() ${this.getParent(testRoute)}, options {path: ${options.path} pathExp: ${options.pathExp} index: ${options.index}}`,
    )

    if (options.index && this.getParent(testRoute) === options.parent) {
      log.debug(`Path applicable to ${testRoute} is ${options.pathExp} (${options.path}) due to index`)
      return true
    }

    if (testRoute === options.path) {
      log.debug(`Path applicable to ${testRoute} is ${options.pathExp} (${options.path}) straight match ==`)
      return true // straight match
    }

    if (testRoute === '/' && options.pathExp === '/*') {
      log.debug(`Path applicable to ${testRoute} is ${options.pathExp} (${options.path}) pathExp /* ==`)
      return true // better than trying to check / drop slashes
    }

    const regex = new RegExp(this.formatRegExp(options.pathExp), 'g')
    log.debug(regex)
    if (testRoute.match(regex)) {
      log.debug(`Path applicable to ${testRoute} is ${options.pathExp} (${options.path}) due to regex ==`)
      return true
    }

    log.debug(`Path ${options.pathExp} (${options.path}) NOT applicable to ${testRoute}`)
    return false
  }
}

export const routeService = new RouteService()
