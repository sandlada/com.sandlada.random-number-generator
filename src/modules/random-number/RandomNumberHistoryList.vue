<template>
    <p v-if="!props.history.length" class="empty">No history yet.</p>
    <ul
        v-else
        ref="listRef"
        class="history"
        :class="{ 'history--manage': props.manageMode }"
        :role="props.manageMode ? 'list' : 'listbox'"
        :aria-label="props.manageMode ? 'Manage history order' : 'History values'"
    >
        <li
            v-for="({ value, id }, index) in props.history"
            :key="id"
            class="item"
            :class="{
                'item--current': id === props.currentId,
                'item--manage': props.manageMode,
                'item--dragging': props.manageMode && dragFromIndex === index,
                'item--drop-target': props.manageMode && dragOverIndex === index && dragFromIndex !== index,
            }"
            :draggable="props.manageMode"
            :tabindex="0"
            :role="props.manageMode ? 'listitem' : 'option'"
            :aria-selected="!props.manageMode && id === props.currentId"
            :aria-grabbed="props.manageMode && dragFromIndex === index ? 'true' : undefined"
            :title="props.manageMode ? manageItemHint : itemHint"
            @click="(event: MouseEvent) => !props.manageMode && handleSelect(event, id, value)"
            @keydown="(e: KeyboardEvent) => handleItemKeyDown(e, id, value, index)"
            @dragstart="(e: DragEvent) => props.manageMode && onDragStart(e, index)"
            @dragend="onDragEnd"
            @dragover.prevent="props.manageMode && onDragOver(index)"
            @dragenter.prevent="props.manageMode && onDragEnter(index)"
            @dragleave="props.manageMode && onDragLeave(index)"
            @drop.prevent="props.manageMode && onDrop(index)"
        >
            {{ formattedValue(value) }}
            <button
                v-if="props.manageMode"
                type="button"
                class="manage-btn manage-btn-remove"
                aria-label="Remove from history"
                @click.stop="() => handleRemove(id, value)"
            >
                ×
            </button>
        </li>
    </ul>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { formatRandomNumber } from "./generator"

const listRef = ref<HTMLUListElement | null>(null)
const dragFromIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const props = defineProps<{
    history: Array<{ id: string; value: number }>
    decimals?: number
    currentId?: string
    manageMode?: boolean
}>()

const itemHint = "Click to show in hero · Shift+click to copy · Arrow keys to move focus"
const manageItemHint = "Drag to reorder · × to remove"

const emits = defineEmits<{
    select: [id: string, value: number, copyToClipboard: boolean]
    remove: [id: string, value: number]
    reorder: [displayOrderedIds: string[]]
}>()

const handleSelect = (event: MouseEvent, id: string, value: number) => {
    emits("select", id, value, event.shiftKey)
}

const handleRemove = (id: string, value: number) => {
    emits("remove", id, value)
}

const reorderDisplayIds = (fromIndex: number, toIndex: number): string[] => {
    const ids = props.history.map((entry) => entry.id)
    const [moved] = ids.splice(fromIndex, 1)
    if (!moved) return ids
    ids.splice(toIndex, 0, moved)
    return ids
}

const onDragStart = (event: DragEvent, index: number) => {
    dragFromIndex.value = index
    dragOverIndex.value = index
    event.dataTransfer?.setData("text/plain", String(index))
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move"
    }
}

const onDragEnd = () => {
    dragFromIndex.value = null
    dragOverIndex.value = null
}

const onDragOver = (index: number) => {
    if (dragFromIndex.value === null) return
    dragOverIndex.value = index
}

const onDragEnter = (index: number) => {
    if (dragFromIndex.value === null) return
    dragOverIndex.value = index
}

const onDragLeave = (index: number) => {
    if (dragOverIndex.value === index) {
        dragOverIndex.value = null
    }
}

const onDrop = (toIndex: number) => {
    const fromIndex = dragFromIndex.value
    onDragEnd()
    if (fromIndex === null || fromIndex === toIndex) return
    emits("reorder", reorderDisplayIds(fromIndex, toIndex))
}

const formattedValue = (value: number) => formatRandomNumber(value, props.decimals ?? 0)

const focusItemAt = (index: number) => {
    const items = listRef.value?.querySelectorAll<HTMLElement>(".item")
    items?.[index]?.focus()
}

const handleItemKeyDown = (
    e: KeyboardEvent,
    id: string,
    value: number,
    index: number,
) => {
    if (props.manageMode) {
        if (e.code === "Delete" || e.code === "Backspace") {
            e.preventDefault()
            handleRemove(id, value)
            return
        }
        if (e.code === "ArrowRight" || e.code === "ArrowDown") {
            e.preventDefault()
            if (index < props.history.length - 1) focusItemAt(index + 1)
            return
        }
        if (e.code === "ArrowLeft" || e.code === "ArrowUp") {
            e.preventDefault()
            if (index > 0) focusItemAt(index - 1)
            return
        }
        if (e.code === "Home") {
            e.preventDefault()
            focusItemAt(0)
            return
        }
        if (e.code === "End") {
            e.preventDefault()
            focusItemAt(props.history.length - 1)
            return
        }
        return
    }

    if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        emits("select", id, value, e.shiftKey)
        return
    }
    if (e.code === "ArrowRight" || e.code === "ArrowDown") {
        e.preventDefault()
        if (index < props.history.length - 1) focusItemAt(index + 1)
        return
    }
    if (e.code === "ArrowLeft" || e.code === "ArrowUp") {
        e.preventDefault()
        if (index > 0) focusItemAt(index - 1)
        return
    }
    if (e.code === "Home") {
        e.preventDefault()
        focusItemAt(0)
        return
    }
    if (e.code === "End") {
        e.preventDefault()
        focusItemAt(props.history.length - 1)
    }
}
</script>

<style scoped>
.empty {
    margin: 0;
    padding: 20px 16px;
    text-align: center;
    font-size: 13px;
    color: var(--app-text-secondary);
    border: 1px dashed var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-bg-subtle);
}

.history {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.item {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-bg-subtle);
    color: var(--app-text);
    font-family: var(--app-font-mono);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    outline: none;
    transition: border-color 120ms ease, background 120ms ease;
}

.item--manage {
    cursor: grab;
    padding-right: 6px;
    gap: 6px;
    touch-action: none;
}

.item--manage:active {
    cursor: grabbing;
}

.item--dragging {
    opacity: 0.55;
}

.item--drop-target {
    border-color: var(--app-accent);
    background: var(--app-subtle-hover-bg, #ebf2ff);
}

.item--current {
    border-color: var(--app-accent);
    background: var(--md-sys-color-secondary-container);
}

.item:not(.item--manage):hover,
.item:not(.item--manage):focus-visible {
    border-color: var(--app-accent);
    background: var(--md-sys-color-secondary-container);
}

.manage-btn-remove {
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--app-text-muted);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
}

.manage-btn-remove:hover:not(:disabled),
.manage-btn-remove:focus-visible {
    background: var(--app-subtle-hover-bg, #ebf2ff);
    color: var(--app-danger);
}

@media (max-width: 639px) {
    .item {
        min-height: 44px;
        padding: 10px 12px;
        font-size: 14px;
    }

    .item--manage {
        padding-right: 8px;
    }

    .manage-btn-remove {
        min-width: 36px;
        height: 36px;
    }
}
</style>
