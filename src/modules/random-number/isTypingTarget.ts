const isEditableContentRoot = (element: HTMLElement) =>
    element.closest('[contenteditable]:not([contenteditable="false"])') !== null

const isElementTypingContext = (element: HTMLElement) => {
    const tag = element.tagName
    if (tag === "INPUT" || tag === "TEXTAREA") return true
    if (element.isContentEditable) return true
    return isEditableContentRoot(element)
}

/** True when focus is in a field where letter keys should type, not trigger app shortcuts. */
export function isTypingTarget(eventTarget: EventTarget | null) {
    const elements: HTMLElement[] = []
    if (eventTarget instanceof HTMLElement) {
        elements.push(eventTarget)
    }
    const active = document.activeElement
    if (active instanceof HTMLElement && active !== eventTarget) {
        elements.push(active)
    }
    return elements.some(isElementTypingContext)
}
