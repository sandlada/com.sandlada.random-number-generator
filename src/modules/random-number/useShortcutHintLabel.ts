import { computed, onMounted, ref } from "vue"

const SHORTCUT_HINTS = {
    undo: { mac: "⌘Z", default: "Ctrl+Z" },
} as const

export type ShortcutHintKey = keyof typeof SHORTCUT_HINTS

export const readIsMacPlatform = (): boolean => {
    if (typeof navigator === "undefined") return false

    const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
    if (uaData?.platform) {
        return uaData.platform === "macOS"
    }

    const platform = navigator.platform ?? ""
    return /Mac/i.test(platform)
}

export const useShortcutHintLabel = (key: ShortcutHintKey) => {
    const isMac = ref(false)

    onMounted(() => {
        isMac.value = readIsMacPlatform()
    })

    const hintLabel = computed(() =>
        isMac.value ? SHORTCUT_HINTS[key].mac : SHORTCUT_HINTS[key].default,
    )

    return { hintLabel }
}

export const useUndoShortcutHint = () => {
    const { hintLabel } = useShortcutHintLabel("undo")
    const undoAriaLabel = computed(() => `Undo last (${hintLabel.value})`)
    return { undoHintLabel: hintLabel, undoAriaLabel }
}
