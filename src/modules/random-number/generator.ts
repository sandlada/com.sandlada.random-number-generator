import { nanoid } from "nanoid"
import { computed, ref, watch, type Ref, type UnwrapRef } from "vue"

const HISTORY_STORAGE_KEY = "sandlada.random-number.history"
const SETTINGS_STORAGE_KEY = "sandlada.random-number.settings"
const CUSTOM_PRESETS_STORAGE_KEY = "sandlada.random-number.custom-presets"
const UI_BACKUP_PANEL_OPEN_KEY = "sandlada.random-number.ui-backup-panel-open"
const UI_SHORTCUTS_PANEL_OPEN_KEY = "sandlada.random-number.ui-shortcuts-panel-open"
const DISPLAY_STORAGE_KEY = "sandlada.random-number.display"

export type RangePreset = {
    id: string
    label: string
    min: number
    max: number
    decimals: number
}

export const RANGE_PRESETS: RangePreset[] = [
    { id: "default", label: "0–100", min: 0, max: 100, decimals: 0 },
    { id: "dice", label: "Dice 1–6", min: 1, max: 6, decimals: 0 },
    { id: "coin", label: "Coin 0–1", min: 0, max: 1, decimals: 0 },
    { id: "lottery", label: "Lottery 1–49", min: 1, max: 49, decimals: 0 },
    { id: "percent", label: "Percent", min: 0, max: 100, decimals: 2 },
]

export type RandomNumberSettingsSnapshot = {
    min: number
    max: number
    decimals: number
    batchCount: number
    noRepeat: boolean
}

export type RandomNumberFlagged = {
    value: number
    id: string
}

export const MAX_HISTORY_LENGTH = 500

const trimHistoryLength = (items: RandomNumberFlagged[]): RandomNumberFlagged[] => {
    if (items.length <= MAX_HISTORY_LENGTH) return items
    return items.slice(-MAX_HISTORY_LENGTH)
}

/** Move one entry in chronological storage order (index 0 = oldest). */
export type HistoryMoveDirection = "newer" | "older"

export const moveHistoryEntry = (
    items: ReadonlyArray<RandomNumberFlagged>,
    id: string,
    direction: HistoryMoveDirection,
): RandomNumberFlagged[] => {
    const index = items.findIndex((entry) => entry.id === id)
    if (index < 0) return items.map((item) => ({ ...item }))
    const targetIndex = direction === "newer" ? index + 1 : index - 1
    if (targetIndex < 0 || targetIndex >= items.length) {
        return items.map((item) => ({ ...item }))
    }
    const next = items.map((item) => ({ ...item }))
    const current = next[index]!
    next[index] = next[targetIndex]!
    next[targetIndex] = current
    return next
}

/** Reorder history to match `orderedIds` (unknown ids ignored; extras appended in prior order). */
export const reorderHistory = (
    items: ReadonlyArray<RandomNumberFlagged>,
    orderedIds: ReadonlyArray<string>,
): RandomNumberFlagged[] => {
    const byId = new Map(items.map((item) => [item.id, item]))
    const seen = new Set<string>()
    const reordered: RandomNumberFlagged[] = []
    for (const id of orderedIds) {
        const entry = byId.get(id)
        if (!entry || seen.has(id)) continue
        seen.add(id)
        reordered.push({ ...entry })
    }
    for (const item of items) {
        if (seen.has(item.id)) continue
        reordered.push({ ...item })
    }
    return trimHistoryLength(reordered)
}

const loadJson = <T>(key: string): T | null => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

const saveJson = (key: string, value: unknown) => {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        /* quota or private mode */
    }
}

export const normalizeRange = (min: number, max: number): [number, number] => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return [0, 100]
    }
    if (min > max) {
        return [max, min]
    }
    return [min, max]
}

export const clampDecimals = (decimals: number): number => {
    if (!Number.isFinite(decimals)) return 0
    return Math.min(10, Math.max(0, Math.trunc(decimals)))
}

export const createRandomInRange = (
    min: number = 0,
    max: number = 100,
    decimals: number = 0,
): number => {
    const [lo, hi] = normalizeRange(min, max)
    const safeDecimals = clampDecimals(decimals)
    const factor = Math.pow(10, safeDecimals)
    const randomNumber = Math.random() * (hi - lo) + lo
    return Math.round(randomNumber * factor) / factor
}

export type UniqueRandomResult =
    | { ok: true; value: number }
    | { ok: false; reason: "pool_exhausted" }

export const createUniqueRandomInRange = (
    min: number,
    max: number,
    decimals: number,
    excluded: ReadonlySet<number>,
    maxAttempts: number = 256,
): UniqueRandomResult => {
    const poolSize = countValuesInRange(min, max, decimals)
    if (excluded.size >= poolSize) {
        return { ok: false, reason: "pool_exhausted" }
    }

    if (poolSize <= 512) {
        const available = enumerateValuesInRange(min, max, decimals).filter(
            (value) => !excluded.has(value),
        )
        if (!available.length) {
            return { ok: false, reason: "pool_exhausted" }
        }
        const index = Math.floor(Math.random() * available.length)
        return { ok: true, value: available[index]! }
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const value = createRandomInRange(min, max, decimals)
        if (!excluded.has(value)) {
            return { ok: true, value }
        }
    }
    return { ok: false, reason: "pool_exhausted" }
}

class RandomNumberGenerator {
    public readonly createRandomNumber = createRandomInRange
}

export const clampBatchCount = (count: number): number => {
    if (!Number.isFinite(count)) return 5
    return Math.min(20, Math.max(1, Math.trunc(count)))
}

/** Count of discrete values in [min, max] at the given decimal precision. */
export const countValuesInRange = (min: number, max: number, decimals: number): number => {
    const [lo, hi] = normalizeRange(min, max)
    const safeDecimals = clampDecimals(decimals)
    if (safeDecimals === 0) {
        return Math.max(0, Math.floor(hi - lo) + 1)
    }
    const factor = Math.pow(10, safeDecimals)
    return Math.max(0, Math.floor((hi - lo) * factor) + 1)
}

