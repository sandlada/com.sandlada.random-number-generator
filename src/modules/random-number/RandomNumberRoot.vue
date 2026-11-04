<template>
    <div class="workspace">
        <div class="layout-grid">
            <div class="column-main area-main">
                <section
                    class="card card-hero"
                    aria-label="Generated number"
                    :class="{ generated: isGeneratedManually, pulse: showGeneratePulse }"
                >
                    <div class="hero-top">
                        <div class="header-action-row hero-top-actions">
                            <RandomNumberActionButton
                                variant="ghost"
                                aria-label="Copy current number (C)"
                                @click="handleCopyCurrent"
                            >
                                Copy <span class="hint" aria-hidden="true">C</span>
                            </RandomNumberActionButton>
                            <RandomNumberActionButton
                                variant="ghost"
                                aria-label="Share link (S)"
                                @click="handleShareCurrent"
                            >
                                Share <span class="hint" aria-hidden="true">S</span>
                            </RandomNumberActionButton>
                        </div>
                    </div>
                    <button
                        type="button"
                        class="current-number current-number-copy"
                        aria-label="Copy current number (C)"
                        @click="handleCopyCurrent"
                    >
                        <ShowNumber :number="currentNumber.value" :decimals="settings.decimals.value" />
                    </button>
                    <p v-if="hasPreviousNumber" class="previous-number">
                        Previous:
                        {{ formatRandomNumber(lastNumber.value, settings.decimals.value) }}
                    </p>
                    <p class="sr-only" aria-live="polite">{{ copyScreenReaderMessage }}</p>
                    <div class="hero-actions">
                        <p v-if="uniquePoolExhausted" class="generate-hint">
                            No unique numbers left in this range. Turn off No Repeat or clear history to continue.
                        </p>
                        <div class="button-row button-row-primary">
                            <RandomNumberActionButton
                                variant="primary"
                                :disabled="generateDisabled"
                                notify-when-disabled
                                aria-label="Generate once (G)"
                                @click="handleNumberGenerateManually"
                            >
                                Generate Once <span class="hint" aria-hidden="true">G</span>
                            </RandomNumberActionButton>
                            <RandomNumberActionButton
                                :disabled="generateDisabled"
                                notify-when-disabled
                                :aria-label="`Batch generate ${settings.batchCount.value} numbers (B)`"
                                @click="handleMultipleNumbersGenerateManually"
                            >
                                Batch
                                <span class="hint" aria-hidden="true">B ×{{ settings.batchCount.value }}</span>
                            </RandomNumberActionButton>
                            <RandomNumberActionButton
                                v-if="settings.noRepeat.value"
                                :disabled="fillDisabled"
                                notify-when-disabled
                                @click="handleFillRemainingUnique"
                            >
                                Fill Unique Range
                            </RandomNumberActionButton>
                        </div>
                    </div>
                </section>

                <section class="card area-hist">
                    <div class="card-header-row history-header">
                        <h2 class="history-title">History</h2>
                        <div class="header-action-row history-header-actions history-header-actions--wide">
                            <RandomNumberHistoryActions
                                :show-restore-cleared="Boolean(clearedHistorySnapshot)"
                                :undo-aria-label="undoAriaLabel"
                                :undo-hint-label="undoHintLabel"
                                :history-has-entries="history.length > 0"
                                :export-has-entries="historyForExport.length > 0"
                                :manage-mode="historyManageMode"
                                @restore-cleared="handleRestoreClearedHistory"
                                @undo-last="handleUndoLast"
                                @copy-history="handleCopyHistory"
                                @clear-history="handleNumberReset"
                                @toggle-manage="toggleHistoryManage"
                            />
                        </div>
                    </div>
                    <p v-if="historySummary" class="summary history-summary-inline">{{ historySummaryText }}</p>
                    <label v-if="history.length" class="fluent-field history-search">
                        <span class="fluent-field-label">Filter</span>
                        <div class="history-search-row">
                            <input
                                ref="historyFilterInput"
                                v-model="historyQuery"
                                type="search"
                                class="fluent-input"
                                placeholder="Search values… (/)"
                            />
                            <RandomNumberActionButton
                                v-if="historyQuery.trim()"
                                variant="ghost"
                                @click="historyQuery = ''"
                            >
                                Clear
                            </RandomNumberActionButton>
                        </div>
                    </label>
                    <label
                        v-if="history.length && historyQuery.trim()"
                        class="option-row history-export-filter"
                    >
                        <input v-model="exportFilteredOnly" type="checkbox" />
                        <span>Export only matching filter</span>
                    </label>
                    <RandomNumberHistoryList
                        v-if="historyListForUi.length"
                        :history="historyListForUi"
                        :decimals="settings.decimals.value"
                        :current-id="currentNumber.id"
                        :manage-mode="historyManageMode"
                        @select="handleHistorySelect"
                        @remove="handleNumberRemove"
                        @reorder="handleHistoryReorder"
                    />
                    <p v-else-if="historyFilterEmpty" class="history-empty">No values match this filter.</p>
                    <p v-else-if="!history.length" class="history-empty" aria-live="polite">
                        No history yet.
                    </p>
                </section>

                <div v-if="isNarrowViewport" class="narrow-more-row">
                    <RandomNumberActionButton
                        class="narrow-more-trigger"
                        variant="ghost"
                        aria-label="More"
                        @click="openMore"
                    >
                        More
                    </RandomNumberActionButton>
                </div>
            </div>

            <aside class="column-side area-side">
                <section class="card card-sidebar-stack sidebar-range-card">
                    <RandomNumberRangePresetsPanel
                        :settings="settings"
                        :range-summary-text="rangeSummaryText"
                        v-model:preset-label="presetLabel"
                        :custom-presets="customPresets"
                        :custom-preset-capacity-text="customPresetCapacityText"
                        @settings-enter-generate="handleSettingsEnterGenerate"
                        @reset-range-defaults="handleResetRangeDefaults"
                        @swap-range-bounds="handleSwapRangeBounds"
                        @apply-preset="applyPreset"
                        @duplicate-custom-preset="handleDuplicateCustomPreset"
                        @rename-custom-preset="handleRenameCustomPreset"
                        @remove-custom-preset="handleRemoveCustomPreset"
                        @save-custom-preset="handleSaveCustomPreset"
                    />
                </section>

                <details
                    class="fluent-details backup-details-wide"
                    :open="backupPanelOpen"
                    @toggle="handleBackupPanelToggle"
                >
                    <summary>Import, export &amp; backup</summary>
                    <RandomNumberImportExportBackupPanel
                        :export-disabled="!historyForExport.length"
                        @copy-history-json="handleCopyHistoryJson"
                        @download-history-csv="handleDownloadHistoryCsv"
                        @download-history-json="handleDownloadHistoryJson"
                        @copy-share-link="handleCopyShareLink"
                        @import-history-append="() => triggerHistoryImport('append')"
                        @import-history-replace="() => triggerHistoryImport('replace')"
                        @export-session="handleExportSession"
                        @import-session="triggerSessionImport"
                        @clear-all-data="handleClearAllData"
                    />
                </details>

                <details
                    class="fluent-details shortcuts-details-wide"
                    :open="shortcutsPanelOpen"
                    @toggle="handleShortcutsPanelToggle"
                >
                    <summary>Keyboard shortcuts</summary>
                    <RandomNumberShortcutsPanel />
                </details>

            </aside>
        </div>

        <AppBanner :open="bannerOpen" :message="bannerMessage" />

        <AppPanelDialog
            :open="moreDialogOpen"
            :title="moreDialogTitle"
            @close="closeMore"
        >
            <nav class="more-dialog-nav" aria-label="More">
                <RandomNumberActionButton
                    variant="ghost"
                    :aria-current="moreSection === 'range' ? 'page' : undefined"
                    @click="moreSection = 'range'"
                >
                    Range &amp; Presets
                </RandomNumberActionButton>
                <RandomNumberActionButton
                    variant="ghost"
                    :aria-current="moreSection === 'backup' ? 'page' : undefined"
                    @click="moreSection = 'backup'"
                >
                    Import &amp; Backup
                </RandomNumberActionButton>
                <RandomNumberActionButton
                    variant="ghost"
                    :aria-current="moreSection === 'shortcuts' ? 'page' : undefined"
                    @click="moreSection = 'shortcuts'"
                >
                    Shortcuts
                </RandomNumberActionButton>
                <RandomNumberActionButton
                    variant="ghost"
                    :aria-current="moreSection === 'history' ? 'page' : undefined"
                    @click="moreSection = 'history'"
                >
                    History
                </RandomNumberActionButton>
            </nav>
            <div v-show="moreSection === 'range'" class="more-dialog-panel">
                <RandomNumberRangePresetsPanel
                    :settings="settings"
                    :range-summary-text="rangeSummaryText"
                    v-model:preset-label="presetLabel"
                    :custom-presets="customPresets"
                    :custom-preset-capacity-text="customPresetCapacityText"
                    @settings-enter-generate="handleSettingsEnterGenerateFromPanel"
                    @reset-range-defaults="handleResetRangeDefaults"
                    @swap-range-bounds="handleSwapRangeBounds"
                    @apply-preset="applyPreset"
                    @duplicate-custom-preset="handleDuplicateCustomPreset"
                    @rename-custom-preset="handleRenameCustomPreset"
                    @remove-custom-preset="handleRemoveCustomPreset"
                    @save-custom-preset="handleSaveCustomPreset"
                />
            </div>
            <div v-show="moreSection === 'backup'" class="more-dialog-panel">
                <RandomNumberImportExportBackupPanel
                    :export-disabled="!historyForExport.length"
                    @copy-history-json="handleCopyHistoryJson"
                    @download-history-csv="handleDownloadHistoryCsv"
                    @download-history-json="handleDownloadHistoryJson"
                    @copy-share-link="handleCopyShareLink"
                    @import-history-append="() => triggerHistoryImport('append')"
                    @import-history-replace="() => triggerHistoryImport('replace')"
                    @export-session="handleExportSession"
                    @import-session="triggerSessionImport"
                    @clear-all-data="handleClearAllData"
                />
            </div>
            <div v-show="moreSection === 'shortcuts'" class="more-dialog-panel">
                <RandomNumberShortcutsPanel />
            </div>
            <div v-show="moreSection === 'history'" class="more-dialog-panel">
                <p v-if="historySummary" class="summary more-history-summary">{{ historySummaryText }}</p>
                <div class="more-history-actions">
                    <RandomNumberHistoryActions
                        :show-restore-cleared="Boolean(clearedHistorySnapshot)"
                        :undo-aria-label="undoAriaLabel"
                        :undo-hint-label="undoHintLabel"
                        :history-has-entries="history.length > 0"
                        :export-has-entries="historyForExport.length > 0"
                        :manage-mode="historyManageMode"
                        @restore-cleared="handleRestoreClearedHistory"
                        @undo-last="handleUndoLast"
                        @copy-history="handleCopyHistory"
                        @clear-history="handleNumberReset"
                        @toggle-manage="toggleHistoryManage"
                    />
                </div>
            </div>
        </AppPanelDialog>

        <input
            ref="historyFileInput"
            type="file"
            accept=".csv,text/csv,text/plain,.json,application/json"
            class="sr-only"
            @change="handleHistoryImport"
        />
        <input
            ref="sessionFileInput"
            type="file"
            accept="application/json,.json"
            class="sr-only"
            @change="handleSessionImport"
        />

        <AppModal
            :open="modalOpen"
            :mode="modalMode"
            :title="modalTitle"
            :message="modalMessage"
            :field-label="modalFieldLabel"
            :prompt-value="modalPromptValue"
            :max-length="modalMaxLength"
            :confirm-label="modalConfirmLabel"
            :cancel-label="modalCancelLabel"
            :destructive="modalDestructive"
            @update:prompt-value="(value) => (modalPromptValue = value)"
            @confirm="onModalConfirm"
            @cancel="cancelModal"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from "vue"
