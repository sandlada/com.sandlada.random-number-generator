<template>
    <ul class="shortcuts-list">
        <li>
            <kbd>G</kbd> — generate once (display card); blocked attempts (invalid range, No Repeat exhausted, fill
            in progress) show a brief banner
        </li>
        <li>
            <kbd>B</kbd> — batch generate (hero <strong>Batch</strong>; uses current batch size from Range); same
            blocked banner as <kbd>G</kbd>
        </li>
        <li><kbd>C</kbd> — copy current number (hero <strong>Copy</strong> button)</li>
        <li>
            <kbd>S</kbd> — share link (hero <strong>Share</strong>; Web Share API or copy URL to clipboard)
        </li>
        <li>
            <kbd>Shift+C</kbd> — copy all history (<strong>Copy All</strong>; honors
            <strong>Export only matching filter</strong>)
        </li>
        <li><kbd>Shift</kbd>+click history chip — copy that history value</li>
        <li>
            <kbd>M</kbd> or <strong>Manage</strong> (History header / <strong>More → History</strong>) — toggle manage
            mode: <strong>drag</strong> to reorder, <strong>×</strong> to remove (visible only in manage);
            <strong>Done</strong> or <kbd>M</kbd> again to exit. Clears filter when entering
        </li>
        <li>Arrow keys on focused chip — move focus between chips</li>
        <li>
            <kbd>Delete</kbd> / <kbd>Backspace</kbd> on focused chip (manage mode) — remove that entry
        </li>
        <li><kbd>Ctrl+Z</kbd> / <kbd>⌘Z</kbd> — undo last history entry</li>
        <li><kbd>Esc</kbd> — exit manage mode, or clear history filter</li>
        <li><kbd>/</kbd> — focus history filter</li>
        <li><kbd>?</kbd> — toggle shortcuts help</li>
        <li><kbd>Enter</kbd> — confirm non-destructive dialog; in Min/Max fields, generate once</li>
        <li class="shortcuts-note">
            Shortcuts are disabled while typing in fields or when a dialog is open.
        </li>
    </ul>
</template>

<style scoped>
.shortcuts-list {
    margin: 0 0 12px;
    padding-left: 18px;
    color: var(--app-text-secondary);
    font-size: 13px;
    line-height: 1.6;
}

.shortcuts-list kbd {
    font-family: var(--app-font-mono);
    font-size: 11px;
    padding: 1px 6px;
    border: 1px solid var(--app-border);
    border-radius: 3px;
    background: var(--app-bg-subtle);
}

.shortcuts-note {
    list-style: none;
    margin-left: -18px;
    padding-top: 6px;
    font-size: 12px;
    color: var(--app-text-tertiary, var(--app-text-secondary));
}
</style>
