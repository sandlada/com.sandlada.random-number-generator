import { describe, expect, it, vi } from "vitest"
import {
    addCustomPreset,
    clampBatchCount,
    clampDecimals,
    clampValueToRange,
    countValuesInRange,
    createCustomPreset,
    createRandomInRange,
    createUniqueRandomInRange,
    createHistoryItemsFromValues,
    RandomNumberSettings,
    formatGenerateBlockedStatus,
    formatBatchGenerateBlockedStatus,
    isGenerateDisabled,
    isRangeSettingsInvalid,
    swapRangeBounds,
    enumerateValuesInRange,
    formatHistoryAsCsv,
    formatHistoryForCopy,
    formatRandomNumber,
    buildHistoryExportFilename,
    buildSessionExportFilename,
    formatCustomPresetCapacity,
    formatExportFilenameStamp,
    formatRangeDescription,
    importHistoryValues,
    analyzeHistoryImport,
    countImportValuesAlreadyInHistory,
    resolveInitialDisplayValue,
    resolveStartupDisplayValue,
    normalizeRange,
    parseHistoryImport,
    parseHistoryFileContent,
    parseSettingsFromSearch,
    parseDisplayValueFromSearch,
    applyDisplayFromSearch,
    remainingUniqueCount,
    removeCustomPreset,
    renameCustomPreset,
    duplicateCustomPreset,
    filterHistoryValuesByQuery,
    flushScheduledReplaceBrowserUrl,
    scheduleReplaceBrowserUrlWithSettings,
    DEFAULT_SETTINGS_SNAPSHOT,
    resolveSessionDisplayValue,
    summarizeHistory,
    computeHistoryMedian,
    formatHistorySummaryStats,
    formatHistoryImportSuccessMessage,
    buildSettingsShareUrl,
    formatBatchGenerateStatus,
    resolveShareDisplayValue,
    buildHistoryJsonExport,
    buildSessionExport,
    serializeSessionExport,
    normalizeSessionImport,
    parseSessionImport,
    SESSION_EXPORT_VERSION,
    formatHistoryExportStatusSuffix,
    formatHistoryExportSuccessMessage,
    formatSessionExportSuccessMessage,
    formatSessionImportSuccessMessage,
    buildHistoryExportSummaryPayload,
    resolveRestoredCurrentEntry,
    moveHistoryEntry,
    reorderHistory,
} from "./generator"

describe("normalizeRange", () => {
    it("swaps inverted bounds", () => {
        expect(normalizeRange(10, 2)).toEqual([2, 10])
    })

    it("falls back when values are not finite", () => {
        expect(normalizeRange(Number.NaN, 5)).toEqual([0, 100])
    })
})

describe("clampDecimals", () => {
    it("truncates and clamps to 0..10", () => {
        expect(clampDecimals(12.9)).toBe(10)
        expect(clampDecimals(-3)).toBe(0)
    })
})

describe("clampBatchCount", () => {
    it("clamps batch size to 1..20", () => {
        expect(clampBatchCount(0)).toBe(1)
        expect(clampBatchCount(99)).toBe(20)
    })
})

describe("createRandomInRange", () => {
    it("respects integer bounds", () => {
        for (let i = 0; i < 50; i++) {
            const value = createRandomInRange(1, 3, 0)
            expect(value).toBeGreaterThanOrEqual(1)
            expect(value).toBeLessThanOrEqual(3)
            expect(Number.isInteger(value)).toBe(true)
        }
    })
})

describe("createUniqueRandomInRange", () => {
    it("returns pool_exhausted when every value is excluded", () => {
        const excluded = new Set([0, 1])
        const result = createUniqueRandomInRange(0, 1, 0, excluded, 8)
        expect(result).toEqual({ ok: false, reason: "pool_exhausted" })
    })

    it("picks the only remaining value in a small pool", () => {
        const excluded = new Set([1, 2, 3, 4, 5])
        const result = createUniqueRandomInRange(1, 6, 0, excluded)
        expect(result).toEqual({ ok: true, value: 6 })
    })
})

describe("enumerateValuesInRange", () => {
    it("lists integer values inclusively", () => {
        expect(enumerateValuesInRange(1, 3, 0)).toEqual([1, 2, 3])
    })
})

