<template>
    <dialog
        ref="dialogEl"
        class="app-modal"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="messageId"
        @cancel.prevent="onCancel"
        @close="onDialogClose"
    >
        <form class="app-modal-form" method="dialog" @submit.prevent="onSubmit" @keydown.enter="onFormEnter">
            <h2 :id="titleId" class="app-modal-title">{{ title }}</h2>
            <p :id="messageId" class="app-modal-message">{{ message }}</p>
            <label v-if="mode === 'prompt'" class="field">
                <span class="field-label">{{ fieldLabel }}</span>
                <input
                    ref="promptInputEl"
                    v-model="promptModel"
                    type="text"
                    class="field-input"
                    :maxlength="maxLength"
                    autocomplete="off"
                />
            </label>
            <div class="app-modal-actions">
                <RandomNumberActionButton ref="cancelButtonEl" @click="onCancel">
                    {{ cancelLabel }}
                </RandomNumberActionButton>
                <RandomNumberActionButton
                    ref="confirmButtonEl"
                    type="submit"
                    :variant="destructive ? 'destructive-solid' : 'primary'"
                >
                    {{ confirmLabel }}
                </RandomNumberActionButton>
            </div>
        </form>
    </dialog>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, useId, watch, type ComponentPublicInstance } from "vue"
import RandomNumberActionButton from "./RandomNumberActionButton.vue"

const props = defineProps<{
    open: boolean
    mode: "confirm" | "prompt"
    title: string
    message: string
    fieldLabel: string
    promptValue: string
    maxLength: number
    confirmLabel: string
    cancelLabel: string
    destructive: boolean
}>()

const emit = defineEmits<{
    cancel: []
    confirm: []
    "update:promptValue": [value: string]
}>()

const titleId = useId()
const messageId = useId()

const dialogEl = ref<HTMLDialogElement | null>(null)
const promptInputEl = ref<HTMLInputElement | null>(null)
const confirmButtonEl = ref<ComponentPublicInstance | null>(null)
const cancelButtonEl = ref<ComponentPublicInstance | null>(null)

const focusActionButton = (instance: ComponentPublicInstance | null) => {
    const el = instance?.$el
    if (el instanceof HTMLElement) {
        el.focus()
    }
}

const promptModel = ref(props.promptValue)

watch(
    () => props.promptValue,
    (value) => {
        promptModel.value = value
    },
)

watch(promptModel, (value) => {
    emit("update:promptValue", value)
})

const focusInitial = async () => {
    await nextTick()
    if (props.mode === "prompt") {
        promptInputEl.value?.focus()
        promptInputEl.value?.select()
        return
    }
    if (props.destructive) {
        focusActionButton(cancelButtonEl.value)
    } else {
        focusActionButton(confirmButtonEl.value)
    }
}

const showDialog = async () => {
    const dialog = dialogEl.value
    if (!dialog || dialog.open) return
    dialog.showModal()
    await focusInitial()
}

const hideDialog = () => {
    dialogEl.value?.close()
}

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) void showDialog()
        else hideDialog()
    },
)

onMounted(() => {
    if (props.open) void showDialog()
})

const onSubmit = () => {
    emit("confirm")
}

const onFormEnter = (event: KeyboardEvent) => {
    if (props.mode === "prompt") return
    if (props.destructive) return
    event.preventDefault()
    onSubmit()
}

const onCancel = () => {
    emit("cancel")
}

const onDialogClose = () => {
    if (props.open) {
        emit("cancel")
    }
}
</script>

<style scoped>
.app-modal {
    box-sizing: border-box;
    width: min(100vw - 32px, 420px);
    margin: auto;
    max-height: min(90vh, 100dvh);
    overflow: auto;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);
    padding: 0;
    background: var(--app-surface-elevated);
    color: var(--app-text);
    font-family: var(--app-font);
}

.app-modal::backdrop {
    background: rgb(0 0 0 / 0.45);
}

.app-modal-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
}

.app-modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.app-modal-message {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--app-text-secondary);
}

.field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.field-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--app-text-secondary);
}

.field-input {
    height: 32px;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    padding-inline: 10px;
    background: var(--app-surface);
    color: var(--app-text);
    font-family: inherit;
}

.app-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
}

@media (max-width: 480px) {
    .app-modal {
        width: min(100vw - 24px, 288px);
    }

    .app-modal-form {
        padding-inline: 16px;
    }
}

@media (min-width: 481px) and (max-width: 639px) {
    .app-modal {
        width: min(100vw - 32px, 368px);
    }
}
</style>