const MAX_ENUMERATED_POOL = 512

export const enumerateValuesInRange = (min: number, max: number, decimals: number): number[] => {
    const [lo, hi] = normalizeRange(min, max)
    const safeDecimals = clampDecimals(decimals)
    const pool = countValuesInRange(lo, hi, safeDecimals)
    if (pool > MAX_ENUMERATED_POOL) return []

    if (safeDecimals === 0) {
        const start = Math.ceil(lo)
        const end = Math.floor(hi)
        const values: number[] = []
        for (let value = start; value <= end; value++) {
            values.push(value)
        }
        return values
    }

    const factor = Math.pow(10, safeDecimals)
    const values: number[] = []
    for (let step = 0; step < pool; step++) {
        values.push(Math.round((lo * factor + step)) / factor)
    }
    return values
}

export type HistorySummary = {
    count: number
    min: number
    max: number
    median: number
    average: number
}

/** Median of numeric samples (even length uses mean of the two middle values). */
export const computeHistoryMedian = (values: ReadonlyArray<number>): number => {
    if (!values.length) return NaN
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1]! + sorted[mid]!) / 2
    }
    return sorted[mid]!
}

export const summarizeHistory = (
    items: ReadonlyArray<{ value: number }>,
): HistorySummary | null => {
    if (!items.length) return null
    const values = items.map((item) => item.value)
    let min = values[0]!
    let max = values[0]!
    let sum = 0
    for (const value of values) {
        min = Math.min(min, value)
        max = Math.max(max, value)
        sum += value
    }
    return {
        count: items.length,
        min,
        max,
        median: computeHistoryMedian(values),
        average: sum / items.length,
    }
}

export const formatHistorySummaryStats = (summary: HistorySummary, decimals: number): string => {
    const d = clampDecimals(decimals)
    return `min ${formatRandomNumber(summary.min, d)} · max ${formatRandomNumber(summary.max, d)} · med ${formatRandomNumber(summary.median, d)} · avg ${formatRandomNumber(summary.average, d)}`
}

export class RandomNumberSettings {
    public readonly min = ref(0)
    public readonly max = ref(100)
    public readonly decimals = ref(0)
    public readonly batchCount = ref(5)
    public readonly noRepeat = ref(false)

    constructor() {
        const stored = loadJson<Partial<RandomNumberSettingsSnapshot>>(SETTINGS_STORAGE_KEY)
        if (stored) {
            if (stored.min !== undefined) this.min.value = stored.min
            if (stored.max !== undefined) this.max.value = stored.max
            if (stored.decimals !== undefined) this.decimals.value = stored.decimals
            if (stored.batchCount !== undefined) this.batchCount.value = stored.batchCount
            if (stored.noRepeat !== undefined) this.noRepeat.value = stored.noRepeat
        }
        this.applyNormalization()

        watch(
            () => this.snapshot(),
            (snapshot) => saveJson(SETTINGS_STORAGE_KEY, snapshot),
            { deep: true },
        )
    }

    public applyNormalization = () => {
        const [lo, hi] = normalizeRange(this.min.value, this.max.value)
        this.min.value = lo
        this.max.value = hi
        this.decimals.value = clampDecimals(this.decimals.value)
        this.batchCount.value = clampBatchCount(this.batchCount.value)
    }

    public snapshot = (): RandomNumberSettingsSnapshot => ({
        min: this.min.value,
        max: this.max.value,
        decimals: this.decimals.value,
        batchCount: this.batchCount.value,
        noRepeat: this.noRepeat.value,
    })
}

export const applyRangePreset = (
    settings: RandomNumberSettings,
    preset: RangePreset,
): void => {
    settings.min.value = preset.min
    settings.max.value = preset.max
    settings.decimals.value = preset.decimals
    settings.applyNormalization()
}

export const swapRangeBounds = (settings: RandomNumberSettings): void => {
    const lo = settings.min.value
    settings.min.value = settings.max.value
    settings.max.value = lo
    settings.decimals.value = clampDecimals(settings.decimals.value)
    settings.batchCount.value = clampBatchCount(settings.batchCount.value)
}

class RandomNumberState {
    private readonly _currentNumber = ref<RandomNumberFlagged>({ id: "0", value: 0 })
    private readonly _lastNumber = ref<RandomNumberFlagged>({ id: "0", value: 0 })

    public readonly lastNumber = computed(() => this._lastNumber.value)
    public currentNumber = computed({
        get: () => this._currentNumber.value,
        set: (value: number) => {
            this._lastNumber.value.value = this._currentNumber.value.value
            this._lastNumber.value.id = this._currentNumber.value.id
            this._currentNumber.value.value = value
            this._currentNumber.value.id = nanoid()
        },
    })

    public constructor(defaultNumber: number = 0) {
        this.setCurrent(defaultNumber)
        watch(
            () => this._currentNumber.value.value,
            (value) => saveDisplayValue(value),
        )
    }

    public readonly setCurrent = (value: number) => {
        this._lastNumber.value = { ...this._currentNumber.value }
        this._currentNumber.value = { id: nanoid(), value }
    }

    /** Sets hero value and keeps the history entry id (for highlight / restore). */
    public readonly setCurrentFromEntry = (entry: RandomNumberFlagged) => {
        this._lastNumber.value = { ...this._currentNumber.value }
        this._currentNumber.value = { id: entry.id, value: entry.value }
    }
}

class RandomNumberHistory {
    private readonly _history = ref<Array<RandomNumberFlagged>>([])
    public readonly history = computed(() => this._history.value)

    public readonly add = (randomNumber: UnwrapRef<RandomNumberFlagged>) => {
        this._history.value = trimHistoryLength([
            ...this._history.value,
            { ...randomNumber },
        ])
    }

    public readonly removeById = (id: string) => {
        this._history.value = this._history.value.filter((e) => e.id !== id)
    }

    public readonly reset = () => {
        this._history.value = []
    }