describe("formatRandomNumber", () => {
    it("formats decimals consistently", () => {
        expect(formatRandomNumber(1.2, 2)).toBe("1.20")
        expect(formatRandomNumber(1.6, 0)).toBe("2")
    })
})

describe("formatRangeDescription", () => {
    it("describes integer and decimal ranges", () => {
        expect(formatRangeDescription({ min: 1, max: 6, decimals: 0 })).toBe(
            "1–6 · integers",
        )
        expect(formatRangeDescription({ min: 0, max: 1, decimals: 2 })).toBe(
            "0.00–1.00 · 2 decimal places",
        )
    })
})

describe("resolveInitialDisplayValue", () => {
    it("uses last history value when present", () => {
        expect(resolveInitialDisplayValue([{ value: 2 }, { value: 5 }], 0)).toBe(5)
    })

    it("falls back to min when history is empty", () => {
        expect(resolveInitialDisplayValue([], 3)).toBe(3)
    })
})

describe("resolveStartupDisplayValue", () => {
    it("prefers persisted value when it fits the range", () => {
        expect(resolveStartupDisplayValue(42, [{ value: 1 }], 0, 100, 0)).toBe(42)
    })

    it("falls back when persisted value is out of range", () => {
        expect(resolveStartupDisplayValue(200, [{ value: 7 }], 0, 100, 0)).toBe(7)
    })

    it("uses min when nothing else applies", () => {
        expect(resolveStartupDisplayValue(null, [], 5, 10, 0)).toBe(5)
    })
})

describe("countValuesInRange", () => {
    it("counts integer slots inclusively", () => {
        expect(countValuesInRange(1, 6, 0)).toBe(6)
        expect(countValuesInRange(0, 1, 0)).toBe(2)
    })
})

describe("summarizeHistory", () => {
    it("returns null for empty history", () => {
        expect(summarizeHistory([])).toBeNull()
    })

    it("computes min max median and average", () => {
        expect(summarizeHistory([{ value: 2 }, { value: 4 }])).toEqual({
            count: 2,
            min: 2,
            max: 4,
            median: 3,
            average: 3,
        })
    })

    it("uses mean of middle pair for even-length median", () => {
        expect(summarizeHistory([{ value: 1 }, { value: 2 }, { value: 9 }, { value: 10 }])?.median).toBe(
            5.5,
        )
    })
})

describe("formatHistorySummaryStats", () => {
    it("formats stats with decimal places", () => {
        const summary = summarizeHistory([{ value: 1.2 }, { value: 2.4 }])!
        expect(formatHistorySummaryStats(summary, 1)).toBe(
            "min 1.2 · max 2.4 · med 1.8 · avg 1.8",
        )
    })
})

describe("computeHistoryMedian", () => {
    it("returns middle value for odd length", () => {
        expect(computeHistoryMedian([5, 1, 3])).toBe(3)
    })
})

describe("formatHistoryAsCsv", () => {
    it("includes header and rows", () => {
        expect(formatHistoryAsCsv([{ value: 3 }], 0)).toBe("index,value\n1,3")
    })
})

describe("formatHistoryForCopy", () => {
    it("joins formatted values one per line", () => {
        expect(
            formatHistoryForCopy([{ value: 1.5 }, { value: 2 }], 1),
        ).toBe("1.5\n2.0")
    })

    it("returns empty string for no items", () => {
        expect(formatHistoryForCopy([], 0)).toBe("")
    })
})

describe("remainingUniqueCount", () => {
    it("subtracts excluded size from pool", () => {
        expect(remainingUniqueCount(0, 1, 0, new Set([0]))).toBe(1)
    })
})

describe("parseHistoryImport", () => {
    it("skips header and parses csv rows", () => {
        expect(parseHistoryImport("index,value\n1,3\n2,5")).toEqual([3, 5])
    })
})

describe("parseHistoryFileContent", () => {
    it("returns empty for valid json with no values", () => {
        expect(parseHistoryFileContent('{"version":1,"values":[]}')).toEqual([])
    })
})

describe("clampValueToRange", () => {
    it("clamps out-of-range values to bounds", () => {
        expect(clampValueToRange(150, 0, 100, 0)).toBe(100)
        expect(clampValueToRange(-5, 0, 100, 0)).toBe(0)
    })

    it("rounds to decimal precision", () => {
        expect(clampValueToRange(1.239, 0, 2, 2)).toBe(1.24)
    })
})