import {
    addCustomPreset,
    applyRangePreset,
    applySettingsFromSearch,
    applyDisplayFromSearch,
    applySettingsPatch,
    clampValueToRange,
    buildHistoryExportFilename,
    buildHistoryJsonExport,
    buildSessionExportFilename,
    serializeSessionExport,
    buildSettingsShareUrl,
    clearAllPersistedData,
    copyNumberToClipboard,
    copyTextToClipboard,
    createCustomPreset,
    createUniqueRandomInRange,
    countValuesInRange,
    downloadHistoryCsvFile,
    downloadHistoryJsonFile,
    downloadTextFile,
    formatHistoryForCopy,
    formatRandomNumber,
    formatRangeDescription,
    createHistoryItemsFromValues,
    analyzeHistoryImport,
    countImportValuesAlreadyInHistory,
    loadCustomPresets,
    loadBackupPanelOpen,
    loadShortcutsPanelOpen,
    loadHistoryFilterSession,
    MAX_HISTORY_LENGTH,
    MAX_CUSTOM_PRESETS,
    parseSessionImport,
    randomNumberContextSymbol,
    remainingUniqueCount,
    duplicateCustomPreset,
    renameCustomPreset,
    resolveSessionDisplayValue,
    filterHistoryValuesByQuery,
    flushScheduledReplaceBrowserUrl,
    formatBatchGenerateStatus,
    formatBatchGenerateBlockedStatus,
    formatCustomPresetCapacity,
    formatGenerateBlockedStatus,
    isGenerateDisabled,
    isRangeSettingsInvalid,
    scheduleReplaceBrowserUrlWithSettings,
    resolveInitialDisplayValue,
    resolveStartupDisplayValue,
    resolveRestoredCurrentEntry,
    formatHistoryExportSuccessMessage,
    formatHistoryImportSuccessMessage,
    formatSessionExportSuccessMessage,
    formatSessionImportSuccessMessage,
    formatHistorySummaryStats,
    loadPersistedDisplay,
    removeCustomPreset,
    saveCustomPresets,
    saveBackupPanelOpen,
    saveShortcutsPanelOpen,
    saveHistoryFilterSession,
    shareCurrentNumber,
    swapRangeBounds,
    summarizeHistory,
    DEFAULT_SETTINGS_SNAPSHOT,
    type RandomNumber,
    type RangePreset,
    type RandomNumberFlagged,
} from "./generator"
import type { HistoryExportStatusInput, HistoryJsonExportOptions } from "./generator"
import RandomNumberActionButton from "./RandomNumberActionButton.vue"
import RandomNumberHistoryList from "./RandomNumberHistoryList.vue"
import RandomNumberHistoryActions from "./RandomNumberHistoryActions.vue"
import ShowNumber from "./ShowNumber.vue"
import AppBanner from "./AppBanner.vue"
import AppModal from "./AppModal.vue"
import AppPanelDialog from "./AppPanelDialog.vue"
import RandomNumberRangePresetsPanel from "./RandomNumberRangePresetsPanel.vue"
import RandomNumberImportExportBackupPanel from "./RandomNumberImportExportBackupPanel.vue"
import RandomNumberShortcutsPanel from "./RandomNumberShortcutsPanel.vue"
import { useAppBanner } from "./useAppBanner"
import { useAppModal } from "./useAppModal"
import { useNarrowViewport } from "./useNarrowViewport"
import { useUndoShortcutHint } from "./useShortcutHintLabel"
import { isTypingTarget } from "./isTypingTarget"

