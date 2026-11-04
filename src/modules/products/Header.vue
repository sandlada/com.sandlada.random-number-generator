<template>
    <header class="product-header">
        <h1 class="label">Random Number Generator</h1>
        <ColorSchemeIconButton />
    </header>
</template>

<script setup lang="ts">
import ColorSchemeIconButton from "@/universal-components/ColorSchemeIconButton.vue"
</script>

<style scoped>
.product-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    height: auto;
    padding-top: env(safe-area-inset-top, 0px);
    padding-inline: max(20px, env(safe-area-inset-left, 0px))
        max(20px, env(safe-area-inset-right, 0px));
    padding-bottom: 0;
    min-width: 0;
    box-sizing: border-box;
    max-width: 1280px;
    margin: 0 auto;
}

@media (max-width: 959px) {
    .product-header {
        padding-inline: max(16px, env(safe-area-inset-left, 0px))
            max(16px, env(safe-area-inset-right, 0px));
    }
}

@media (max-width: 480px) {
    .product-header {
        padding-inline: max(12px, env(safe-area-inset-left, 0px))
            max(12px, env(safe-area-inset-right, 0px));
    }
}

.label {
    margin: 0;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 18px;
    font-weight: 600;
    color: var(--app-text);
    line-height: 1.25;
}

@media (max-width: 480px) {
    .label {
        font-size: 16px;
    }
}
</style>