describe("importHistoryValues", () => {
    it("drops values outside range", () => {
        expect(importHistoryValues("9\n2", 1, 6, 0)).toEqual([2])
    })

    it("parses exported json history", () => {
        const json = buildHistoryJsonExport([{ value: 2 }, { value: 5 }], 0)
        expect(importHistoryValues(json, 0, 10, 0)).toEqual([2, 5])
    })

    it("parses a plain json number array", () => {
        expect(importHistoryValues("[1, 2, 99]", 0, 10, 0)).toEqual([1, 2])
    })
})

describe("buildHistoryJsonExport", () => {
    it("includes summary metadata block", () => {
        const json = buildHistoryJsonExport([{ value: 2 }, { value: 4 }], 0)
        const parsed = JSON.parse(json) as {
            values: number[]
            summary: { count: number; median: number }
        }
        expect(parsed.values).toEqual([2, 4])
        expect(parsed.summary).toEqual({
            count: 2,
            min: 2,
            max: 4,
            median: 3,
            average: 3,
        })
    })

    it("marks filtered exports with query metadata", () => {
        const json = buildHistoryJsonExport([{ value: 1 }], 0, {
            filtered: true,
            filterQuery: " 1 ",
        })
        const parsed = JSON.parse(json) as { filtered?: boolean; filterQuery?: string }
        expect(parsed.filtered).toBe(true)
        expect(parsed.filterQuery).toBe("1")
    })
})

describe("analyzeHistoryImport", () => {
    it("reports empty file", () => {
        expect(analyzeHistoryImport("  ", 0, 10, 0).failure).toBe("empty")
    })

    it("reports invalid json", () => {
        expect(analyzeHistoryImport("{not json", 0, 10, 0).failure).toBe("invalid_json")
    })

    it("counts values dropped outside range", () => {
        const result = analyzeHistoryImport("9\n2\n3", 1, 6, 0)
        expect(result.failure).toBeNull()
        expect(result.values).toEqual([2, 3])
        expect(result.droppedOutOfRange).toBe(1)
    })

    it("reports no values in range when all out of band", () => {
        const result = analyzeHistoryImport("99\n100", 1, 6, 0)
        expect(result.failure).toBe("no_values_in_range")
        expect(result.droppedOutOfRange).toBe(2)
    })
})

describe("countImportValuesAlreadyInHistory", () => {
    it("counts overlapping values", () => {
        const history = [{ value: 1 }, { value: 2 }]
        expect(countImportValuesAlreadyInHistory([1, 2, 3], history)).toBe(2)
        expect(countImportValuesAlreadyInHistory([3, 4], history)).toBe(0)
    })
})

describe("createHistoryItemsFromValues", () => {
    it("assigns unique ids", () => {
        const items = createHistoryItemsFromValues([1, 2])
        expect(items).toHaveLength(2)
        expect(items[0]?.id).not.toBe(items[1]?.id)
    })
})

describe("moveHistoryEntry", () => {
    const items = [
        { id: "a", value: 1 },
        { id: "b", value: 2 },
        { id: "c", value: 3 },
    ]

    it("moves one step newer in storage order", () => {
        expect(moveHistoryEntry(items, "b", "newer").map((e) => e.id)).toEqual(["a", "c", "b"])
    })

    it("moves one step older in storage order", () => {
        expect(moveHistoryEntry(items, "b", "older").map((e) => e.id)).toEqual(["b", "a", "c"])
    })

    it("no-ops at boundaries", () => {
        expect(moveHistoryEntry(items, "a", "older").map((e) => e.id)).toEqual(["a", "b", "c"])
        expect(moveHistoryEntry(items, "c", "newer").map((e) => e.id)).toEqual(["a", "b", "c"])
    })
})

describe("reorderHistory", () => {
    const items = [
        { id: "a", value: 1 },
        { id: "b", value: 2 },
        { id: "c", value: 3 },
    ]

    it("orders by id list and keeps unknown tail", () => {
        expect(reorderHistory(items, ["c", "a"]).map((e) => e.id)).toEqual(["c", "a", "b"])
    })

    it("with empty orderedIds preserves storage order", () => {
        expect(reorderHistory(items, []).map((e) => e.id)).toEqual(["a", "b", "c"])
    })

    it("ignores duplicate and unknown ids in orderedIds", () => {
        expect(reorderHistory(items, ["b", "b", "z", "a"]).map((e) => e.id)).toEqual(["b", "a", "c"])
    })
})

