<template>
    <div class="button-stack">
        <RandomNumberActionButton :disabled="exportDisabled" @click="emit('copyHistoryJson')">
            Copy History JSON
        </RandomNumberActionButton>
        <RandomNumberActionButton :disabled="exportDisabled" @click="emit('downloadHistoryCsv')">
            Download CSV
        </RandomNumberActionButton>
        <RandomNumberActionButton :disabled="exportDisabled" @click="emit('downloadHistoryJson')">
            Download JSON
        </RandomNumberActionButton>
        <RandomNumberActionButton variant="subtle" @click="emit('copyShareLink')">
            Copy Share Link
        </RandomNumberActionButton>
        <RandomNumberActionButton @click="emit('importHistoryAppend')">
            Import (Append)
        </RandomNumberActionButton>
        <RandomNumberActionButton variant="danger" @click="emit('importHistoryReplace')">
            Import (Replace)
        </RandomNumberActionButton>
        <RandomNumberActionButton @click="emit('exportSession')">Export Session</RandomNumberActionButton>
        <RandomNumberActionButton @click="emit('importSession')">Import Session</RandomNumberActionButton>
        <RandomNumberActionButton variant="danger" @click="emit('clearAllData')">
            Clear All Saved Data
        </RandomNumberActionButton>
    </div>
</template>

<script setup lang="ts">
import RandomNumberActionButton from "./RandomNumberActionButton.vue"

defineProps<{
    exportDisabled: boolean
}>()

const emit = defineEmits<{
    copyHistoryJson: []
    downloadHistoryCsv: []
    downloadHistoryJson: []
    copyShareLink: []
    importHistoryAppend: []
    importHistoryReplace: []
    exportSession: []
    importSession: []
    clearAllData: []
}>()
</script>

<style scoped>
.button-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 12px;
}

@media (max-width: 639px) {
    .button-stack {
        align-items: stretch;
    }

    .button-stack :deep(.action-button) {
        align-self: stretch;
        justify-content: center;
    }
}
</style>
