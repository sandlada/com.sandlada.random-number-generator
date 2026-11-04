<template>
    <div
        ref="bannerEl"
        popover="manual"
        class="app-banner"
        role="status"
        aria-live="polite"
        aria-atomic="true"
    >
        {{ message }}
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue"

const props = defineProps<{
    message: string
    open: boolean
}>()

const bannerEl = ref<HTMLElement | null>(null)

const syncPopover = async () => {
    await nextTick()
    const el = bannerEl.value
    if (!el || !("showPopover" in el)) return

    if (props.open && props.message) {
        if (!el.matches(":popover-open")) {
            el.showPopover()
        }
    } else if (el.matches(":popover-open")) {
        el.hidePopover()
    }
}

watch(
    () => [props.open, props.message] as const,
    () => {
        void syncPopover()
    },
    { immediate: true },
)

onBeforeUnmount(() => {
    bannerEl.value?.hidePopover?.()
})
</script>

<style scoped>
.app-banner {
    position: fixed;
    left: max(16px, env(safe-area-inset-left, 0px));
    right: max(16px, env(safe-area-inset-right, 0px));
    bottom: max(20px, env(safe-area-inset-bottom, 0px));
    z-index: 1;
    box-sizing: border-box;
    width: fit-content;
    max-width: 480px;
    margin-inline: auto;
    padding: 12px 16px;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-lg);
    background: var(--app-surface-elevated);
    color: var(--app-text);
    font-family: var(--app-font);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    text-align: center;
}

@media (max-width: 480px) {
    .app-banner {
        max-width: 288px;
    }
}

.app-banner:empty {
    display: none;
}
</style>
