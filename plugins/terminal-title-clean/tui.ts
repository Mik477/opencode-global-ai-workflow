import type { TuiPluginModule } from "@opencode-ai/plugin/tui"

const PREFIX = "OC | "
const DEFAULT_TITLE = /^(New session - |Child session - )\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

export function cleanTerminalTitle(title: string): string {
  const cleaned = title.startsWith(PREFIX) ? title.slice(PREFIX.length) : title
  if (!cleaned || DEFAULT_TITLE.test(cleaned)) return "OpenCode"
  const characters = Array.from(cleaned)
  return characters.length > 40 ? characters.slice(0, 37).join("") + "..." : cleaned
}

const plugin = {
  id: "terminal-title-clean",
  tui: async (api) => {
    const renderer = api.renderer
    const originallyOwned = Object.hasOwn(renderer, "setTerminalTitle")
    const original = renderer.setTerminalTitle
    const setTerminalTitle = (title: string) => {
      original.call(renderer, cleanTerminalTitle(title))
    }

    renderer.setTerminalTitle = setTerminalTitle

    const route = api.route.current
    if (route.name === "home") {
      setTerminalTitle("OpenCode")
    } else if (route.name === "session") {
      const sessionID = route.params?.sessionID
      const session = typeof sessionID === "string" ? api.state.session.get(sessionID) : undefined
      const title = session?.title
      setTerminalTitle(title ?? "OpenCode")
    } else {
      setTerminalTitle(route.name)
    }

    api.lifecycle.onDispose(() => {
      if (renderer.setTerminalTitle === setTerminalTitle) {
        if (originallyOwned) renderer.setTerminalTitle = original
        else Reflect.deleteProperty(renderer, "setTerminalTitle")
      }
    })
  },
} satisfies TuiPluginModule & { id: string }

export default plugin