const { createGenerator, createState, createHistory, createSettings } =
    inject<RandomNumber>(randomNumberContextSymbol)!
const { createRandomNumber } = createGenerator()
const { currentNumber, lastNumber, setCurrent, setCurrentFromEntry } = createState()
const {
    add: addToHistory,
    addMany,
    history,
    removeById: removeHistoryItemById,
    reset: resetHistory,
    popLast,
    replaceAll: replaceAllHistory,
    reorder: reorderHistoryItems,
} = createHistory()
const settings = createSettings()

const isGeneratedManually = ref<boolean>(false)
const showGeneratePulse = ref(false)
const isFillingUnique = ref(false)
const copyScreenReaderMessage = ref("")
const {
    message: bannerMessage,
    visible: bannerOpen,
    show: showBanner,
    flash: flashStatus,
} = useAppBanner()
const initialHistoryFilter = loadHistoryFilterSession()
const historyQuery = ref(initialHistoryFilter.query)
const exportFilteredOnly = ref(initialHistoryFilter.exportFilteredOnly)
const historyFilterInput = ref<HTMLInputElement | null>(null)
type ClearedHistorySnapshot = {
    history: RandomNumberFlagged[]
    current: RandomNumberFlagged
    isGeneratedManually: boolean
}
const clearedHistorySnapshot = ref<ClearedHistorySnapshot | null>(null)
const presetLabel = ref("")
const customPresets = ref<RangePreset[]>(loadCustomPresets())
const customPresetCapacityText = computed(() =>
    formatCustomPresetCapacity(customPresets.value.length),
)
const backupPanelOpen = ref(loadBackupPanelOpen())
const shortcutsPanelOpen = ref(loadShortcutsPanelOpen())
const historyFileInput = ref<HTMLInputElement | null>(null)
const sessionFileInput = ref<HTMLInputElement | null>(null)
const historyImportMode = ref<"append" | "replace">("append")
const { undoHintLabel, undoAriaLabel } = useUndoShortcutHint()

type MoreSection = "range" | "backup" | "shortcuts" | "history"

const moreDialogOpen = ref(false)
const moreSection = ref<MoreSection>("range")

const moreDialogTitle = computed(() => {
    switch (moreSection.value) {
        case "range":
            return "Range & Presets"
        case "backup":
            return "Import, export & backup"
        case "shortcuts":
            return "Keyboard shortcuts"
        case "history":
            return "History"
    }
})

const openMoreSection = (section: MoreSection) => {
    moreSection.value = section
    moreDialogOpen.value = true
}

const closeMore = () => {
    moreDialogOpen.value = false
}

const openMore = () => {
    openMoreSection(history.value.length > 0 ? "history" : "range")
}

const toggleMoreShortcutsHelp = () => {
    if (!moreDialogOpen.value) {
        openMoreSection("shortcuts")
        return
    }
    if (moreSection.value === "shortcuts") {
        closeMore()
        return
    }
    moreSection.value = "shortcuts"
}

const { isNarrowViewport } = useNarrowViewport()

const {
    open: modalOpen,
    mode: modalMode,
    title: modalTitle,
    message: modalMessage,
    fieldLabel: modalFieldLabel,
    promptValue: modalPromptValue,
    maxLength: modalMaxLength,
    confirmLabel: modalConfirmLabel,
    cancelLabel: modalCancelLabel,
    destructive: modalDestructive,
    confirm: modalConfirm,
    prompt: modalPrompt,
    submitConfirm,
    submitPrompt,
    cancel: cancelModal,
} = useAppModal()

const onModalConfirm = () => {
    if (modalMode.value === "prompt") {
        submitPrompt()
    } else {
        submitConfirm()
    }
}

let copyScreenReaderTimer: ReturnType<typeof setTimeout> | null = null
let pulseTimer: ReturnType<typeof setTimeout> | null = null
const confirmDestructive = (message: string, title?: string): Promise<boolean> => {
    return modalConfirm(message, { destructive: true, title: title ?? "Are you sure?" })
}

const triggerGeneratePulse = () => {
    showGeneratePulse.value = true
    if (pulseTimer) clearTimeout(pulseTimer)
    pulseTimer = setTimeout(() => {
        showGeneratePulse.value = false
    }, 320)
}

const historyNoRepeat = computed(() => {
    const map = new Map<number, { id: string; value: number }>()
    history.value.forEach((item) => map.set(item.value, item))
    return Array.from(map.values())
})
const historyFiltered = computed(() =>
    settings.noRepeat.value ? historyNoRepeat.value : history.value,
)

const historyDisplayed = computed(() => {
    const query = historyQuery.value.trim()
    const base = filterHistoryValuesByQuery(
        historyFiltered.value,
        query,
        settings.decimals.value,
    )
    return [...base].reverse()
})

const historyManageMode = ref(false)

const historyListForUi = computed(() => {
    if (historyManageMode.value) {
        return [...history.value].reverse()
    }
    return historyDisplayed.value
})

watch(
    () => history.value.length,
    (length) => {
        if (length === 0) {
            historyManageMode.value = false
        }
    },
)

watch(historyQuery, (query) => {
    if (historyManageMode.value && query.trim()) {
        historyManageMode.value = false
        flashStatus("Manage mode off — filter applied")
    }
})

const toggleHistoryManage = () => {
    if (!historyManageMode.value) {
        const hadFilter = Boolean(historyQuery.value.trim())
        if (hadFilter) {
            historyQuery.value = ""
        }
        historyManageMode.value = true
        flashStatus(
            hadFilter
                ? "Filter cleared · Manage mode: drag chips to reorder, × to remove"
                : "Manage mode: drag to reorder, × to remove",
        )
        return
    }
    historyManageMode.value = false
    flashStatus("Manage mode off")
}

const handleHistoryReorder = (displayOrderedIds: string[]) => {
    invalidateClearedHistorySnapshot()
    const storageIds = [...displayOrderedIds].reverse()
    const before = history.value.map((entry) => entry.id).join("|")
    reorderHistoryItems(storageIds)
    const after = history.value.map((entry) => entry.id).join("|")
    if (before === after) return
    flashStatus("History order updated")
}

