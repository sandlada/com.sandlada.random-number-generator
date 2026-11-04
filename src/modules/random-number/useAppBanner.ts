import { ref } from "vue"

export type AppBannerShowOptions = {
    /** Milliseconds until auto-hide; `null` keeps the banner until the next show/hide. */
    durationMs?: number | null
}

type BannerQueueItem = {
    text: string
    durationMs: number
}

export const useAppBanner = () => {
    const message = ref("")
    const visible = ref(false)

    let hideTimer: ReturnType<typeof setTimeout> | null = null
    const queue: BannerQueueItem[] = []

    const clearHideTimer = () => {
        if (hideTimer) clearTimeout(hideTimer)
        hideTimer = null
    }

    const hide = () => {
        clearHideTimer()
        visible.value = false
        message.value = ""
        flushQueue()
    }

    const flushQueue = () => {
        const next = queue.shift()
        if (!next) return
        showTimed(next.text, next.durationMs)
    }

    const showTimed = (text: string, durationMs: number) => {
        clearHideTimer()
        message.value = text
        visible.value = true
        hideTimer = setTimeout(() => {
            hideTimer = null
            visible.value = false
            message.value = ""
            flushQueue()
        }, durationMs)
    }

    const show = (text: string, options: AppBannerShowOptions = {}) => {
        if (options.durationMs === null) {
            clearHideTimer()
            message.value = text
            visible.value = true
            return
        }

        const durationMs = options.durationMs ?? 2000

        if (visible.value) {
            queue.push({ text, durationMs })
            return
        }

        showTimed(text, durationMs)
    }

    const flash = (text: string, durationMs = 2000) => {
        // Replace a sticky progress banner (show with durationMs: null) instead of queueing behind it.
        if (visible.value && hideTimer === null) {
            showTimed(text, durationMs)
            return
        }
        show(text, { durationMs })
    }

    return {
        message,
        visible,
        show,
        hide,
        flash,
    }
}
