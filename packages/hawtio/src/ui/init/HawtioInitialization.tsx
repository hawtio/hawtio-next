import React, { useEffect, useState } from "react"

import { configManager } from "@hawtiosrc/core/config-manager"

export type Config = Record<string, { ready: boolean, group: string }>

export const HawtioInitialization: React.FC = () => {

  const [ config, setConfig ] = useState<Config>(configManager.getConfig())

  useEffect(() => {
    const listener = (config: Config) => {
      setConfig({ ...config })

      for (const item in config) {
        if (config[item]?.group === "finish") {
          configManager.setConfigItem("Finish", true, "finish")
          break
        }
      }
    }
    configManager.addListener(listener)
    return () => {
      configManager.removeListener(listener)
    }
  }, [])

  const items: { item: string, ready: boolean }[] = []
  const plugins: { item: string, ready: boolean }[] = []
  let finish = false
  for (const item in config) {
    if (config[item]?.group === "plugins") {
      plugins.push({ item: item, ready: config[item] ? config[item]!.ready : false })
    } else if (config[item]?.group === "finish") {
      finish = true
    } else {
      items.push({ item: item, ready: config[item] ? config[item]!.ready : false })
    }
  }

  return (
      <>
        <div className="hwt-loading">
          <h4 className={finish ? "ready" : "not-ready"}>Hawtio initialization ...</h4>
          {items.length > 0 ? (<ul>
            {
              items.map((el: { item: string, ready: boolean }, idx: number) =>
                  (<li key={idx} className={el.ready ? "ready" : "not-ready"}><span>{el.ready ? "✅" : ""}</span>{el.item}</li>))
            }
          </ul>) : null}
          {plugins.length > 0 ? (<>
            <h4 className={finish ? "ready" : "not-ready"}>Hawtio plugins ...</h4>
            <ul>
            {

              plugins.map((el: { item: string, ready: boolean }, idx: number) =>
                  (<li key={idx} className={el.ready ? "ready" : "not-ready"}><span>{el.ready ? "✅" : ""}</span>{el.item}</li>))
            }
            </ul>
          </>) : null}
        </div>
      </>
  )
}