/** History for export/copy; optional filter-only mode (keeps No Repeat dedupe). */
const historyForExport = computed(() => {
    const query = historyQuery.value.trim()
    const base =
        exportFilteredOnly.value && query
            ? filterHistoryValuesByQuery(
                  historyFiltered.value,
                  query,
                  settings.decimals.value,
              )
            : historyFiltered.value
    return [...base].reverse()
})

const historyExportStatusInput = computed((): HistoryExportStatusInput => ({
    exportFilteredOnly: exportFilteredOnly.value,
    query: historyQuery.value,
    exportedCount: historyForExport.value.length,
    totalCount: historyFiltered.value.length,
}))

const historyJsonExportOptions = computed((): HistoryJsonExportOptions => {
    const query = historyQuery.value.trim()
    if (exportFilteredOnly.value && query) {
        return { filtered: true, filterQuery: query }
    }
    return {}
})

const historyExportSuccess = (base: string) =>
    formatHistoryExportSuccessMessage(base, historyExportStatusInput.value)

const historyFilterEmpty = computed(
    () => Boolean(historyQuery.value.trim()) && historyFiltered.value.length > 0 && !historyDisplayed.value.length,
)

const hasPreviousNumber = computed(
    () => lastNumber.value.id !== currentNumber.value.id,
)

const historyStatsSource = computed(() => {
    const query = historyQuery.value.trim()
    if (!query) return historyFiltered.value
    return filterHistoryValuesByQuery(
        historyFiltered.value,
        query,
        settings.decimals.value,
    )
})

const historySummary = computed(() => summarizeHistory(historyStatsSource.value))
const rangeSummaryText = computed(() => formatRangeDescription(settings.snapshot()))
const historySummaryText = computed(() => {
    const summary = historySummary.value
    if (!summary) return ""
    const d = settings.decimals.value
    const query = historyQuery.value.trim()
    const totalCount = historyFiltered.value.length
    const countLabel =
        query && summary.count !== totalCount
            ? `History: ${summary.count} of ${totalCount} matching “${query}”`
            : `History: ${summary.count}`
    let text = `${countLabel} · ${formatHistorySummaryStats(summary, d)}`
    if (settings.noRepeat.value) {
        const { min, max, decimals } = settings.snapshot()
        const left = remainingUniqueCount(min, max, decimals, excludedValues.value)
        text += ` · ${left} unique left`
    }
    if (history.value.length >= MAX_HISTORY_LENGTH) {
        text += ` · history capped at ${MAX_HISTORY_LENGTH}`
    }
    return text
})

const excludedValues = computed(() => {
    const values = new Set(history.value.map((item) => item.value))
    if (settings.noRepeat.value) {
        values.add(currentNumber.value.value)
    }
    return values
})

const uniquePoolExhausted = computed(() => {
    if (!settings.noRepeat.value) return false
    const { min, max, decimals } = settings.snapshot()
    return remainingUniqueCount(min, max, decimals, excludedValues.value) === 0
})

const rangeSettingsInvalid = computed(() =>
    isRangeSettingsInvalid(settings.min.value, settings.max.value),
)

const generateBlockedInput = computed(() => ({
    isFillingUnique: isFillingUnique.value,
    uniquePoolExhausted: uniquePoolExhausted.value,
    rangeInvalid: rangeSettingsInvalid.value,
}))

const generateDisabled = computed(() => isGenerateDisabled(generateBlockedInput.value))

const fillDisabled = computed(() => isGenerateDisabled(generateBlockedInput.value))

const applyPreset = (preset: RangePreset) => {
    applyRangePreset(settings, preset)
    setCurrent(preset.min)
    flashStatus(`Preset: ${preset.label}`)
}

const handleSaveCustomPreset = () => {
    const { min, max, decimals } = settings.snapshot()
    const preset = createCustomPreset(presetLabel.value, { min, max, decimals }, customPresets.value)
    const atCap = customPresets.value.length >= MAX_CUSTOM_PRESETS
    customPresets.value = addCustomPreset(customPresets.value, preset)
    presetLabel.value = ""
    flashStatus(
        atCap
            ? `Saved "${preset.label}" (oldest preset removed, max ${MAX_CUSTOM_PRESETS})`
            : `Saved preset "${preset.label}"`,
    )
}

const handleBackupPanelToggle = (event: Event) => {
    const open = (event.target as HTMLDetailsElement).open
    backupPanelOpen.value = open
    saveBackupPanelOpen(open)
}

const handleShortcutsPanelToggle = (event: Event) => {
    const open = (event.target as HTMLDetailsElement).open
    shortcutsPanelOpen.value = open
    saveShortcutsPanelOpen(open)
}

const handleSettingsEnterGenerate = () => {
    settings.applyNormalization()
    handleNumberGenerateManually()
}

const handleSettingsEnterGenerateFromPanel = () => {
    handleSettingsEnterGenerate()
    closeMore()
}

const handleFillRemainingUnique = async () => {
    const blocked = formatGenerateBlockedStatus(generateBlockedInput.value)
    if (blocked) {
        flashStatus(blocked)
        return
    }
    if (!settings.noRepeat.value) {
        flashStatus("Enable No Repeat first")
        return
    }
    const { min, max, decimals } = settings.snapshot()
    const remaining = remainingUniqueCount(min, max, decimals, excludedValues.value)
    if (
        !(await confirmDestructive(
            `Add all ${remaining} remaining unique numbers in this range to history?`,
            "Fill Unique Range",
        ))
    ) {
        return
    }

    isFillingUnique.value = true
    let added = 0
    const maxIterations = countValuesInRange(min, max, decimals) + 1
    try {
        while (added < maxIterations) {
            const next = generateWithSettings()
            if (next === null) break
            currentNumber.value = next
            pushCurrentToHistory()
            added++
            if (added % 25 === 0) {
                showBanner(`Adding ${added}/${remaining}…`, { durationMs: null })
                await new Promise((resolve) => setTimeout(resolve, 0))
            }
        }
    } finally {
        isFillingUnique.value = false
    }
    isGeneratedManually.value = true
    triggerGeneratePulse()
    flashStatus(`Added ${added} numbers`)
}

const handleRemoveCustomPreset = (id: string) => {
    customPresets.value = removeCustomPreset(customPresets.value, id)
    flashStatus("Preset removed")
}

const handleDuplicateCustomPreset = (id: string) => {
    customPresets.value = duplicateCustomPreset(customPresets.value, id)
    flashStatus("Preset duplicated")
}

const handleSwapRangeBounds = () => {
    swapRangeBounds(settings)
    flashStatus(`Swapped range · ${rangeSummaryText.value}`)
}

const handleResetRangeDefaults = async () => {
    if (
        !(await modalConfirm(
            "Reset min, max, decimals, batch size, and No repeat to defaults? The current value will move to the default minimum.",
            { title: "Reset To Defaults", confirmLabel: "Reset" },
        ))
    ) {
        return
    }
    applySettingsPatch(settings, DEFAULT_SETTINGS_SNAPSHOT())
    setCurrent(settings.min.value)
    isGeneratedManually.value = false
    flashStatus("Range settings reset to defaults")
}

