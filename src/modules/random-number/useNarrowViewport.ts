import { onMounted, onUnmounted, ref } from "vue"

/** Narrow layout at viewport width ≤ this value (px); wide layout from 960px up. */
export const NARROW_VIEWPORT_MAX_WIDTH_PX = 959

export const NARROW_VIEWPORT_QUERY = `(max-width: ${NARROW_VIEWPORT_MAX_WIDTH_PX}px)`

const readIsNarrowViewport = () => window.matchMedia(NARROW_VIEWPORT_QUERY).matches

export const useNarrowViewport = () => {
    const isNarrowViewport = ref(readIsNarrowViewport())

    const syncNarrowViewport = () => {
        isNarrowViewport.value = readIsNarrowViewport()
    }

    let narrowViewportMedia: MediaQueryList | null = null

    onMounted(() => {
        narrowViewportMedia = window.matchMedia(NARROW_VIEWPORT_QUERY)
        syncNarrowViewport()
        narrowViewportMedia.addEventListener("change", syncNarrowViewport)
        window.addEventListener("resize", syncNarrowViewport)
    })

    onUnmounted(() => {
        if (narrowViewportMedia) {
            narrowViewportMedia.removeEventListener("change", syncNarrowViewport)
        }
        window.removeEventListener("resize", syncNarrowViewport)
    })

    return { isNarrowViewport }
}
