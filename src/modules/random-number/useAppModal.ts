import { nextTick, reactive, toRefs } from "vue"

export type AppModalConfirmOptions = {
    title?: string
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
}

export type AppModalPromptOptions = AppModalConfirmOptions & {
    fieldLabel?: string
    maxLength?: number
}

export const useAppModal = () => {
    const state = reactive({
        open: false,
        mode: "confirm" as "confirm" | "prompt",
        title: "Confirm",
        message: "",
        fieldLabel: "",
        promptValue: "",
        maxLength: 32,
        confirmLabel: "OK",
        cancelLabel: "Cancel",
        destructive: false,
    })

    let resolvePending: ((value: boolean | string | null) => void) | null = null

    const reset = () => {
        state.open = false
        resolvePending = null
    }

    const confirm = (text: string, options: AppModalConfirmOptions = {}): Promise<boolean> => {
        state.mode = "confirm"
        state.message = text
        state.title = options.title ?? "Confirm"
        state.confirmLabel = options.confirmLabel ?? "Continue"
        state.cancelLabel = options.cancelLabel ?? "Cancel"
        state.destructive = options.destructive ?? false
        state.open = true
        return new Promise((resolve) => {
            resolvePending = (value) => resolve(value === true)
        })
    }

    const prompt = (
        text: string,
        initialValue: string,
        options: AppModalPromptOptions = {},
    ): Promise<string | null> => {
        state.mode = "prompt"
        state.message = text
        state.title = options.title ?? "Rename"
        state.fieldLabel = options.fieldLabel ?? "Name"
        state.promptValue = initialValue
        state.maxLength = options.maxLength ?? 32
        state.confirmLabel = options.confirmLabel ?? "Save"
        state.cancelLabel = options.cancelLabel ?? "Cancel"
        state.destructive = false
        state.open = true
        return new Promise((resolve) => {
            resolvePending = (value) => {
                if (typeof value === "string") resolve(value)
                else resolve(null)
            }
        })
    }

    const submitConfirm = () => {
        const resolve = resolvePending
        reset()
        resolve?.(true)
    }

    const submitPrompt = () => {
        const resolve = resolvePending
        const value = state.promptValue.trim()
        reset()
        resolve?.(value || null)
    }

    const cancel = () => {
        const resolve = resolvePending
        const wasPrompt = state.mode === "prompt"
        reset()
        resolve?.(wasPrompt ? null : false)
    }

    const focusPromptInput = async (focus: () => void) => {
        await nextTick()
        focus()
    }

    return {
        ...toRefs(state),
        confirm,
        prompt,
        submitConfirm,
        submitPrompt,
        cancel,
        focusPromptInput,
    }
}