const handleRenameCustomPreset = async (id: string, currentLabel: string) => {
    const nextLabel = await modalPrompt("Choose a new name for this preset.", currentLabel, {
        title: "Rename Preset",
        fieldLabel: "Preset Name",
    })
    if (nextLabel === null) return
    const { presets, appliedLabel } = renameCustomPreset(customPresets.value, id, nextLabel)
    if (!appliedLabel) return
    customPresets.value = presets
    const trimmed = nextLabel.trim()
    flashStatus(
        appliedLabel !== trimmed ? `Renamed to "${appliedLabel}"` : "Preset renamed",
    )
}

const generateWithSettings = (options?: { quietOnFailure?: boolean }): number | null => {
    const { min, max, decimals } = settings.snapshot()
    if (settings.noRepeat.value) {
        const result = createUniqueRandomInRange(min, max, decimals, excludedValues.value)
        if (!result.ok) {
            if (!options?.quietOnFailure) {
                const left = remainingUniqueCount(min, max, decimals, excludedValues.value)
                flashStatus(
                    left === 0
                        ? "No more unique numbers in this range"
                        : "No unique number available — try again",
                )
            }
            return null
        }
        return result.value
    }
    return createRandomNumber(min, max, decimals)
}

const invalidateClearedHistorySnapshot = () => {
    clearedHistorySnapshot.value = null
}

watch([historyQuery, exportFilteredOnly], () => {
    saveHistoryFilterSession({
        query: historyQuery.value,
        exportFilteredOnly: exportFilteredOnly.value,
    })
})

const announceCopyForScreenReader = (message: string) => {
    copyScreenReaderMessage.value = message
    if (copyScreenReaderTimer) clearTimeout(copyScreenReaderTimer)
    copyScreenReaderTimer = setTimeout(() => {
        copyScreenReaderMessage.value = ""
    }, 3000)
}

const pushCurrentToHistory = () => {
    invalidateClearedHistorySnapshot()
    addToHistory({ id: currentNumber.value.id, value: currentNumber.value.value })
}

const handleNumberGenerateManually = (options?: {
    quietOnFailure?: boolean
    quietOnBlocked?: boolean
}): number | null => {
    const blocked = formatGenerateBlockedStatus(generateBlockedInput.value)
    if (blocked) {
        if (!options?.quietOnBlocked) {
            flashStatus(blocked)
        }
        return null
    }
    const next = generateWithSettings(options)
    if (next === null) return null
    isGeneratedManually.value = true
    currentNumber.value = next
    pushCurrentToHistory()
    triggerGeneratePulse()
    return next
}

const handleMultipleNumbersGenerateManually = () => {
    const blocked = formatBatchGenerateBlockedStatus(generateBlockedInput.value)
    if (blocked) {
        flashStatus(blocked)
        return
    }
    isGeneratedManually.value = false
    const batchCount = settings.batchCount.value
    const quietOnFailure = batchCount > 1
    let generated = 0
    for (let i = 0; i < batchCount; i++) {
        const outcome = handleNumberGenerateManually(
            quietOnFailure ? { quietOnFailure: true, quietOnBlocked: true } : { quietOnBlocked: true },
        )
        if (outcome === null) {
            if (batchCount > 1) {
                flashStatus(formatBatchGenerateStatus(batchCount, generated, true))
            }
            return
        }
        generated++
    }
    if (batchCount > 1) {
        flashStatus(formatBatchGenerateStatus(batchCount, generated, false))
    }
}

const handleNumberReset = async () => {
    if (!history.value.length) {
        flashStatus("Nothing to clear")
        return
    }
    if (
        !(await confirmDestructive(
            "Clear all history and reset the current number?",
            "Clear History",
        ))
    ) {
        return
    }
    if (history.value.length) {
        clearedHistorySnapshot.value = {
            history: history.value.map((item) => ({ ...item })),
            current: { ...currentNumber.value },
            isGeneratedManually: isGeneratedManually.value,
        }
    } else {
        clearedHistorySnapshot.value = null
    }
    resetHistory()
    historyManageMode.value = false
    const { min } = settings.snapshot()
    setCurrent(min)
    isGeneratedManually.value = false
    flashStatus(
        clearedHistorySnapshot.value
            ? "History cleared — use Restore Cleared to undo"
            : "History cleared",
    )
}

const handleRestoreClearedHistory = () => {
    const snapshot = clearedHistorySnapshot.value
    if (!snapshot) return
    const restored = snapshot.history.map((item) => ({ ...item }))
    replaceAllHistory(restored)
    const entry = resolveRestoredCurrentEntry(snapshot.current, restored)
    setCurrentFromEntry(entry)
    isGeneratedManually.value = snapshot.isGeneratedManually
    clearedHistorySnapshot.value = null
    flashStatus(`Restored ${snapshot.history.length} entries`)
}

const handleNumberRemove = (id: string, value?: number) => {
    invalidateClearedHistorySnapshot()
    const removedCurrent = currentNumber.value.id === id
    const entry =
        value !== undefined
            ? { id, value }
            : history.value.find((item) => item.id === id)
    removeHistoryItemById(id)
    if (historyManageMode.value && entry) {
        flashStatus(
            `Removed ${formatRandomNumber(entry.value, settings.decimals.value)} from history`,
        )
    }
    if (!removedCurrent) return
    if (history.value.length) {
        const last = history.value[history.value.length - 1]!
        setCurrentFromEntry(last)
        isGeneratedManually.value = true
    } else {
        setCurrent(settings.min.value)
        isGeneratedManually.value = false
    }
}

const handleHistorySelect = async (id: string, value: number, copyToClipboard: boolean) => {
    setCurrentFromEntry({ id, value })
    isGeneratedManually.value = true
    invalidateClearedHistorySnapshot()
    const formatted = formatRandomNumber(value, settings.decimals.value)
    if (copyToClipboard) {
        const ok = await copyNumberToClipboard(value, settings.decimals.value)
        flashStatus(ok ? `Copied ${formatted}` : `Showing ${formatted}`)
        if (ok) {
            announceCopyForScreenReader(`History value copied: ${formatted}`)
        }
    } else {
        flashStatus(`Showing ${formatted}`)
    }
}

const handleCopyCurrent = async () => {
    const formatted = formatRandomNumber(currentNumber.value.value, settings.decimals.value)
    const ok = await copyNumberToClipboard(currentNumber.value.value, settings.decimals.value)
    flashStatus(ok ? "Copied to clipboard" : "Could not copy")
    if (ok) {
        announceCopyForScreenReader(`Current number copied: ${formatted}`)
    }
}

const handleShareCurrent = async () => {
    const base = `${window.location.origin}${window.location.pathname}`
    const shareUrl = buildSettingsShareUrl(
        base,
        settings.snapshot(),
        currentNumber.value.value,
    )
    const result = await shareCurrentNumber(
        currentNumber.value.value,
        settings.decimals.value,
        shareUrl,
    )
    if (result === "shared") flashStatus("Shared")
    else if (result === "copied") flashStatus("Share link copied to clipboard")
    else if (result === "cancelled") return
    else flashStatus("Could not share — try Copy share link in backup")
}

