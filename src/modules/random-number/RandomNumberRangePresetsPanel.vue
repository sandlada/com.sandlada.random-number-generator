<template>
    <div class="range-presets-panel">
        <div class="sidebar-block">
            <h2 class="card-title range-card-title">Range</h2>
            <p class="range-summary">{{ rangeSummaryText }}</p>
            <div class="settings-grid">
                <label class="fluent-field">
                    <span class="fluent-field-label">Min</span>
                    <input
                        v-model.number="settings.min.value"
                        type="number"
                        step="any"
                        class="fluent-input"
                        @change="settings.applyNormalization()"
                        @keydown.enter.prevent="emit('settingsEnterGenerate')"
                    />
                </label>
                <label class="fluent-field">
                    <span class="fluent-field-label">Max</span>
                    <input
                        v-model.number="settings.max.value"
                        type="number"
                        step="any"
                        class="fluent-input"
                        @change="settings.applyNormalization()"
                        @keydown.enter.prevent="emit('settingsEnterGenerate')"
                    />
                </label>
                <label class="fluent-field">
                    <span class="fluent-field-label">Decimals</span>
                    <input
                        v-model.number="settings.decimals.value"
                        type="number"
                        min="0"
                        max="10"
                        step="1"
                        class="fluent-input"
                        @change="settings.applyNormalization()"
                    />
                </label>
                <label class="fluent-field">
                    <span class="fluent-field-label">Batch Size</span>
                    <input
                        v-model.number="settings.batchCount.value"
                        type="number"
                        min="1"
                        max="20"
                        step="1"
                        class="fluent-input"
                        @change="settings.applyNormalization()"
                    />
                </label>
            </div>
            <label class="option-row range-option">
                <input v-model="settings.noRepeat.value" type="checkbox" />
                <span>No repeat (unique values)</span>
            </label>
            <div class="range-link-actions">
                <button type="button" class="link-button" @click="emit('swapRangeBounds')">
                    Swap min ↔ max
                </button>
                <button type="button" class="link-button" @click="emit('resetRangeDefaults')">
                    Reset To Defaults
                </button>
            </div>
        </div>

        <div class="sidebar-divider" role="presentation" />

        <div class="sidebar-block">
            <h2 class="card-title sidebar-section-title">Presets</h2>
            <div class="preset-chips" aria-label="Built-in presets">
                <button
                    v-for="preset in RANGE_PRESETS"
                    :key="preset.id"
                    type="button"
                    class="preset-chip"
                    @click="() => emit('applyPreset', preset)"
                >
                    {{ preset.label }}
                </button>
            </div>
            <ul v-if="customPresets.length" class="custom-preset-list" aria-label="Saved presets">
                <li v-for="preset in customPresets" :key="preset.id" class="custom-preset-item">
                    <button
                        type="button"
                        class="preset-chip preset-chip-custom"
                        @click="() => emit('applyPreset', preset)"
                    >
                        {{ preset.label }}
                    </button>
                    <div class="preset-item-actions">
                        <button
                            type="button"
                            class="link-button"
                            @click="() => emit('duplicateCustomPreset', preset.id)"
                        >
                            Duplicate
                        </button>
                        <button
                            type="button"
                            class="link-button"
                            @click="() => emit('renameCustomPreset', preset.id, preset.label)"
                        >
                            Rename
                        </button>
                        <button
                            type="button"
                            class="link-button link-button-danger"
                            @click="() => emit('removeCustomPreset', preset.id)"
                        >
                            Remove
                        </button>
                    </div>
                </li>
            </ul>
            <div class="save-preset">
                <label class="fluent-field save-preset-field">
                    <span class="fluent-field-label save-preset-label">
                        Save current range as
                        <span class="preset-capacity">{{ customPresetCapacityText }}</span>
                    </span>
                    <input
                        :value="presetLabel"
                        type="text"
                        class="fluent-input"
                        maxlength="32"
                        @input="onPresetLabelInput"
                    />
                </label>
                <RandomNumberActionButton @click="emit('saveCustomPreset')">Save Preset</RandomNumberActionButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { RANGE_PRESETS, type RandomNumberSettings, type RangePreset } from "./generator"
import RandomNumberActionButton from "./RandomNumberActionButton.vue"

defineProps<{
    settings: RandomNumberSettings
    rangeSummaryText: string
    presetLabel: string
    customPresets: RangePreset[]
    customPresetCapacityText: string
}>()

const emit = defineEmits<{
    settingsEnterGenerate: []
    resetRangeDefaults: []
    swapRangeBounds: []
    applyPreset: [preset: RangePreset]
    duplicateCustomPreset: [id: string]
    renameCustomPreset: [id: string, label: string]
    removeCustomPreset: [id: string]
    saveCustomPreset: []
    "update:presetLabel": [value: string]
}>()

const onPresetLabelInput = (event: Event) => {
    const target = event.target
    if (target instanceof HTMLInputElement) {
        emit("update:presetLabel", target.value)
    }
}
</script>

<style scoped>
.sidebar-block {
    min-width: 0;
}

.card-title {
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--app-text-secondary);
}

.sidebar-section-title {
    margin: 0 0 10px;
}

.sidebar-divider {
    margin: 12px 0;
    border: 0;
    border-top: 1px solid var(--app-border);
}

.range-card-title {
    margin: 0 0 8px;
}

.range-summary {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--app-text-secondary);
}

.range-option {
    margin-top: 12px;
}

.range-link-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
    margin-top: 4px;
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

.preset-capacity {
    font-weight: 400;
    color: var(--app-text-secondary);
}

.save-preset-label {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
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

@media (max-width: 639px) {
    .settings-grid {
        grid-template-columns: 1fr;
        gap: 12px;
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
</style>