describe("swapRangeBounds", () => {
    it("swaps min and max on settings", () => {
        const settings = new RandomNumberSettings()
        settings.min.value = 2
        settings.max.value = 9
        swapRangeBounds(settings)
        expect(settings.min.value).toBe(9)
        expect(settings.max.value).toBe(2)
    })
})

describe("isGenerateDisabled", () => {
    it("blocks fill and generate when range settings are invalid", () => {
        expect(
            isGenerateDisabled({
                isFillingUnique: false,
                uniquePoolExhausted: false,
                rangeInvalid: true,
            }),
        ).toBe(true)
    })
})

describe("formatGenerateBlockedStatus", () => {
    it("returns null when generate is allowed", () => {
        expect(
            formatGenerateBlockedStatus({ isFillingUnique: false, uniquePoolExhausted: false }),
        ).toBeNull()
    })

    it("explains invalid range settings", () => {
        expect(
            formatGenerateBlockedStatus({
                isFillingUnique: false,
                uniquePoolExhausted: false,
                rangeInvalid: true,
            }),
        ).toContain("Fix min and max")
    })

    it("prefers invalid range over fill and exhaustion", () => {
        expect(
            formatGenerateBlockedStatus({
                isFillingUnique: true,
                uniquePoolExhausted: true,
                rangeInvalid: true,
            }),
        ).toContain("Fix min and max")
    })

    it("explains unique pool exhaustion", () => {
        expect(
            formatGenerateBlockedStatus({ isFillingUnique: false, uniquePoolExhausted: true }),
        ).toContain("No unique numbers left")
    })

    it("prefers fill-in-progress over exhaustion", () => {
        expect(
            formatGenerateBlockedStatus({ isFillingUnique: true, uniquePoolExhausted: true }),
        ).toContain("Fill in progress")
    })
})

describe("isRangeSettingsInvalid", () => {
    it("detects non-finite bounds", () => {
        expect(isRangeSettingsInvalid(Number.NaN, 10)).toBe(true)
        expect(isRangeSettingsInvalid(0, Number.POSITIVE_INFINITY)).toBe(true)
        expect(isRangeSettingsInvalid(1, 6)).toBe(false)
    })
})

describe("formatBatchGenerateBlockedStatus", () => {
    it("matches single-generate blocked messages", () => {
        const input = { isFillingUnique: true, uniquePoolExhausted: false }
        expect(formatBatchGenerateBlockedStatus(input)).toBe(formatGenerateBlockedStatus(input))
    })
})

describe("formatCustomPresetCapacity", () => {
    it("shows count and max", () => {
        expect(formatCustomPresetCapacity(3, 12)).toBe("3 / 12 saved")
    })
})

describe("parseSettingsFromSearch", () => {
    it("reads min and max from query", () => {
        expect(parseSettingsFromSearch("?min=1&max=6&decimals=0")).toEqual({
            min: 1,
            max: 6,
            decimals: 0,
        })
    })

    it("returns empty patch when only n is present", () => {
        expect(parseSettingsFromSearch("?n=12")).toEqual({})
    })
})

describe("buildSettingsShareUrl", () => {
    it("encodes settings in query string", () => {
        const url = buildSettingsShareUrl("https://example.test/", {
            min: 1,
            max: 6,
            decimals: 0,
            batchCount: 5,
            noRepeat: false,
        })
        expect(url).toContain("min=1")
        expect(url).toContain("max=6")
    })

    it("includes optional display value as n", () => {
        const url = buildSettingsShareUrl(
            "https://example.test/",
            {
                min: 0,
                max: 100,
                decimals: 0,
                batchCount: 1,
                noRepeat: false,
            },
            42,
        )
        expect(url).toContain("n=42")
    })

    it("omits n when display is outside range", () => {
        const url = buildSettingsShareUrl(
            "https://example.test/",
            {
                min: 0,
                max: 10,
                decimals: 0,
                batchCount: 5,
                noRepeat: false,
            },
            99,
        )
        expect(new URL(url).searchParams.has("n")).toBe(false)
    })
})