const handleCopyHistory = async () => {
    if (!historyForExport.value.length) {
        flashStatus("Nothing to copy")
        return
    }
    const text = formatHistoryForCopy(historyForExport.value, settings.decimals.value)
    const ok = await copyTextToClipboard(text)
    flashStatus(
        ok ? historyExportSuccess("History copied") : "Could not copy history",
    )
}

const handleCopyHistoryJson = async () => {
    if (!historyForExport.value.length) return
    const json = buildHistoryJsonExport(
        historyForExport.value,
        settings.decimals.value,
        historyJsonExportOptions.value,
    )
    const ok = await copyTextToClipboard(json)
    flashStatus(
        ok
            ? historyExportSuccess("History JSON copied")
            : "Could not copy history",
    )
}

const handleDownloadHistoryCsv = () => {
    if (!historyForExport.value.length) return
    downloadHistoryCsvFile(historyForExport.value, settings.decimals.value)
    flashStatus(historyExportSuccess("CSV downloaded"))
}

const handleDownloadHistoryJson = () => {
    if (!historyForExport.value.length) return
    downloadHistoryJsonFile(
        historyForExport.value,
        settings.decimals.value,
        undefined,
        historyJsonExportOptions.value,
    )
    flashStatus(historyExportSuccess("JSON downloaded"))
}

const handleUndoLast = () => {
    if (!history.value.length) return
    invalidateClearedHistorySnapshot()
    popLast()
    if (history.value.length) {
        const last = history.value[history.value.length - 1]!
        setCurrentFromEntry(last)
        isGeneratedManually.value = true
    } else {
        setCurrent(settings.min.value)
        isGeneratedManually.value = false
    }
    flashStatus("Removed last entry")
}

const handleCopyShareLink = async () => {
    const base = `${window.location.origin}${window.location.pathname}`
    const url = buildSettingsShareUrl(
        base,
        settings.snapshot(),
        currentNumber.value.value,
    )
    const ok = await copyTextToClipboard(url)
    flashStatus(ok ? "Share link copied to clipboard" : "Could not copy link")
}

const triggerHistoryImport = (mode: "append" | "replace" = "append") => {
    historyImportMode.value = mode
    historyFileInput.value?.click()
}

const handleHistoryImport = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    const mode = historyImportMode.value
    historyImportMode.value = "append"
    if (!file) return
    const text = await file.text()
    const { min, max, decimals } = settings.snapshot()
    const analysis = analyzeHistoryImport(text, min, max, decimals)
    if (analysis.failure === "empty") {
        flashStatus("File is empty")
        input.value = ""
        return
    }
    if (analysis.failure === "invalid_json") {
        flashStatus("Could not parse JSON — check the file format")
        input.value = ""
        return
    }
    if (analysis.failure === "no_values_in_range") {
        const dropped = analysis.droppedOutOfRange
        flashStatus(
            dropped
                ? `No values in range (${dropped} outside min/max)`
                : "No valid numbers found in file",
        )
        input.value = ""
        return
    }
    const values = analysis.values
    const historyBeforeAppend = mode === "append" ? history.value : []
    const hadFilterQuery = Boolean(historyQuery.value.trim())
    const hadExportFilteredOnly = exportFilteredOnly.value && hadFilterQuery
    if (mode === "replace") {
        if (
            history.value.length &&
            !(await confirmDestructive(
                `Replace all ${history.value.length} history entries with ${values.length} imported values?`,
                "Replace History",
            ))
        ) {
            input.value = ""
            return
        }
        replaceAllHistory(createHistoryItemsFromValues(values))
    } else if (
        history.value.length &&
        !(await modalConfirm(
            `Append ${values.length} value${values.length === 1 ? "" : "s"} to ${history.value.length} existing history entries?`,
            { title: "Import History" },
        ))
    ) {
        input.value = ""
        return
    } else {
        addMany(values)
    }

    invalidateClearedHistorySnapshot()

    const lastImported = values[values.length - 1]!
    const entry = resolveRestoredCurrentEntry({ id: "", value: lastImported }, history.value)
    setCurrentFromEntry(entry)
    isGeneratedManually.value = true

    const dup =
        mode === "append" && historyBeforeAppend.length
            ? countImportValuesAlreadyInHistory(values, historyBeforeAppend)
            : 0
    flashStatus(
        formatHistoryImportSuccessMessage({
            mode,
            importedCount: values.length,
            droppedOutOfRange: analysis.droppedOutOfRange,
            duplicateInHistoryCount: dup,
            historyLength: history.value.length,
            maxHistoryLength: MAX_HISTORY_LENGTH,
            hadFilterQuery,
            hadExportFilteredOnly,
        }),
    )
    historyQuery.value = ""
    input.value = ""
}

const handleExportSession = () => {
    const json = serializeSessionExport(
        settings.snapshot(),
        history.value,
        customPresets.value,
        currentNumber.value.value,
        {
            query: historyQuery.value,
            exportFilteredOnly: exportFilteredOnly.value,
        },
    )
    downloadTextFile(
        buildSessionExportFilename(),
        json,
        "application/json;charset=utf-8",
    )
    flashStatus(
        formatSessionExportSuccessMessage({
            historyCount: history.value.length,
            hadFilterQuery: Boolean(historyQuery.value.trim()),
            filterQuery: historyQuery.value,
            hadExportFilteredOnly: exportFilteredOnly.value,
            hasSummary: history.value.length > 0,
        }),
    )
}

const triggerSessionImport = () => {
    sessionFileInput.value?.click()
}

const handleSessionImport = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const session = parseSessionImport(await file.text())
    input.value = ""
    if (!session) {
        flashStatus("Invalid session file")
        return
    }
    if (
        !(await confirmDestructive(
            `Import session from ${file.name}? This replaces your current settings, history (${history.value.length} items), and custom presets (${customPresets.value.length}).`,
            "Import Session",
        ))
    ) {
        return
    }
    applySettingsPatch(settings, session.settings)
    replaceAllHistory(session.history)
    clearedHistorySnapshot.value = null
    customPresets.value = session.customPresets
    saveCustomPresets(customPresets.value)
    const fromSession = resolveSessionDisplayValue(session)
    const initialValue =
        fromSession ?? resolveInitialDisplayValue(session.history, settings.min.value)
    const entry = resolveRestoredCurrentEntry(
        { id: session.displayValue !== undefined ? "session-display" : "", value: initialValue },
        session.history,
    )
    setCurrentFromEntry(entry)
    isGeneratedManually.value =
        session.history.length > 0 || initialValue !== settings.min.value
    if (session.historyFilter) {
        historyQuery.value = session.historyFilter.query
        exportFilteredOnly.value = session.historyFilter.exportFilteredOnly
        saveHistoryFilterSession(session.historyFilter)
    } else {
        historyQuery.value = ""
        exportFilteredOnly.value = false
    }
    flashStatus(
        formatSessionImportSuccessMessage({
            historyCount: session.history.length,
            hasSummary: Boolean(session.historySummary),
            restoredFilterQuery: Boolean(session.historyFilter?.query.trim()),
            filterQuery: session.historyFilter?.query ?? "",
            hadExportFilteredOnly: Boolean(session.historyFilter?.exportFilteredOnly),
        }),
    )
}

