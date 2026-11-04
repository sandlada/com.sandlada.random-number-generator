<template>
    <div class="app-shell">
        <Header />
        <main class="app-main">
            <RandomNumberRoot />
        </main>
    </div>
</template>

<script setup lang="ts">
import Header from "./modules/products/Header.vue"
import RandomNumberRoot from "./modules/random-number/RandomNumberRoot.vue"
</script>

<style scoped>
.app-shell {
    min-height: 100dvh;
}

.app-main {
    display: block;
}
</style>