describe("resolveShareDisplayValue", () => {
    it("returns normalized value in range", () => {
        const snapshot = { ...DEFAULT_SETTINGS_SNAPSHOT(), min: 0, max: 10, decimals: 0 }
        expect(resolveShareDisplayValue(snapshot, 7)).toBe(7)
    })

    it("returns undefined when out of range", () => {
        const snapshot = { ...DEFAULT_SETTINGS_SNAPSHOT(), min: 0, max: 10, decimals: 0 }
        expect(resolveShareDisplayValue(snapshot, 50)).toBeUndefined()
    })
})

describe("formatBatchGenerateStatus", () => {
    it("reports full batch completion", () => {
        expect(formatBatchGenerateStatus(5, 5, false)).toBe("Batch complete (5 of 5)")
    })

    it("reports early stop when pool exhausted", () => {
        expect(formatBatchGenerateStatus(5, 2, true)).toBe(
            "Batch stopped after 2 of 5 — no unique numbers left",
        )
    })

    it("reports zero draws on immediate exhaustion", () => {
        expect(formatBatchGenerateStatus(5, 0, true)).toBe(
            "Batch stopped: no unique numbers left (0 of 5)",
        )
    })
})

describe("parseDisplayValueFromSearch", () => {
    it("reads n from query", () => {
        expect(parseDisplayValueFromSearch("?min=0&max=10&n=7")).toBe(7)
    })
})

describe("applyDisplayFromSearch", () => {
    it("sets display when n fits range", () => {
        const min = { value: 0 }
        const max = { value: 10 }
        const decimals = { value: 0 }
        const settings = {
            min,
            max,
            decimals,
        } as import("./generator").RandomNumberSettings
        let displayed: number | undefined
        const ok = applyDisplayFromSearch(settings, "?n=5", (value) => {
            displayed = value
        })
        expect(ok).toBe(true)
        expect(displayed).toBe(5)
    })
})

describe("custom presets", () => {
    it("adds and removes presets with max cap", () => {
        const first = createCustomPreset("A", { min: 1, max: 2, decimals: 0 })
        let list = addCustomPreset([], first)
        expect(list).toHaveLength(1)
        list = removeCustomPreset(list, first.id)
        expect(list).toHaveLength(0)
    })

    it("deduplicates preset labels", () => {
        const existing = [createCustomPreset("Game", { min: 1, max: 6, decimals: 0 })]
        const second = createCustomPreset("Game", { min: 1, max: 10, decimals: 0 }, existing)
        expect(second.label).toBe("Game (2)")
    })

    it("renames a preset with deduplicated label", () => {
        const preset = createCustomPreset("A", { min: 0, max: 1, decimals: 0 })
        const { presets: renamed, appliedLabel } = renameCustomPreset([preset], preset.id, "B")
        expect(renamed[0]?.label).toBe("B")
        expect(appliedLabel).toBe("B")
    })

    it("ignores rename when label is blank", () => {
        const preset = createCustomPreset("A", { min: 0, max: 1, decimals: 0 })
        const { presets: renamed, appliedLabel } = renameCustomPreset([preset], preset.id, "   ")
        expect(renamed[0]?.label).toBe("A")
        expect(appliedLabel).toBeNull()
    })

    it("duplicates a custom preset", () => {
        const preset = createCustomPreset("Mine", { min: 1, max: 2, decimals: 0 })
        const list = duplicateCustomPreset([preset], preset.id)
        expect(list).toHaveLength(2)
        expect(list[1]?.min).toBe(1)
        expect(list[1]?.label).toContain("copy")
    })
})

