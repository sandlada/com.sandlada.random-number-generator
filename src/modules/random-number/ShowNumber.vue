<template>
    <div class="show-number" aria-live="polite" aria-atomic="true">
        <span class="label">{{ formatted }}</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { formatRandomNumber } from "./generator"

const props = defineProps<{
    number: number
    decimals?: number
}>()

const formatted = computed(() =>
    formatRandomNumber(props.number, props.decimals ?? 0),
)
</script>

<style scoped>
.show-number {
    display: block;
    box-sizing: border-box;
    font-family: var(--app-font-mono);
    font-weight: 600;
    font-variant-numeric: tabular-nums;

    --_show-number-color: var(--show-number-color, var(--app-text));
    --_show-number-size: var(--show-number-size, 48px);

    color: var(--_show-number-color);
    font-size: var(--_show-number-size);
    line-height: 1.1;
}
</style>
