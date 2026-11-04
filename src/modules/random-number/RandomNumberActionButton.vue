<!--
  Shared action button for the random-number UI (hero, history, import/backup, More nav).

  Variants: default (bordered surface), primary (accent fill), subtle (accent text + border),
  ghost (text-only accent), danger (outline destructive), destructive-solid (filled destructive).

  disabled — sets native disabled; clicks and hover do not run.
  notify-when-disabled — only with disabled; looks disabled but keeps native enabled so @click
  still fires (Generate Once / Batch + matching keyboard shortcuts can show the status banner).
  All other actions should use plain disabled, not notify-when-disabled.
-->
<template>
    <button
        type="button"
        class="action-button"
        :class="[variantClass, { 'action-button--visually-disabled': visuallyDisabled }]"
        :disabled="nativeDisabled"
        :aria-disabled="notifyWhenDisabled && disabled ? true : undefined"
        v-bind="$attrs"
    >
        <span class="action-button__content">
            <slot />
        </span>
    </button>
</template>

<script setup lang="ts">
import { computed } from "vue"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        disabled?: boolean
        /**
         * When true with `disabled`, the button looks disabled but does not set the
         * native `disabled` attribute, so `@click` still fires. Use only for
         * Generate Once / Batch so blocked attempts can show the status banner;
         * all other buttons should rely on normal `disabled` (no clicks).
         */
        notifyWhenDisabled?: boolean
        variant?: "primary" | "default" | "subtle" | "ghost" | "danger" | "destructive-solid"
    }>(),
    { variant: "default", notifyWhenDisabled: false },
)

const variantClass = computed(() => `action-button--${props.variant}`)
const visuallyDisabled = computed(() => Boolean(props.disabled))
/** Native `disabled` unless we intentionally allow click-through for banner feedback. */
const nativeDisabled = computed(
    () => props.disabled && !props.notifyWhenDisabled,
)
</script>

<style scoped>
.action-button {
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 32px;
    padding: 6px 14px;
    box-sizing: border-box;
    border-radius: var(--app-radius);
    border-width: 1px;
    border-style: solid;
    border-color: var(--app-border);
    background: var(--app-surface);
    color: var(--app-text);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    transition:
        background 120ms ease,
        border-color 120ms ease,
        color 120ms ease;
}

.action-button:disabled,
.action-button--visually-disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.action-button--default:hover:not(:disabled) {
    background: var(--app-bg-subtle);
    border-color: var(--app-border-strong);
}

.action-button--primary {
    border-color: var(--app-accent);
    background: var(--app-accent);
    color: var(--app-accent-foreground);
}

.action-button--primary:hover:not(:disabled) {
    background: var(--app-accent-hover);
    border-color: var(--app-accent-hover);
}

.action-button--subtle {
    border: 1px solid var(--app-border-strong);
    background: var(--app-surface);
    color: var(--app-accent);
    font-weight: 600;
}

.action-button--subtle:hover:not(:disabled),
.action-button--subtle:focus-visible:not(:disabled) {
    background: var(--app-subtle-hover-bg);
    border-color: var(--app-accent);
    color: var(--app-subtle-hover-fg);
}

.action-button--subtle:disabled {
    border: 1px solid var(--app-border);
}

.action-button--subtle:disabled:hover {
    background: var(--app-surface);
    border-color: var(--app-border);
    color: var(--app-accent);
}

.action-button--ghost {
    border: none;
    background: transparent;
    color: var(--app-accent);
    font-weight: 600;
}

.action-button--ghost:hover:not(:disabled),
.action-button--ghost:focus-visible:not(:disabled) {
    background: var(--app-subtle-hover-bg);
    border: none;
    color: var(--app-subtle-hover-fg);
}

.action-button--ghost:disabled {
    border: none;
    background: transparent;
}

.action-button--ghost:disabled:hover {
    background: transparent;
    color: var(--app-accent);
}

.action-button--danger {
    border-color: var(--app-danger);
    color: var(--app-danger);
    background: transparent;
}

.action-button--danger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--app-danger) 12%, transparent);
}

.action-button--destructive-solid {
    border-color: var(--app-danger);
    background: var(--app-danger);
    color: var(--app-danger-foreground);
}

.action-button--destructive-solid:hover:not(:disabled) {
    background: color-mix(in srgb, var(--app-danger) 88%, black);
    border-color: color-mix(in srgb, var(--app-danger) 88%, black);
}

.action-button__content {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.action-button:focus-visible {
    outline: 2px solid var(--app-accent);
    outline-offset: 2px;
}

@media (max-width: 639px) {
    .action-button {
        min-height: 44px;
        padding: 10px 16px;
    }
}
</style>
