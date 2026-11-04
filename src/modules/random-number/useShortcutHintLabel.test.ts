import { createApp, defineComponent, h, nextTick } from "vue"
import { afterEach, describe, expect, it, vi } from "vitest"
import { readIsMacPlatform, useUndoShortcutHint } from "./useShortcutHintLabel"

function stubNavigator(platform: string | undefined, userAgentDataPlatform?: string) {
    vi.stubGlobal("navigator", {
        platform,
        userAgentData: userAgentDataPlatform ? { platform: userAgentDataPlatform } : undefined,
    })
}

async function mountUndoHint() {
    let undoHintLabel: ReturnType<typeof useUndoShortcutHint>["undoHintLabel"] | undefined
    let undoAriaLabel: ReturnType<typeof useUndoShortcutHint>["undoAriaLabel"] | undefined

    const Comp = defineComponent({
        setup() {
            const result = useUndoShortcutHint()
            undoHintLabel = result.undoHintLabel
            undoAriaLabel = result.undoAriaLabel
            return () => h("div")
        },
    })

    const root = document.createElement("div")
    const app = createApp(Comp)
    app.mount(root)
    await nextTick()

    return {
        undoHintLabel: undoHintLabel!,
        undoAriaLabel: undoAriaLabel!,
        unmount: () => app.unmount(),
    }
}

describe("readIsMacPlatform", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("prefers userAgentData.platform", () => {
        stubNavigator("Win32", "macOS")
        expect(readIsMacPlatform()).toBe(true)

        stubNavigator("MacIntel", "Windows")
        expect(readIsMacPlatform()).toBe(false)
    })

    it("falls back to navigator.platform", () => {
        stubNavigator("MacIntel")
        expect(readIsMacPlatform()).toBe(true)

        stubNavigator("Win32")
        expect(readIsMacPlatform()).toBe(false)
    })
})

describe("useUndoShortcutHint", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("defaults to Ctrl+Z before mount resolves platform", async () => {
        stubNavigator("Win32")
        const { undoHintLabel, undoAriaLabel, unmount } = await mountUndoHint()
        expect(undoHintLabel.value).toBe("Ctrl+Z")
        expect(undoAriaLabel.value).toBe("Undo last (Ctrl+Z)")
        unmount()
    })

    it("uses ⌘Z on macOS after mount", async () => {
        stubNavigator("MacIntel", "macOS")
        const { undoHintLabel, undoAriaLabel, unmount } = await mountUndoHint()
        expect(undoHintLabel.value).toBe("⌘Z")
        expect(undoAriaLabel.value).toBe("Undo last (⌘Z)")
        unmount()
    })
})