describe("session export", () => {
    it("round-trips through parseSessionImport", () => {
        const snapshot = DEFAULT_SETTINGS_SNAPSHOT()
        const payload = buildSessionExport(snapshot, [{ id: "a", value: 3 }], [])
        expect(payload.version).toBe(SESSION_EXPORT_VERSION)
        expect(payload.historySummary).toEqual({
            count: 1,
            min: 3,
            max: 3,
            median: 3,
            average: 3,
        })
        const parsed = parseSessionImport(JSON.stringify(payload))
        expect(parsed?.history[0]?.value).toBe(3)
    })

    it("rejects invalid session json", () => {
        expect(parseSessionImport("{}")).toBeNull()
    })

    it("sanitizes malformed history entries", () => {
        const snapshot = DEFAULT_SETTINGS_SNAPSHOT()
        const raw = {
            version: SESSION_EXPORT_VERSION,
            exportedAt: "2026-01-01T00:00:00.000Z",
            settings: snapshot,
            history: [
                { id: "ok", value: 4 },
                { id: "bad", value: Number.NaN },
            ],
            customPresets: [],
        }
        const parsed = parseSessionImport(JSON.stringify(raw))
        expect(parsed?.history).toEqual([{ id: "ok", value: 4 }])
    })

    it("round-trips displayValue when in range", () => {
        const snapshot = { ...DEFAULT_SETTINGS_SNAPSHOT(), min: 0, max: 100 }
        const payload = buildSessionExport(snapshot, [{ id: "a", value: 3 }], [], 42)
        expect(payload.displayValue).toBe(42)
        const parsed = parseSessionImport(JSON.stringify(payload))
        expect(resolveSessionDisplayValue(parsed!)).toBe(42)
    })

    it("drops displayValue when outside imported settings range", () => {
        const snapshot = { ...DEFAULT_SETTINGS_SNAPSHOT(), min: 0, max: 100 }
        const payload = buildSessionExport(snapshot, [], [], 42)
        const parsed = parseSessionImport(JSON.stringify(payload))
        expect(parsed?.displayValue).toBe(42)
        expect(resolveSessionDisplayValue(parsed!)).toBe(42)
        const narrowed = parseSessionImport(
            JSON.stringify({
                ...payload,
                settings: { ...snapshot, max: 5 },
            }),
        )
        expect(resolveSessionDisplayValue(narrowed!)).toBeNull()
    })

    it("serializes with pretty printing", () => {
        const json = serializeSessionExport(DEFAULT_SETTINGS_SNAPSHOT(), [], [])
        expect(json).toContain("\n")
        expect(parseSessionImport(json)?.settings.min).toBe(0)
    })
})

describe("filterHistoryValuesByQuery", () => {
    it("returns all rows when query is empty", () => {
        const items = [{ value: 1 }, { value: 12 }]
        expect(filterHistoryValuesByQuery(items, "  ", 0)).toHaveLength(2)
    })

    it("matches formatted number substrings", () => {
        const items = [{ value: 1 }, { value: 12 }, { value: 99 }]
        expect(filterHistoryValuesByQuery(items, "12", 0).map((i) => i.value)).toEqual([12])
    })
})

describe("scheduleReplaceBrowserUrlWithSettings", () => {
    it("coalesces rapid history.replaceState calls", () => {
        vi.useFakeTimers()
        const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {})
        const snapshot = DEFAULT_SETTINGS_SNAPSHOT()

        scheduleReplaceBrowserUrlWithSettings(snapshot, 1)
        scheduleReplaceBrowserUrlWithSettings(snapshot, 2)
        expect(replaceState).not.toHaveBeenCalled()

        vi.advanceTimersByTime(200)
        expect(replaceState).toHaveBeenCalledTimes(1)

        flushScheduledReplaceBrowserUrl()
        replaceState.mockRestore()
        vi.useRealTimers()
    })
})

describe("formatHistoryImportSuccessMessage", () => {
    it("notes filter and export scope after import", () => {
        expect(
            formatHistoryImportSuccessMessage({
                mode: "append",
                importedCount: 3,
                droppedOutOfRange: 0,
                duplicateInHistoryCount: 0,
                historyLength: 10,
                maxHistoryLength: 500,
                hadFilterQuery: true,
                hadExportFilteredOnly: true,
            }),
        ).toBe(
            "Imported 3 values · filter cleared · history exports may use filter-only until you change it",
        )
    })

    it("includes duplicate and out-of-range notes", () => {
        expect(
            formatHistoryImportSuccessMessage({
                mode: "append",
                importedCount: 2,
                droppedOutOfRange: 1,
                duplicateInHistoryCount: 1,
                historyLength: 5,
                maxHistoryLength: 500,
                hadFilterQuery: false,
                hadExportFilteredOnly: false,
            }),
        ).toBe("Imported 2 values (1 already in history) · 1 skipped (out of range)")
    })
})