    public readonly popLast = (): RandomNumberFlagged | undefined => {
        return this._history.value.pop()
    }

    public readonly addMany = (values: ReadonlyArray<number>) => {
        const appended = values.map((value) => ({ id: nanoid(), value }))
        this._history.value = trimHistoryLength([...this._history.value, ...appended])
    }

    public readonly replaceAll = (items: ReadonlyArray<RandomNumberFlagged>) => {
        this._history.value = trimHistoryLength(items.map((item) => ({ ...item })))
    }

    public readonly moveEntry = (id: string, direction: HistoryMoveDirection) => {
        this._history.value = moveHistoryEntry(this._history.value, id, direction)
    }

    public readonly reorder = (orderedIds: ReadonlyArray<string>) => {
        this._history.value = reorderHistory(this._history.value, orderedIds)
    }

    constructor() {
        const stored = loadJson<Array<RandomNumberFlagged>>(HISTORY_STORAGE_KEY)
        if (stored?.length) {
            this._history.value = trimHistoryLength(stored)
        }

        watch(
            this._history,
            (items) => saveJson(HISTORY_STORAGE_KEY, items),
            { deep: true },
        )
    }
}

class RandomNumberContext {
    private readonly generator = new RandomNumberGenerator()
    private readonly state = new RandomNumberState()
    private readonly history = new RandomNumberHistory()
    private readonly settings = new RandomNumberSettings()

    public createGenerator = () => this.generator
    public createState = () => this.state
    public createHistory = () => this.history
    public createSettings = () => this.settings
}

export const randomNumberContextSymbol = Symbol("__random-number-context")

export const randomNumberContext = new RandomNumberContext()

export type RandomNumber = typeof randomNumberContext

export const formatRandomNumber = (value: number, decimals: Ref<number> | number): string => {
    const d = typeof decimals === "number" ? clampDecimals(decimals) : clampDecimals(decimals.value)
    if (d === 0) {
        return String(Math.round(value))
    }
    return value.toFixed(d)
}

export const formatRangeDescription = (
    snapshot: Pick<RandomNumberSettingsSnapshot, "min" | "max" | "decimals">,
): string => {
    const decimals = snapshot.decimals
    const min = formatRandomNumber(snapshot.min, decimals)
    const max = formatRandomNumber(snapshot.max, decimals)
    const precision =
        decimals === 0 ? "integers" : `${decimals} decimal place${decimals === 1 ? "" : "s"}`
    return `${min}–${max} · ${precision}`
}

/** After reload, show the latest history value or the range minimum. */
export const resolveInitialDisplayValue = (
    history: ReadonlyArray<{ value: number }>,
    min: number,
): number => {
    if (history.length) return history[history.length - 1]!.value
    return min
}

export const loadPersistedDisplay = (): number | null => {
    const stored = loadJson<{ value: number }>(DISPLAY_STORAGE_KEY)
    if (!stored || !Number.isFinite(stored.value)) return null
    return stored.value
}

export const saveDisplayValue = (value: number): void => {
    if (!Number.isFinite(value)) return
    saveJson(DISPLAY_STORAGE_KEY, { value })
}

/** Prefer last persisted display when still valid for the current range. */
export const resolveStartupDisplayValue = (
    persisted: number | null,
    history: ReadonlyArray<{ value: number }>,
    min: number,
    max: number,
    decimals: number,
): number => {
    if (persisted !== null) {
        const normalized = normalizeImportedValue(persisted, min, max, decimals)
        if (normalized !== null) return normalized
    }
    return resolveInitialDisplayValue(history, min)
}

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        return false
    }
}

export const copyNumberToClipboard = async (value: number, decimals: number): Promise<boolean> => {
    return copyTextToClipboard(formatRandomNumber(value, decimals))
}

export const formatHistoryForCopy = (
    items: ReadonlyArray<{ value: number }>,
    decimals: number,
): string => items.map((item) => formatRandomNumber(item.value, decimals)).join("\n")

export const formatHistoryAsCsv = (
    items: ReadonlyArray<{ value: number }>,
    decimals: number,
): string => {
    const header = "index,value"
    const rows = items.map((item, index) =>
        `${index + 1},${formatRandomNumber(item.value, decimals)}`,
    )
    return [header, ...rows].join("\n")
}

export const HISTORY_JSON_EXPORT_VERSION = 1 as const

export type HistoryJsonExportSummary = {
    count: number
    min: number
    max: number
    median: number
    average: number
}

export type HistoryJsonExportV1 = {
    version: typeof HISTORY_JSON_EXPORT_VERSION
    exportedAt: string
    decimals: number
    values: number[]
    summary?: HistoryJsonExportSummary
    /** True when export used filter-only mode with an active query. */
    filtered?: boolean
    filterQuery?: string
}

export type HistoryJsonExportOptions = {
    filtered?: boolean
    filterQuery?: string
}

export const buildHistoryExportSummaryPayload = (
    items: ReadonlyArray<{ value: number }>,
): HistoryJsonExportSummary | undefined => {
    const stats = summarizeHistory(items)
    if (!stats) return undefined
    return {
        count: stats.count,
        min: stats.min,
        max: stats.max,
        median: stats.median,
        average: stats.average,
    }
}

export const buildHistoryJsonExport = (
    items: ReadonlyArray<{ value: number }>,
    decimals: number,
    options: HistoryJsonExportOptions = {},
): string => {
    const summary = buildHistoryExportSummaryPayload(items)
    const trimmedQuery = options.filterQuery?.trim() ?? ""
    const filtered = Boolean(options.filtered && trimmedQuery)
    const payload: HistoryJsonExportV1 = {
        version: HISTORY_JSON_EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        decimals: clampDecimals(decimals),
        values: items.map((item) => item.value),
        ...(summary ? { summary } : {}),
        ...(filtered ? { filtered: true, filterQuery: trimmedQuery } : {}),
    }
    return JSON.stringify(payload, null, 2)
}

