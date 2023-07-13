import { MBeanNode } from '@hawtiosrc/plugins/shared'

export class CamelRoute {
  constructor(
    public node: MBeanNode,
    public routeId: string,
    public state: string | null,
    public uptime: string,
    public exchangesCompleted: number,
    public exchangesFailed: number,
    public failuresHandled: number,
    public exchangesTotal: number,
    public exchangesInflight: number,
    public meanProcessingTime: number,
  ) {}

  toArrayForSort(): (number | string)[] {
    const {
      routeId,
      state,
      uptime,
      exchangesCompleted,
      exchangesFailed,
      failuresHandled,
      exchangesTotal,
      exchangesInflight,
      meanProcessingTime,
    } = this

    return [
      routeId,
      state ?? '',
      uptime,
      exchangesCompleted,
      exchangesFailed,
      failuresHandled,
      exchangesTotal,
      exchangesInflight,
      meanProcessingTime,
    ]
  }
}
