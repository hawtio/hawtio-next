import React, { useEffect, useState } from "react"

import { configManager, type InitializationTasks, TaskState } from "@hawtiosrc/core/config-manager"

export const HawtioInitialization: React.FC = () => {

  const [ tasks, setTasks ] = useState<InitializationTasks>(configManager.getInitializationTasks())

  useEffect(() => {
    const listener = (tasks: InitializationTasks) => {
      setTasks({ ...tasks })

      for (const item in tasks) {
        if (tasks[item]?.group === "finish") {
          configManager.initItem("Finish", TaskState.finished, "finish")
          break
        }
      }
    }
    configManager.addInitListener(listener)
    return () => {
      configManager.removeInitListener(listener)
    }
  }, [])

  const items: { item: string, ready: TaskState }[] = []
  const plugins: { item: string, ready: TaskState }[] = []
  let finish = false

  for (const item in tasks) {
    if (tasks[item]?.group === "plugins") {
      plugins.push({ item: item, ready: tasks[item] ? tasks[item]!.ready : TaskState.started })
    } else if (tasks[item]?.group === "finish") {
      finish = true
    } else {
      items.push({ item: item, ready: tasks[item] ? tasks[item]!.ready : TaskState.started })
    }
  }

  function icon(state: TaskState): string {
    switch (state) {
      case TaskState.skipped:
        return "➖"
      case TaskState.finished:
        return "✅"
      case TaskState.error:
        return "❌"
      case TaskState.started:
      default:
        return "❔"
    }
  }

  return (
      <>
        <div className="hwt-loading">
          <h4 className={finish ? "ready" : "not-ready"}>Hawtio initialization ...</h4>
          {items.length > 0 ? (<ul>
            {
              items.map((el: { item: string, ready: TaskState }, idx: number) =>
                <li key={idx} className={el.ready == TaskState.started ? "not-ready" : "ready"}><span>{icon(el.ready)}</span>{el.item}</li>
              )
            }
          </ul>) : null}
          {plugins.length > 0 ? (<>
            <h4 className={finish ? "ready" : "not-ready"}>Hawtio plugins ...</h4>
            <ul>
            {
              plugins.map((el: { item: string, ready: TaskState }, idx: number) =>
                <li key={idx} className={el.ready == TaskState.started ? "not-ready" : "ready"}><span>{icon(el.ready)}</span>{el.item}</li>
              )
            }
            </ul>
          </>) : null}
        </div>
      </>
  )
}
