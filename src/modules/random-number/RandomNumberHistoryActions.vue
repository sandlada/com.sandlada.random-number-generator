<template>
    <RandomNumberActionButton
        v-if="showRestoreCleared"
        variant="ghost"
        @click="emit('restore-cleared')"
    >
        Restore Cleared
    </RandomNumberActionButton>
    <RandomNumberActionButton
        variant="ghost"
        :aria-label="undoAriaLabel"
        :disabled="!historyHasEntries"
        @click="emit('undo-last')"
    >
        Undo Last <span class="hint" aria-hidden="true">{{ undoHintLabel }}</span>
    </RandomNumberActionButton>
    <RandomNumberActionButton
        variant="ghost"
        aria-label="Copy all history (Shift+C)"
        :disabled="!exportHasEntries"
        @click="emit('copy-history')"
    >
        Copy All <span class="hint" aria-hidden="true">Shift+C</span>
    </RandomNumberActionButton>
    <RandomNumberActionButton
        variant="ghost"
        :disabled="!historyHasEntries"
        @click="emit('clear-history')"
    >
        Clear History
    </RandomNumberActionButton>
    <RandomNumberActionButton
        v-if="historyHasEntries"
        variant="ghost"
        :aria-pressed="manageMode"
        @click="emit('toggle-manage')"
    >
        {{ manageMode ? "Done" : "Manage" }}
        <span v-if="!manageMode" class="hint" aria-hidden="true">M</span>
    </RandomNumberActionButton>
</template>

<script setup lang="ts">
import RandomNumberActionButton from "./RandomNumberActionButton.vue"

defineProps<{
    showRestoreCleared: boolean
    undoAriaLabel: string
    undoHintLabel: string
    historyHasEntries: boolean
    exportHasEntries: boolean
    manageMode: boolean
}>()

const emit = defineEmits<{
    "restore-cleared": []
    "undo-last": []
    "copy-history": []
    "clear-history": []
    "toggle-manage": []
}>()
</script>