/** Local timestamp for download filenames, e.g. `2026-11-04_1430`. */
export const formatExportFilenameStamp = (date: Date = new Date()): string => {
    const pad = (value: number) => String(value).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`
}

export const buildHistoryExportFilename = (
    kind: "csv" | "json",
    date: Date = new Date(),
): string => {
    return `random-number-history_${formatExportFilenameStamp(date)}.${kind === "csv" ? "csv" : "json"}`
}

export const buildSessionExportFilename = (date: Date = new Date()): string => {
    return `random-number-session_${formatExportFilenameStamp(date)}.json`
}

export const downloadHistoryCsvFile = (
    items: ReadonlyArray<{ value: number }>,
    decimals: number,
    filename?: string,
): void => {
    downloadTextFile(
        filename ?? buildHistoryExportFilename("csv"),
        formatHistoryAsCsv(items, decimals),
        "text/csv;charset=utf-8",
    )
}

export const downloadHistoryJsonFile = (
    items: ReadonlyArray<{ value: number }>,
    decimals: number,
    filename?: string,
    options: HistoryJsonExportOptions = {},
): void => {
    downloadTextFile(
        filename ?? buildHistoryExportFilename("json"),
        buildHistoryJsonExport(items, decimals, options),
        "application/json;charset=utf-8",
    )
}

export const parseHistoryJsonImport = (text: string): number[] => {
    try {
        const parsed = JSON.parse(text) as unknown
        if (Array.isArray(parsed)) {
            return parsed.filter((value): value is number => Number.isFinite(value))
        }
        if (
            parsed &&
            typeof parsed === "object" &&
            "values" in parsed &&
            Array.isArray((parsed as HistoryJsonExportV1).values)
        ) {
            return (parsed as HistoryJsonExportV1).values.filter((value): value is number =>
                Number.isFinite(value),
            )
        }
    } catch {
        /* fall through */
    }
    return []
}

export const parseHistoryFileContent = (text: string): number[] => {
    const trimmed = text.trim()
    if (!trimmed) return []
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        const fromJson = parseHistoryJsonImport(trimmed)
        if (fromJson.length) return fromJson
        try {
            JSON.parse(trimmed)
            return []
        } catch {
            /* fall through to line-based import */
        }
    }
    return parseHistoryImport(trimmed)
}

export const downloadTextFile = (filename: string, content: string, mime = "text/plain;charset=utf-8") => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}

export const remainingUniqueCount = (
    min: number,
    max: number,
    decimals: number,
    excluded: ReadonlySet<number>,
): number => {
    const pool = countValuesInRange(min, max, decimals)
    return Math.max(0, pool - excluded.size)
}

export const normalizeImportedValue = (
    value: number,
    min: number,
    max: number,
    decimals: number,
): number | null => {
    if (!Number.isFinite(value)) return null
    const [lo, hi] = normalizeRange(min, max)
    if (value < lo || value > hi) return null
    const factor = Math.pow(10, clampDecimals(decimals))
    return Math.round(value * factor) / factor
}

/** Clamp a display value into the active range at the given decimal precision. */
export const clampValueToRange = (
    value: number,
    min: number,
    max: number,
    decimals: number,
): number => {
    const [lo, hi] = normalizeRange(min, max)
    const safeDecimals = clampDecimals(decimals)
    const factor = Math.pow(10, safeDecimals)
    if (!Number.isFinite(value)) {
        return Math.round(lo * factor) / factor
    }
    const clamped = Math.min(hi, Math.max(lo, value))
    return Math.round(clamped * factor) / factor
}

export const parseHistoryImport = (text: string): number[] => {
    const values: number[] = []
    for (const line of text.trim().split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (/^index\s*,/i.test(trimmed)) continue
        const rawCell = trimmed.includes(",") ? trimmed.split(",")[1]?.trim() : trimmed
        if (!rawCell) continue
        const parsed = Number(rawCell)
        if (Number.isFinite(parsed)) values.push(parsed)
    }
    return values
}

export const importHistoryValues = (
    text: string,
    min: number,
    max: number,
    decimals: number,
): number[] => {
    return analyzeHistoryImport(text, min, max, decimals).values
}

export type HistoryImportAnalysis = {
    values: number[]
    /** Parsed numeric entries before range filter */
    parsedCount: number
    droppedOutOfRange: number
    failure: "empty" | "invalid_json" | "no_values_in_range" | null
}

export const analyzeHistoryImport = (
    text: string,
    min: number,
    max: number,
    decimals: number,
): HistoryImportAnalysis => {
    const trimmed = text.trim()
    if (!trimmed) {
        return { values: [], parsedCount: 0, droppedOutOfRange: 0, failure: "empty" }
    }

    const looksLikeJson = trimmed.startsWith("[") || trimmed.startsWith("{")
    if (looksLikeJson) {
        try {
            JSON.parse(trimmed)
        } catch {
            return { values: [], parsedCount: 0, droppedOutOfRange: 0, failure: "invalid_json" }
        }
    }

    const raw = parseHistoryFileContent(trimmed)
    const values = raw
        .map((value) => normalizeImportedValue(value, min, max, decimals))
        .filter((value): value is number => value !== null)
    const droppedOutOfRange = raw.length - values.length

    if (!values.length) {
        if (looksLikeJson && raw.length === 0) {
            return { values: [], parsedCount: 0, droppedOutOfRange: 0, failure: "empty" }
        }
        return {
            values: [],
            parsedCount: raw.length,
            droppedOutOfRange,
            failure: raw.length ? "no_values_in_range" : "empty",
        }
    }

    return { values, parsedCount: raw.length, droppedOutOfRange, failure: null }
}

/** How many imported values already appear in history (for append feedback). */
export const countImportValuesAlreadyInHistory = (
    values: ReadonlyArray<number>,
    history: ReadonlyArray<{ value: number }>,
): number => {
    if (!history.length || !values.length) return 0
    const existing = new Set(history.map((item) => item.value))
    let matches = 0
    for (const value of values) {
        if (existing.has(value)) matches++
    }
    return matches
}

export const createHistoryItemsFromValues = (
    values: ReadonlyArray<number>,
): RandomNumberFlagged[] => values.map((value) => ({ id: nanoid(), value }))

const parseBooleanParam = (value: string | null): boolean | undefined => {
    if (value === null) return undefined
    if (value === "1" || value.toLowerCase() === "true") return true
    if (value === "0" || value.toLowerCase() === "false") return false
    return undefined
}

export const parseSettingsFromSearch = (
    search: string,
): Partial<RandomNumberSettingsSnapshot> | null => {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`)
    const hasSettings =
        params.has("min") ||
        params.has("max") ||
        params.has("decimals") ||
        params.has("batch") ||
        params.has("norepeat")
    const hasDisplay = params.has("n")
    if (!hasSettings && !hasDisplay) return null

    const patch: Partial<RandomNumberSettingsSnapshot> = {}
    if (!hasSettings) return patch
    if (params.has("min")) patch.min = Number(params.get("min"))
    if (params.has("max")) patch.max = Number(params.get("max"))
    if (params.has("decimals")) patch.decimals = Number(params.get("decimals"))
    if (params.has("batch")) patch.batchCount = Number(params.get("batch"))
    const noRepeat = parseBooleanParam(params.get("norepeat"))
    if (noRepeat !== undefined) patch.noRepeat = noRepeat
    return patch
}

