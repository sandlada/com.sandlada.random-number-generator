import { createApp } from 'vue'

import App from './App.vue'

import { randomNumberContext, randomNumberContextSymbol } from './modules/random-number/generator'
import "./styles/tailwind.css"

const app = createApp(App)

app.provide(randomNumberContextSymbol, randomNumberContext)
app.mount('#app')
