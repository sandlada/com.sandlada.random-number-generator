import { afterEach, describe, expect, it } from "vitest"
import { isTypingTarget } from "./isTypingTarget"

describe("isTypingTarget", () => {
    afterEach(() => {
        document.body.innerHTML = ""
        document.body.focus()
    })

    it("returns false for non-editable surfaces", () => {
        const button = document.createElement("button")
        document.body.append(button)
        button.focus()
        expect(isTypingTarget(button)).toBe(false)
        expect(isTypingTarget(document.body)).toBe(false)
    })

    it("treats input and textarea as typing targets", () => {
        const input = document.createElement("input")
        input.type = "text"
        document.body.append(input)
        input.focus()
        expect(isTypingTarget(input)).toBe(true)

        const textarea = document.createElement("textarea")
        document.body.append(textarea)
        textarea.focus()
        expect(isTypingTarget(textarea)).toBe(true)
    })

    it("uses activeElement when event target is not the focused field", () => {
        const input = document.createElement("input")
        document.body.append(input)
        input.focus()
        expect(isTypingTarget(document.body)).toBe(true)
    })

    it("treats contenteditable and descendants as typing targets", () => {
        const editable = document.createElement("div")
        editable.setAttribute("contenteditable", "true")
        const inner = document.createElement("span")
        editable.append(inner)
        document.body.append(editable)
        editable.focus()
        expect(isTypingTarget(editable)).toBe(true)

        inner.focus()
        expect(isTypingTarget(inner)).toBe(true)
    })
})