const handleClearAllData = async () => {
    if (
        !(await confirmDestructive(
            "Clear all saved data (settings, history, and custom presets)? This cannot be undone.",
            "Clear All Saved Data",
        ))
    ) {
        return
    }
    clearAllPersistedData()
    applySettingsPatch(settings, DEFAULT_SETTINGS_SNAPSHOT())
    resetHistory()
    customPresets.value = []
    saveCustomPresets([])
    clearedHistorySnapshot.value = null
    setCurrent(settings.min.value)
    isGeneratedManually.value = false
    historyQuery.value = ""
    presetLabel.value = ""
    flashStatus("All saved data cleared")
}

const tryShortcutGenerate = (event: KeyboardEvent) => {
    event.preventDefault()
    handleNumberGenerateManually()
}

const tryShortcutBatch = (event: KeyboardEvent) => {
    event.preventDefault()
    handleMultipleNumbersGenerateManually()
}

const rootGlobalShortcutsPaused = computed(
    () => modalOpen.value || moreDialogOpen.value,
)

const handleRootKeyDown = (event: KeyboardEvent) => {
    if (rootGlobalShortcutsPaused.value) {
        return
    }
    if (isTypingTarget(event.target)) return
    const key = event.key.toLowerCase()
    if (key === "g") {
        tryShortcutGenerate(event)
    } else if (key === "b") {
        tryShortcutBatch(event)
    } else if (key === "c" && event.shiftKey) {
        event.preventDefault()
        void handleCopyHistory()
    } else if (key === "c") {
        event.preventDefault()
        handleCopyCurrent()
    } else if (key === "s" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        void handleShareCurrent()
    } else if ((event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey) {
        if (!history.value.length) return
        event.preventDefault()
        handleUndoLast()
    } else if (event.key === "Escape") {
        if (historyManageMode.value) {
            event.preventDefault()
            historyManageMode.value = false
            flashStatus("Manage mode off")
        } else if (historyQuery.value) {
            historyQuery.value = ""
        }
    } else if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (!history.value.length) return
        event.preventDefault()
        historyFilterInput.value?.focus()
    } else if (key === "m" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        if (!history.value.length) return
        event.preventDefault()
        toggleHistoryManage()
    } else if (key === "?") {
        if (isNarrowViewport.value) {
            toggleMoreShortcutsHelp()
        } else {
            shortcutsPanelOpen.value = !shortcutsPanelOpen.value
            saveShortcutsPanelOpen(shortcutsPanelOpen.value)
        }
    }
}

watch(
    () => settings.snapshot(),
    (snapshot) => {
        scheduleReplaceBrowserUrlWithSettings(snapshot, currentNumber.value.value)
    },
    { deep: true },
)

watch(
    () => currentNumber.value.value,
    (value) => {
        scheduleReplaceBrowserUrlWithSettings(settings.snapshot(), value)
    },
)

watch(
    () => ({
        min: settings.min.value,
        max: settings.max.value,
        decimals: settings.decimals.value,
    }),
    ({ min, max, decimals }) => {
        const previous = currentNumber.value.value
        const clamped = clampValueToRange(previous, min, max, decimals)
        if (clamped !== previous) {
            setCurrent(clamped)
            flashStatus(
                `Adjusted to ${formatRandomNumber(clamped, decimals)} (was ${formatRandomNumber(previous, decimals)})`,
            )
        }
    },
)

onMounted(() => {
    const search = window.location.search
    const loadedSettings = applySettingsFromSearch(settings, search)
    const snapshot = settings.snapshot()
    const initialValue = resolveStartupDisplayValue(
        loadPersistedDisplay(),
        history.value,
        snapshot.min,
        snapshot.max,
        snapshot.decimals,
    )
    setCurrent(initialValue)
    const loadedDisplay = applyDisplayFromSearch(settings, search, (value) => {
        setCurrent(value)
    })
    isGeneratedManually.value =
        loadedDisplay ||
        history.value.length > 0 ||
        initialValue !== snapshot.min
    if (loadedSettings || loadedDisplay) {
        flashStatus("Loaded from share link")
    }
    window.addEventListener("keydown", handleRootKeyDown)
})

onUnmounted(() => {
    flushScheduledReplaceBrowserUrl()
    window.removeEventListener("keydown", handleRootKeyDown)
    if (copyScreenReaderTimer) {
        clearTimeout(copyScreenReaderTimer)
    }
    if (pulseTimer) {
        clearTimeout(pulseTimer)
    }
})
</script>

<style scoped>
.workspace {
    --card-gap: 12px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    max-width: 1280px;
    margin-inline: auto;
    padding-top: 0;
    padding-inline: max(20px, env(safe-area-inset-left, 0px))
        max(20px, env(safe-area-inset-right, 0px));
    padding-bottom: max(20px, env(safe-area-inset-bottom, 0px));
}

@media (max-width: 959px) {
    .workspace {
        padding-inline: max(16px, env(safe-area-inset-left, 0px))
            max(16px, env(safe-area-inset-right, 0px));
    }
}

.layout-grid {
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    min-width: 0;
}

.area-side {
    order: 1;
}

.area-main {
    order: 2;
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    min-width: 0;
}

@media (max-width: 959px) {
    .area-main {
        order: 1;
    }

    .area-side {
        display: none;
    }

    .sidebar-range-card {
        display: none;
    }

    .history-header-actions--wide {
        display: none;
    }

    .history-header.card-header-row {
        flex-direction: row;
        align-items: center;
    }

    .history-summary-inline {
        display: none;
    }
}

.backup-details-wide,
.shortcuts-details-wide {
    display: none;
}

@media (min-width: 960px) {
    .layout-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        grid-template-areas: "main side";
        gap: var(--card-gap);
        align-items: start;
    }

    .area-main {
        grid-area: main;
        order: unset;
    }

    .area-side {
        grid-area: side;
        order: unset;
        align-self: start;
    }

    .backup-details-wide,
    .shortcuts-details-wide {
        display: block;
    }
}

.column-side {
    display: flex;
    flex-direction: column;
    gap: var(--card-gap);
    min-width: 0;
}

.card {
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);
    padding: 20px;
    box-sizing: border-box;
}

.card-header-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 16px;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
}

.card-header-row .history-title {
    margin: 0;
    flex: 1 1 auto;
    min-width: 0;
    line-height: 32px;
    min-height: 32px;
}

.card-title {
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--app-text-secondary);
}

.generate-hint {
    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.45;
    color: var(--app-text-secondary);
    text-align: center;
}

.hero-actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--app-border);
}

.hero-actions .button-row {
    justify-content: center;
    margin: 0;
}

.sidebar-block {
    min-width: 0;
}

.sidebar-section-title {
    margin: 0 0 10px;
}

.sidebar-divider {
    margin: 12px 0;
    border: 0;
    border-top: 1px solid var(--app-border);
}

.card-sidebar-stack .range-summary {
    margin-bottom: 12px;
}

.range-option {
    margin-top: 12px;
}

.range-reset {
    margin-top: 4px;
    align-self: flex-start;
}

.range-card-title {
    margin: 0 0 8px;
}

.range-summary {
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--app-text-secondary);
}

.card-hero {
    text-align: center;
    --show-number-size: 64px;
    padding: 20px;
}

