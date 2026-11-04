import { describe, expect, it, vi } from "vitest"
import { useAppBanner } from "./useAppBanner"

describe("useAppBanner", () => {
    it("queues timed flashes while a message is visible", () => {
        vi.useFakeTimers()
        const { message, visible, flash } = useAppBanner()

        flash("First", 1000)
        expect(visible.value).toBe(true)
        expect(message.value).toBe("First")

        flash("Second", 1000)
        expect(message.value).toBe("First")

        vi.advanceTimersByTime(1000)
        expect(message.value).toBe("Second")

        vi.advanceTimersByTime(1000)
        expect(visible.value).toBe(false)
        vi.useRealTimers()
    })

    it("replaces a sticky banner when flashing completion", () => {
        vi.useFakeTimers()
        const { message, visible, show, flash } = useAppBanner()

        show("Adding 25/100…", { durationMs: null })
        expect(message.value).toBe("Adding 25/100…")
        vi.advanceTimersByTime(5000)
        expect(message.value).toBe("Adding 25/100…")

        flash("Added 100 numbers", 2000)
        expect(message.value).toBe("Added 100 numbers")

        vi.advanceTimersByTime(2000)
        expect(visible.value).toBe(false)
        vi.useRealTimers()
    })
})
