import { createApp, defineComponent, h, nextTick } from "vue"
import { afterEach, describe, expect, it, vi } from "vitest"
import { NARROW_VIEWPORT_QUERY, useNarrowViewport } from "./useNarrowViewport"

function installMatchMedia(initialMatches: boolean) {
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    let matches = initialMatches
    const mql = {
        get matches() {
            return matches
        },
        media: NARROW_VIEWPORT_QUERY,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
            listeners.add(listener as (event: MediaQueryListEvent) => void)
        },
        removeEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
            listeners.delete(listener as (event: MediaQueryListEvent) => void)
        },
        dispatchEvent: () => true,
    } as MediaQueryList

    vi.stubGlobal("matchMedia", (query: string) => {
        expect(query).toBe(NARROW_VIEWPORT_QUERY)
        return mql
    })

    return {
        setMatches(next: boolean) {
            matches = next
            for (const listener of listeners) {
                listener({ matches: next } as MediaQueryListEvent)
            }
        },
    }
}

async function mountNarrowViewport(initialMatches: boolean) {
    const media = installMatchMedia(initialMatches)
    let isNarrowViewport: ReturnType<typeof useNarrowViewport>["isNarrowViewport"] | undefined

    const Comp = defineComponent({
        setup() {
            const result = useNarrowViewport()
            isNarrowViewport = result.isNarrowViewport
            return () => h("div")
        },
    })

    const root = document.createElement("div")
    const app = createApp(Comp)
    app.mount(root)
    await nextTick()

    return {
        isNarrowViewport: isNarrowViewport!,
        media,
        unmount: () => app.unmount(),
    }
}

describe("useNarrowViewport", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("reflects matchMedia and updates on change", async () => {
        const { isNarrowViewport, media, unmount } = await mountNarrowViewport(true)
        expect(isNarrowViewport.value).toBe(true)

        media.setMatches(false)
        await nextTick()
        expect(isNarrowViewport.value).toBe(false)

        unmount()
    })
})