.hero-top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    margin-bottom: 4px;
    box-sizing: border-box;
}

.hero-top-actions {
    margin-left: auto;
}

.header-action-row {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    flex: 0 1 auto;
    max-width: 100%;
    box-sizing: border-box;
}

.header-action-row :deep(.action-button--ghost) {
    min-height: 32px;
    padding: 6px 10px;
    box-sizing: border-box;
}

.header-action-row :deep(.action-button--ghost:focus-visible) {
    outline-offset: 0;
}

@media (min-width: 960px) {
    .card-hero {
        --show-number-size: 72px;
    }
}

.card-hero.generated {
    --show-number-color: var(--app-text);
}

.card-hero:not(.generated) {
    --show-number-color: var(--app-text-muted);
}

.current-number {
    display: inline-block;
}

.current-number-copy {
    margin: 0;
    padding: 4px 8px;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    cursor: pointer;
    border-radius: 8px;
}

.current-number-copy:hover {
    background: #ebf2ff;
}

.current-number-copy:focus-visible {
    outline: 2px solid var(--app-accent);
    outline-offset: 2px;
}

.card-hero.pulse .current-number {
    animation: generate-pop 320ms ease;
}

@media (prefers-reduced-motion: reduce) {
    .card-hero.pulse .current-number {
        animation: none;
    }
}

@keyframes generate-pop {
    0% {
        transform: scale(1);
    }
    45% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}

.previous-number {
    margin: 12px 0 0;
    font-size: 13px;
    color: var(--app-text-secondary);
}

.fluent-details {
    margin: 0;
}

.button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
}

.hint,
:deep(.hint) {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    opacity: 0.75;
}

.history-header {
    margin-bottom: 12px;
}

.history-title {
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 13px;
    font-weight: 600;
    color: var(--app-text-secondary);
}

.history-header-actions {
    flex: 0 1 auto;
    max-width: 100%;
}

.narrow-more-row {
    display: flex;
    align-items: center;
    min-width: 0;
}

.narrow-more-trigger {
    flex: 0 0 auto;
}

.more-history-actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
}

.more-history-actions :deep(.action-button) {
    justify-content: center;
}

.more-history-summary {
    margin-top: 0;
}

.history-empty {
    margin: 0;
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: var(--app-text-secondary);
    border: 1px dashed var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-bg-subtle);
}

.preset-capacity {
    margin-left: 6px;
    font-weight: 400;
    color: var(--app-text-secondary);
}

.summary {
    margin: 0 0 14px;
    font-size: 13px;
    color: var(--app-text-secondary);
    line-height: 1.45;
}

.history-search {
    margin-bottom: 12px;
}

.history-export-filter {
    margin-top: 4px;
    margin-bottom: 8px;
}

.history-search-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.history-search-row .fluent-input {
    flex: 1;
    min-width: 0;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 20px;
}

.option-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 14px;
    color: var(--app-text);
    cursor: pointer;
}

.option-row input {
    width: 16px;
    height: 16px;
    accent-color: var(--app-accent);
}

.preset-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.preset-chip {
    cursor: pointer;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius);
    background: var(--app-bg-subtle);
    color: var(--app-text);
    font-family: inherit;
    font-size: 13px;
    padding: 6px 12px;
    transition: background 120ms ease, border-color 120ms ease;
}

.preset-chip:hover {
    border-color: var(--app-accent);
    background: var(--md-sys-color-secondary-container);
}

.preset-chip-custom {
    flex: 1;
    text-align: left;
}

.custom-preset-list {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.custom-preset-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.preset-item-actions {
    display: flex;
    gap: 8px;
}

.link-button {
    border: none;
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: var(--app-accent);
    cursor: pointer;
}

.link-button:hover {
    text-decoration: underline;
}

.link-button-danger {
    color: var(--app-danger);
}

.save-preset {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    padding-top: 16px;
    margin-top: 4px;
    border-top: 1px solid var(--app-border);
}

.save-preset-field {
    flex: 1 1 160px;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.more-dialog-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: -4px 0 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--app-border);
}

.more-dialog-nav :deep(.action-button--ghost[aria-current="page"]) {
    background: var(--md-sys-color-secondary-container);
    color: var(--app-text);
}

.more-dialog-panel {
    min-width: 0;
}

@media (max-width: 639px) {
    .workspace {
        padding-bottom: max(20px, env(safe-area-inset-bottom, 0px));
    }

    .layout-grid {
        gap: var(--card-gap);
    }

    .area-main {
        gap: var(--card-gap);
    }

    .column-side {
        gap: var(--card-gap);
    }

    .card {
        padding: 16px;
    }

    .card-hero {
        --show-number-size: 48px;
        padding: 16px;
    }

    .card-header-row {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .card-header-row .history-title {
        line-height: 1.25;
        min-height: 0;
    }

    .header-action-row {
        justify-content: flex-start;
    }

    .hero-top-actions {
        margin-left: 0;
        width: 100%;
    }

    .hero-top-actions.header-action-row {
        justify-content: flex-start;
    }

    .header-action-row :deep(.action-button--ghost) {
        min-height: 44px;
        padding: 10px 12px;
    }

    @media (max-width: 480px) {
        .card-hero {
            --show-number-size: 40px;
        }
    }

    .settings-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .button-row {
        flex-direction: column;
        align-items: stretch;
    }

    .button-row :deep(.action-button) {
        align-self: stretch;
        justify-content: center;
    }

    .history-header {
        margin-bottom: 12px;
    }

    .history-header-actions {
        justify-content: flex-start;
        max-width: 100%;
    }

    .history-header-actions :deep(.action-button--ghost) {
        flex: 0 1 auto;
        min-width: 0;
    }

    .history-search-row {
        flex-direction: column;
        align-items: stretch;
    }

    .history-search-row :deep(.action-button) {
        align-self: stretch;
    }

    .narrow-more-row :deep(.action-button--ghost) {
        min-height: 44px;
        padding: 10px 12px;
    }

    .more-history-actions :deep(.action-button--ghost) {
        min-height: 44px;
        padding: 10px 12px;
    }

    .more-dialog-nav :deep(.action-button--ghost) {
        min-height: 44px;
        padding: 10px 12px;
    }

    .link-button {
        min-height: 44px;
        padding: 10px 8px;
        display: inline-flex;
        align-items: center;
    }

    .preset-chip {
        min-height: 44px;
        padding: 10px 14px;
    }

    .option-row {
        min-height: 44px;
        padding: 10px 0;
    }

    .option-row input {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .save-preset {
        flex-direction: column;
        align-items: stretch;
    }

    .save-preset-field {
        flex: 1 1 auto;
        align-self: stretch;
    }

    .save-preset :deep(.action-button) {
        align-self: stretch;
    }

    .custom-preset-item {
        flex-direction: column;
        align-items: stretch;
    }

    .preset-chip-custom {
        align-self: stretch;
    }

    .preset-item-actions {
        justify-content: flex-start;
        flex-wrap: wrap;
    }
}

@media (max-width: 480px) {
    .workspace {
        padding-inline: max(12px, env(safe-area-inset-left, 0px))
            max(12px, env(safe-area-inset-right, 0px));
    }

    .card {
        padding: 12px;
    }
}
</style>