export const applySettingsPatch = (
    settings: RandomNumberSettings,
    patch: Partial<RandomNumberSettingsSnapshot>,
): void => {
    if (patch.min !== undefined) settings.min.value = patch.min
    if (patch.max !== undefined) settings.max.value = patch.max
    if (patch.decimals !== undefined) settings.decimals.value = patch.decimals
    if (patch.batchCount !== undefined) settings.batchCount.value = patch.batchCount
    if (patch.noRepeat !== undefined) settings.noRepeat.value = patch.noRepeat
    settings.applyNormalization()
}

export const parseDisplayValueFromSearch = (search: string): number | null => {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`)
    if (!params.has("n")) return null
    const parsed = Number(params.get("n"))
    return Number.isFinite(parsed) ? parsed : null
}

export const applySettingsFromSearch = (
    settings: RandomNumberSettings,
    search: string,
): boolean => {
    const patch = parseSettingsFromSearch(search)
    if (!patch) return false
    applySettingsPatch(settings, patch)
    return true
}

export const applyDisplayFromSearch = (
    settings: RandomNumberSettings,
    search: string,
    setDisplay: (value: number) => void,
): boolean => {
    const raw = parseDisplayValueFromSearch(search)
    if (raw === null) return false
    const normalized = normalizeImportedValue(
        raw,
        settings.min.value,
        settings.max.value,
        settings.decimals.value,
    )
    if (normalized === null) return false
    setDisplay(normalized)
    return true
}

export const resolveShareDisplayValue = (
    snapshot: RandomNumberSettingsSnapshot,
    displayValue: number | undefined,
): number | undefined => {
    if (displayValue === undefined || !Number.isFinite(displayValue)) return undefined
    const normalized = normalizeImportedValue(
        displayValue,
        snapshot.min,
        snapshot.max,
        snapshot.decimals,
    )
    return normalized ?? undefined
}

/** Status line after a multi-draw batch (batch size > 1). */
export const formatBatchGenerateStatus = (
    requested: number,
    generated: number,
    stoppedEarly: boolean,
): string => {
    if (!stoppedEarly) {
        return `Batch complete (${generated} of ${requested})`
    }
    if (generated === 0) {
        return `Batch stopped: no unique numbers left (0 of ${requested})`
    }
    return `Batch stopped after ${generated} of ${requested} — no unique numbers left`
}

export const buildSettingsShareUrl = (
    pageUrlWithoutQuery: string,
    snapshot: RandomNumberSettingsSnapshot,
    displayValue?: number,
): string => {
    const url = new URL(pageUrlWithoutQuery)
    url.searchParams.set("min", String(snapshot.min))
    url.searchParams.set("max", String(snapshot.max))
    url.searchParams.set("decimals", String(snapshot.decimals))
    url.searchParams.set("batch", String(snapshot.batchCount))
    url.searchParams.set("norepeat", snapshot.noRepeat ? "1" : "0")
    const shareDisplay = resolveShareDisplayValue(snapshot, displayValue)
    if (shareDisplay !== undefined) {
        url.searchParams.set("n", formatRandomNumber(shareDisplay, snapshot.decimals))
    }
    return url.toString()
}

export const replaceBrowserUrlWithSettings = (
    snapshot: RandomNumberSettingsSnapshot,
    displayValue?: number,
): void => {
    if (typeof window === "undefined") return
    const base = `${window.location.origin}${window.location.pathname}`
    const next = buildSettingsShareUrl(
        base,
        snapshot,
        resolveShareDisplayValue(snapshot, displayValue),
    )
    window.history.replaceState(window.history.state, "", next)
}

type PendingUrlReplace = {
    snapshot: RandomNumberSettingsSnapshot
    displayValue?: number
}

let replaceUrlTimer: ReturnType<typeof setTimeout> | null = null
let pendingUrlReplace: PendingUrlReplace | null = null

/** Coalesce rapid settings/display updates into one replaceState call. */
export const scheduleReplaceBrowserUrlWithSettings = (
    snapshot: RandomNumberSettingsSnapshot,
    displayValue?: number,
    debounceMs = 180,
): void => {
    pendingUrlReplace = { snapshot, displayValue }
    if (replaceUrlTimer !== null) clearTimeout(replaceUrlTimer)
    replaceUrlTimer = setTimeout(() => {
        replaceUrlTimer = null
        if (!pendingUrlReplace) return
        const pending = pendingUrlReplace
        pendingUrlReplace = null
        replaceBrowserUrlWithSettings(pending.snapshot, pending.displayValue)
    }, debounceMs)
}

export const flushScheduledReplaceBrowserUrl = (): void => {
    if (replaceUrlTimer !== null) {
        clearTimeout(replaceUrlTimer)
        replaceUrlTimer = null
    }
    if (!pendingUrlReplace) return
    const pending = pendingUrlReplace
    pendingUrlReplace = null
    replaceBrowserUrlWithSettings(pending.snapshot, pending.displayValue)
}

export const filterHistoryValuesByQuery = <T extends { value: number }>(
    items: ReadonlyArray<T>,
    query: string,
    decimals: number,
): T[] => {
    const trimmed = query.trim()
    if (!trimmed) return [...items]
    return items.filter((item) =>
        formatRandomNumber(item.value, decimals).includes(trimmed),
    )
}

export const loadCustomPresets = (): RangePreset[] => {
    return loadJson<RangePreset[]>(CUSTOM_PRESETS_STORAGE_KEY) ?? []
}

export const saveCustomPresets = (presets: ReadonlyArray<RangePreset>): void => {
    saveJson(CUSTOM_PRESETS_STORAGE_KEY, presets)
}

export const createCustomPreset = (
    label: string,
    snapshot: Pick<RandomNumberSettingsSnapshot, "min" | "max" | "decimals">,
    existing: ReadonlyArray<RangePreset> = [],
): RangePreset => {
    const base = label.trim() || "Custom"
    let candidate = base
    let suffix = 2
    while (existing.some((item) => item.label === candidate)) {
        candidate = `${base} (${suffix})`
        suffix++
    }
    return {
        id: `custom-${nanoid(8)}`,
        label: candidate,
        min: snapshot.min,
        max: snapshot.max,
        decimals: snapshot.decimals,
    }
}

export const MAX_CUSTOM_PRESETS = 12

export const isRangeSettingsInvalid = (min: number, max: number): boolean =>
    !Number.isFinite(min) || !Number.isFinite(max)

export type GenerateBlockedInput = {
    isFillingUnique: boolean
    uniquePoolExhausted: boolean
    rangeInvalid?: boolean
}

/** Same guard as Generate Once / Batch / Fill Unique Range disabled state. */
export const isGenerateDisabled = (input: GenerateBlockedInput): boolean =>
    Boolean(input.isFillingUnique || input.uniquePoolExhausted || input.rangeInvalid)

/** Banner text when Generate is ignored (disabled or same guard path as G). */
export const formatGenerateBlockedStatus = (input: GenerateBlockedInput): string | null => {
    if (input.rangeInvalid) {
        return "Fix min and max — enter valid numbers to generate"
    }
    if (input.isFillingUnique) {
        return "Fill in progress — wait until it finishes"
    }
    if (input.uniquePoolExhausted) {
        return "No unique numbers left in this range. Turn off No Repeat or clear history to continue."
    }
    return null
}

/** Batch ×N uses the same blocked messages as single Generate. */
export const formatBatchGenerateBlockedStatus = (input: GenerateBlockedInput): string | null =>
    formatGenerateBlockedStatus(input)

export const formatCustomPresetCapacity = (
    count: number,
    maxCount: number = MAX_CUSTOM_PRESETS,
): string => `${count} / ${maxCount} saved`

export const addCustomPreset = (
    presets: RangePreset[],
    preset: RangePreset,
    maxCount: number = MAX_CUSTOM_PRESETS,
): RangePreset[] => {
    const next = [...presets.filter((item) => item.id !== preset.id), preset]
    if (next.length > maxCount) {
        next.splice(0, next.length - maxCount)
    }
    saveCustomPresets(next)
    return next
}

export const removeCustomPreset = (presets: RangePreset[], id: string): RangePreset[] => {
    const next = presets.filter((item) => item.id !== id)
    saveCustomPresets(next)
    return next
}

export type RenameCustomPresetResult = {
    presets: RangePreset[]
    /** Final label after deduplication, or `null` if rename was ignored. */
    appliedLabel: string | null
}

export const renameCustomPreset = (
    presets: RangePreset[],
    id: string,
    label: string,
): RenameCustomPresetResult => {
    const target = presets.find((item) => item.id === id)
    if (!target) return { presets, appliedLabel: null }
    const trimmed = label.trim()
    if (!trimmed) return { presets, appliedLabel: null }
    const others = presets.filter((item) => item.id !== id)
    const { label: nextLabel } = createCustomPreset(trimmed, target, others)
    const next = presets.map((item) =>
        item.id === id ? { ...item, label: nextLabel } : item,
    )
    saveCustomPresets(next)
    return { presets: next, appliedLabel: nextLabel }
}

export const duplicateCustomPreset = (presets: RangePreset[], id: string): RangePreset[] => {
    const target = presets.find((item) => item.id === id)
    if (!target) return presets
    const preset = createCustomPreset(`${target.label} copy`, target, presets)
    return addCustomPreset(presets, preset)
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed"

export const shareText = async (payload: {
    title?: string
    text: string
    url?: string
}): Promise<ShareResult> => {
    if (typeof navigator.share === "function") {
        try {
            await navigator.share(payload)
            return "shared"
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return "cancelled"
            }
        }
    }
    const combined = payload.url ? `${payload.text}\n${payload.url}` : payload.text
    return (await copyTextToClipboard(combined)) ? "copied" : "failed"
}

export const shareCurrentNumber = async (
    value: number,
    decimals: number,
    pageUrl?: string,
): Promise<ShareResult> => {
    const text = formatRandomNumber(value, decimals)
    return shareText({
        title: "Random number",
        text: `Random number: ${text}`,
        url: pageUrl,
    })
}

export const SESSION_EXPORT_VERSION = 1 as const

export type PersistedHistoryFilter = {
    query: string
    exportFilteredOnly: boolean
}

export type SessionExportV1 = {
    version: typeof SESSION_EXPORT_VERSION
    exportedAt: string
    settings: RandomNumberSettingsSnapshot
    history: RandomNumberFlagged[]
    customPresets: RangePreset[]
    /** Shown number when the session was exported (optional for older files). */
    displayValue?: number
    /** History filter UI from export time (optional). */
    historyFilter?: PersistedHistoryFilter
    /** Aggregate stats for `history` (optional; ignored on import). */
    historySummary?: HistoryJsonExportSummary
}

export const buildSessionExport = (
    settings: RandomNumberSettingsSnapshot,
    history: ReadonlyArray<RandomNumberFlagged>,
    customPresets: ReadonlyArray<RangePreset>,
    displayValue?: number,
    historyFilter?: PersistedHistoryFilter,
): SessionExportV1 => {
    const payload: SessionExportV1 = {
        version: SESSION_EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        settings,
        history: [...history],
        customPresets: [...customPresets],
    }
    if (displayValue !== undefined && Number.isFinite(displayValue)) {
        payload.displayValue = displayValue
    }
    if (historyFilter && (historyFilter.query.trim() || historyFilter.exportFilteredOnly)) {
        payload.historyFilter = {
            query: historyFilter.query,
            exportFilteredOnly: historyFilter.exportFilteredOnly,
        }
    }
    const historySummary = buildHistoryExportSummaryPayload(history)
    if (historySummary) {
        payload.historySummary = historySummary
    }
    return payload
}

export const serializeSessionExport = (
    settings: RandomNumberSettingsSnapshot,
    history: ReadonlyArray<RandomNumberFlagged>,
    customPresets: ReadonlyArray<RangePreset>,
    displayValue?: number,
    historyFilter?: PersistedHistoryFilter,
): string =>
    JSON.stringify(
        buildSessionExport(settings, history, customPresets, displayValue, historyFilter),
        null,
        2,
    )

export const resolveSessionDisplayValue = (session: SessionExportV1): number | null => {
    if (session.displayValue === undefined || !Number.isFinite(session.displayValue)) {
        return null
    }
    const { min, max, decimals } = session.settings
    return normalizeImportedValue(session.displayValue, min, max, decimals)
}

export const parseSessionImport = (text: string): SessionExportV1 | null => {
    try {
        const parsed = JSON.parse(text) as Partial<SessionExportV1>
        if (parsed.version !== SESSION_EXPORT_VERSION) return null
        if (!parsed.settings || !Array.isArray(parsed.history)) return null
        if (!Array.isArray(parsed.customPresets)) return null
        return normalizeSessionImport(parsed as SessionExportV1)
    } catch {
        return null
    }
}

export const normalizeSessionImport = (session: SessionExportV1): SessionExportV1 => {
    const settings: RandomNumberSettingsSnapshot = {
        ...DEFAULT_SETTINGS_SNAPSHOT(),
        ...session.settings,
    }
    const [min, max] = normalizeRange(settings.min, settings.max)
    settings.min = min
    settings.max = max
    settings.decimals = clampDecimals(settings.decimals)
    settings.batchCount = clampBatchCount(settings.batchCount)
    settings.noRepeat = Boolean(settings.noRepeat)

    const history = session.history
        .filter(
            (item) =>
                item &&
                typeof item.id === "string" &&
                Number.isFinite(item.value),
        )
        .map((item) => ({ id: item.id, value: item.value }))

    const customPresets = session.customPresets
        .filter(
            (preset) =>
                preset &&
                typeof preset.id === "string" &&
                typeof preset.label === "string" &&
                Number.isFinite(preset.min) &&
                Number.isFinite(preset.max),
        )
        .map((preset) => ({
            id: preset.id,
            label: preset.label.trim() || "Custom",
            min: preset.min,
            max: preset.max,
            decimals: clampDecimals(preset.decimals),
        }))

    let displayValue: number | undefined
    if (session.displayValue !== undefined && Number.isFinite(session.displayValue)) {
        const normalized = normalizeImportedValue(
            session.displayValue,
            settings.min,
            settings.max,
            settings.decimals,
        )
        if (normalized !== null) displayValue = normalized
    }

    let historyFilter: PersistedHistoryFilter | undefined
    if (session.historyFilter && typeof session.historyFilter === "object") {
        const q =
            typeof session.historyFilter.query === "string" ? session.historyFilter.query : ""
        historyFilter = {
            query: q,
            exportFilteredOnly: Boolean(session.historyFilter.exportFilteredOnly),
        }
    }

    return {
        version: SESSION_EXPORT_VERSION,
        exportedAt: session.exportedAt ?? new Date().toISOString(),
        settings,
        history: trimHistoryLength(history),
        customPresets,
        ...(displayValue !== undefined ? { displayValue } : {}),
        ...(historyFilter ? { historyFilter } : {}),
    }
}

export const DEFAULT_SETTINGS_SNAPSHOT = (): RandomNumberSettingsSnapshot => ({
    min: 0,
    max: 100,
    decimals: 0,
    batchCount: 5,
    noRepeat: false,
})

export const clearAllPersistedData = (): void => {
    try {
        localStorage.removeItem(HISTORY_STORAGE_KEY)
        localStorage.removeItem(SETTINGS_STORAGE_KEY)
        localStorage.removeItem(CUSTOM_PRESETS_STORAGE_KEY)
        localStorage.removeItem(UI_BACKUP_PANEL_OPEN_KEY)
        localStorage.removeItem(UI_SHORTCUTS_PANEL_OPEN_KEY)
        localStorage.removeItem(DISPLAY_STORAGE_KEY)
    } catch {
        /* private mode */
    }
}

export const loadBackupPanelOpen = (): boolean => {
    return loadJson<boolean>(UI_BACKUP_PANEL_OPEN_KEY) ?? false
}

export const saveBackupPanelOpen = (open: boolean): void => {
    saveJson(UI_BACKUP_PANEL_OPEN_KEY, open)
}

export const loadShortcutsPanelOpen = (): boolean => {
    return loadJson<boolean>(UI_SHORTCUTS_PANEL_OPEN_KEY) ?? false
}

export const saveShortcutsPanelOpen = (open: boolean): void => {
    saveJson(UI_SHORTCUTS_PANEL_OPEN_KEY, open)
}

const UI_HISTORY_FILTER_SESSION_KEY = "sandlada.random-number.session-history-filter"

const loadSessionJson = <T>(key: string): T | null => {
    try {
        const raw = sessionStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

const saveSessionJson = (key: string, value: unknown): void => {
    try {
        sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
        /* ignore quota / private mode */
    }
}

export const loadHistoryFilterSession = (): PersistedHistoryFilter => {
    const stored = loadSessionJson<PersistedHistoryFilter>(UI_HISTORY_FILTER_SESSION_KEY)
    if (!stored) return { query: "", exportFilteredOnly: false }
    return {
        query: typeof stored.query === "string" ? stored.query : "",
        exportFilteredOnly: Boolean(stored.exportFilteredOnly),
    }
}

export const saveHistoryFilterSession = (state: PersistedHistoryFilter): void => {
    saveSessionJson(UI_HISTORY_FILTER_SESSION_KEY, {
        query: state.query,
        exportFilteredOnly: state.exportFilteredOnly,
    })
}

export type HistoryExportStatusInput = {
    exportFilteredOnly: boolean
    query: string
    exportedCount: number
    totalCount: number
}

export type HistoryImportSuccessInput = {
    mode: "append" | "replace"
    importedCount: number
    droppedOutOfRange: number
    duplicateInHistoryCount: number
    historyLength: number
    maxHistoryLength: number
    hadFilterQuery: boolean
    hadExportFilteredOnly: boolean
}

/** Success toast after history import (append/replace). */
export const formatHistoryImportSuccessMessage = ({
    mode,
    importedCount,
    droppedOutOfRange,
    duplicateInHistoryCount,
    historyLength,
    maxHistoryLength,
    hadFilterQuery,
    hadExportFilteredOnly,
}: HistoryImportSuccessInput): string => {
    let message =
        mode === "replace"
            ? `Replaced history with ${importedCount} value${importedCount === 1 ? "" : "s"}`
            : `Imported ${importedCount} value${importedCount === 1 ? "" : "s"}`
    if (mode === "append" && duplicateInHistoryCount > 0) {
        message += ` (${duplicateInHistoryCount} already in history)`
    }
    if (droppedOutOfRange > 0) {
        message += ` · ${droppedOutOfRange} skipped (out of range)`
    }
    if (historyLength >= maxHistoryLength && importedCount > 0) {
        message += ` · history capped at ${maxHistoryLength}`
    }
    if (hadFilterQuery) {
        message += " · filter cleared"
    }
    if (hadExportFilteredOnly) {
        message += " · history exports may use filter-only until you change it"
    }
    return message
}

/** Suffix for history export/copy success toasts when filter-only export is active. */
export const formatHistoryExportStatusSuffix = ({
    exportFilteredOnly,
    query,
    exportedCount,
    totalCount,
}: HistoryExportStatusInput): string => {
    const trimmed = query.trim()
    if (!exportFilteredOnly || !trimmed) return ""
    if (exportedCount === 0) return " — filter matched none"
    const quoted = `“${trimmed}”`
    if (exportedCount === totalCount) {
        return ` — ${exportedCount} matching ${quoted}`
    }
    return ` — ${exportedCount} of ${totalCount} matching ${quoted}`
}

/** History export/copy/download success toast (pairs with import messaging). */
export const formatHistoryExportSuccessMessage = (
    base: string,
    input: HistoryExportStatusInput,
): string => {
    const filteredSuffix = formatHistoryExportStatusSuffix(input)
    if (filteredSuffix) return `${base}${filteredSuffix}`
    const trimmed = input.query.trim()
    if (trimmed && !input.exportFilteredOnly && input.totalCount > 0) {
        return `${base} · full history (${input.totalCount} entries, filter “${trimmed}” not applied to export)`
    }
    if (input.exportFilteredOnly && !trimmed) {
        return `${base} · full history (no filter query — filter-only export unused)`
    }
    return base
}

export type SessionExportSuccessInput = {
    historyCount: number
    hadFilterQuery: boolean
    filterQuery: string
    hadExportFilteredOnly: boolean
    hasSummary: boolean
}

export const formatSessionExportSuccessMessage = ({
    historyCount,
    hadFilterQuery,
    filterQuery,
    hadExportFilteredOnly,
    hasSummary,
}: SessionExportSuccessInput): string => {
    let message = `Session exported · ${historyCount} histor${historyCount === 1 ? "y entry" : "y entries"}`
    if (hasSummary && historyCount > 0) {
        message += " · summary included"
    }
    if (hadFilterQuery) {
        message += ` · filter “${filterQuery.trim()}” saved in file`
    }
    if (hadExportFilteredOnly) {
        message += " · history exports may use filter-only until you change it"
    }
    return message
}

export type SessionImportSuccessInput = {
    historyCount: number
    hasSummary: boolean
    restoredFilterQuery: boolean
    filterQuery: string
    hadExportFilteredOnly: boolean
}

/** Success toast after session import replaces local state. */
export const formatSessionImportSuccessMessage = ({
    historyCount,
    hasSummary,
    restoredFilterQuery,
    filterQuery,
    hadExportFilteredOnly,
}: SessionImportSuccessInput): string => {
    let message = `Session restored · ${historyCount} histor${historyCount === 1 ? "y entry" : "y entries"}`
    if (hasSummary && historyCount > 0) {
        message += " · summary was in file"
    }
    if (restoredFilterQuery) {
        message += ` · filter “${filterQuery.trim()}” restored`
    }
    if (hadExportFilteredOnly) {
        message += " · history exports may use filter-only until you change it"
    }
    return message
}

/** Prefer snapshot id when still present in restored history; else latest matching value. */
export const resolveRestoredCurrentEntry = (
    preferred: RandomNumberFlagged,
    history: ReadonlyArray<RandomNumberFlagged>,
): RandomNumberFlagged => {
    const exact = history.find((item) => item.id === preferred.id && item.value === preferred.value)
    if (exact) return { ...exact }
    for (let i = history.length - 1; i >= 0; i--) {
        const item = history[i]!
        if (item.value === preferred.value) return { ...item }
    }
    return { ...preferred }
}