describe("formatHistoryExportStatusSuffix", () => {
    it("returns empty when not exporting filtered only", () => {
        expect(
            formatHistoryExportStatusSuffix({
                exportFilteredOnly: false,
                query: "1",
                exportedCount: 2,
                totalCount: 10,
            }),
        ).toBe("")
    })

    it("describes partial filter match", () => {
        expect(
            formatHistoryExportStatusSuffix({
                exportFilteredOnly: true,
                query: "12",
                exportedCount: 2,
                totalCount: 8,
            }),
        ).toBe(' — 2 of 8 matching “12”')
    })

    it("notes when filter matches none", () => {
        expect(
            formatHistoryExportStatusSuffix({
                exportFilteredOnly: true,
                query: "zzz",
                exportedCount: 0,
                totalCount: 5,
            }),
        ).toBe(" — filter matched none")
    })
})

describe("formatHistoryExportSuccessMessage", () => {
    it("notes full history when filter visible but export is not filter-only", () => {
        expect(
            formatHistoryExportSuccessMessage("History copied", {
                exportFilteredOnly: false,
                query: "12",
                exportedCount: 8,
                totalCount: 8,
            }),
        ).toBe(
            'History copied · full history (8 entries, filter “12” not applied to export)',
        )
    })

    it("uses filter suffix when export filtered only", () => {
        expect(
            formatHistoryExportSuccessMessage("CSV downloaded", {
                exportFilteredOnly: true,
                query: "1",
                exportedCount: 2,
                totalCount: 10,
            }),
        ).toBe('CSV downloaded — 2 of 10 matching “1”')
    })
})

describe("formatSessionExportSuccessMessage", () => {
    it("mentions summary, saved filter, and filter-only export flag", () => {
        expect(
            formatSessionExportSuccessMessage({
                historyCount: 5,
                hadFilterQuery: true,
                filterQuery: " 7 ",
                hadExportFilteredOnly: true,
                hasSummary: true,
            }),
        ).toBe(
            'Session exported · 5 history entries · summary included · filter “7” saved in file · history exports may use filter-only until you change it',
        )
    })
})

describe("formatSessionImportSuccessMessage", () => {
    it("mentions summary and restored filter state", () => {
        expect(
            formatSessionImportSuccessMessage({
                historyCount: 3,
                hasSummary: true,
                restoredFilterQuery: true,
                filterQuery: " 12 ",
                hadExportFilteredOnly: true,
            }),
        ).toBe(
            'Session restored · 3 history entries · summary was in file · filter “12” restored · history exports may use filter-only until you change it',
        )
    })
})

describe("resolveRestoredCurrentEntry", () => {
    it("keeps id when entry still exists in history", () => {
        const history = [
            { id: "a", value: 1 },
            { id: "b", value: 2 },
        ]
        expect(resolveRestoredCurrentEntry({ id: "b", value: 2 }, history)).toEqual({
            id: "b",
            value: 2,
        })
    })

    it("falls back to latest matching value when id is stale", () => {
        const history = [
            { id: "a", value: 7 },
            { id: "c", value: 7 },
        ]
        expect(resolveRestoredCurrentEntry({ id: "gone", value: 7 }, history)).toEqual({
            id: "c",
            value: 7,
        })
    })
})

describe("session historyFilter", () => {
    it("round-trips filter state in session export", () => {
        const payload = buildSessionExport(
            DEFAULT_SETTINGS_SNAPSHOT(),
            [],
            [],
            undefined,
            { query: "42", exportFilteredOnly: true },
        )
        expect(payload.historyFilter).toEqual({ query: "42", exportFilteredOnly: true })
        const parsed = parseSessionImport(serializeSessionExport(
            DEFAULT_SETTINGS_SNAPSHOT(),
            [],
            [],
            undefined,
            { query: "42", exportFilteredOnly: true },
        ))
        expect(parsed?.historyFilter).toEqual({ query: "42", exportFilteredOnly: true })
    })
})

describe("export filenames", () => {
    it("formats a stable local timestamp stamp", () => {
        expect(formatExportFilenameStamp(new Date(2026, 10, 4, 14, 5))).toBe("2026-11-04_1405")
    })

    it("builds dated history and session filenames", () => {
        const date = new Date(2026, 0, 2, 9, 30)
        expect(buildHistoryExportFilename("csv", date)).toBe("random-number-history_2026-01-02_0930.csv")
        expect(buildHistoryExportFilename("json", date)).toBe(
            "random-number-history_2026-01-02_0930.json",
        )
        expect(buildSessionExportFilename(date)).toBe("random-number-session_2026-01-02_0930.json")
    })
})
