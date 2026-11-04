<template>
    <dialog
        ref="dialogEl"
        class="app-panel-dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @cancel.prevent="onClose"
        @close="onDialogClose"
    >
        <div class="app-panel-dialog-inner">
            <header class="app-panel-dialog-header">
                <h2 :id="titleId" class="app-panel-dialog-title">{{ title }}</h2>
                <RandomNumberActionButton
                    ref="closeButtonEl"
                    variant="ghost"
                    @click="onClose"
                >
                    {{ closeLabel }}
                </RandomNumberActionButton>
            </header>
            <div class="app-panel-dialog-body">
                <slot />
            </div>
        </div>
    </dialog>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, useId, watch, type ComponentPublicInstance } from "vue"
import RandomNumberActionButton from "./RandomNumberActionButton.vue"

const props = withDefaults(
    defineProps<{
        open: boolean
        title: string
        closeLabel?: string
    }>(),
    {
        closeLabel: "Done",
    },
)

const emit = defineEmits<{
    close: []
}>()

const titleId = useId()
const dialogEl = ref<HTMLDialogElement | null>(null)
const closeButtonEl = ref<ComponentPublicInstance | null>(null)

const focusCloseButton = (instance: ComponentPublicInstance | null) => {
    const el = instance?.$el
    if (el instanceof HTMLElement) {
        el.focus()
    }
}

const focusInitial = async () => {
    await nextTick()
    focusCloseButton(closeButtonEl.value)
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

const onClose = () => {
    emit("close")
}

const onDialogClose = () => {
    if (props.open) {
        emit("close")
    }
}
</script>

<style scoped>
.app-panel-dialog {
    box-sizing: border-box;
    width: min(100vw - 32px, 480px);
    max-height: min(90vh, 720px);
    margin: auto;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);
    padding: 0;
    background: var(--app-surface-elevated);
    color: var(--app-text);
    font-family: var(--app-font);
}

.app-panel-dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
}

.app-panel-dialog-inner {
    display: flex;
    flex-direction: column;
    max-height: min(90vh, 720px);
    /* Keep scroll inside .app-panel-dialog-body on short viewports (flex + min-height: 0). */
    overflow: hidden;
}

.app-panel-dialog-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--app-border);
    flex-shrink: 0;
}

.app-panel-dialog-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.app-panel-dialog-body {
    overflow: auto;
    padding: 20px;
    flex: 1;
    min-height: 0;
}

@media (max-width: 480px) {
    .app-panel-dialog {
        width: min(100vw - 24px, 480px);
    }

    .app-panel-dialog-header,
    .app-panel-dialog-body {
        padding-inline: 16px;
    }
}
</style>
