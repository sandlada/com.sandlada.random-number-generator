# com.sandlada.random-number-generator

Vue 3 + Vite app for generating random numbers in a configurable range, with history, presets, and backup.

## UI layout

- **Responsive breakpoint** — **narrow** at viewport width **≤959px** (`max-width: 959px`); **wide** from **960px** up (`min-width: 960px`). CSS and `matchMedia` use the same split
- **Wide (≥960px)** — main column **hero → History**; **sidebar** shows Range, presets, and import/backup. **No** **More** row or hero range shortcut — range lives in the sidebar only
- **Narrow (≤959px)** — single column **hero → History → More row**; sidebar Range card hidden. A left-aligned ghost **More** button sits **below the History card** (not in the History header) and opens one dialog with four sections (**Range & Presets**, **Import & Backup**, **Shortcuts**, **History**). With **no history yet**, **More** opens on **Range & Presets**; once there is history, **More** opens on **History**. Empty history shows **No history yet.** only (generate from the hero). Dialog title follows the active section; **Done** or **Esc** closes; **Enter** in Min/Max generates once and closes. **`?`** opens or toggles shortcuts in that dialog (or switches to it if **More** is open elsewhere)
- **Page column** — content capped at **1280px** wide, centered; **wide (≥960px)** uses **20px** horizontal inset on workspace and header (safe-area aware, no extra wide-screen padding tier); **narrow (≤959px)** uses **16px** on workspace and header (**12px** at ≤480px)
- **Header → content** — **0px** gap: the app header sits flush with the first card (`workspace` has no top padding)
- **Spacing between cards** — **12px** everywhere (`--card-gap`: display card ↔ History, History ↔ **More** row on narrow, main column ↔ sidebar on wide, sidebar stack vs import/backup). Narrow layout hides the sidebar column entirely (range/backup/shortcuts live in **More**)
- **Padding rhythm** — **20px** inside header and cards at desktop (display card included — uniform **20px**, not extra bottom padding); workspace inline **20px** at ≥960px; cards **16px** at ≤639px; cards **12px** at ≤480px; header and workspace inline **16px / 12px** at the same narrow tiers. Workspace bottom padding **20px** (safe-area aware)
- **Display card (hero)** — large number only (no section label); **click the number** or **Copy** / **Share** as **ghost** actions (no border; hover: `#ebf2ff` fill) in the top-right; **Generate**, batch, and fill actions below a divider — **bordered** buttons like Batch ×N
- **History** — directly below the display card on wide; on narrow, **More** sits below History; **Manage** (ghost, after Clear History) toggles reorder/remove: **drag** chips to reorder (persisted), **×** to remove (**×** only while managing — normal mode: click chip to show, Shift+click to copy); click **Done** to exit. **Manage** appears only when there is history; reorder/remove toasts; current hero chip stays highlighted while managing. Active **filter** is **cleared** when entering Manage (full list for reordering); typing a filter while managing exits manage mode. Works with **No repeat** on. **Copy All** (ghost; one formatted value per line, same set as import/export when **Export only matching filter** is on), **Undo Last** / **Clear History** / **Restore Cleared** are **ghost** actions (no border at rest; hover `#ebf2ff`) on wide; on **narrow**, **Copy All** and those actions plus stats summary move into the **More** dialog — History card header is **History** only (filter stays on the card)
- **Theme** — native header toggle (no `@material/web`); styling via `@sandlada/material-design-css` and app tokens

## Components

- **`RandomNumberActionButton`** (`src/modules/random-number/RandomNumberActionButton.vue`) — default choice for module actions (Generate, ghost header/history actions, import/backup, More nav, confirm/prompt `<dialog>` footers). Variants: `default`, `primary`, `subtle`, `ghost`, `danger`, `destructive-solid`. Use normal **`disabled`** so blocked clicks do nothing; use **`notify-when-disabled`** only on Generate Once / Batch so blocked attempts still run the handler and show the banner toast. Intentionally **not** used for theme toggle, preset chips, link-style controls, or history manage **×** remove. **More** panel **Done** uses `ghost` via `AppPanelDialog`.

## Features

- Configurable **min / max / decimals**, **Swap min ↔ max**, built-in and **custom presets** (save, rename with duplicate-name suffix, duplicate, remove; label shows **N / 12 saved**); **Reset To Defaults** on range asks for confirmation
- **Generate**, **batch generate**, **No Repeat** unique draws, **Fill Unique Range** (progress banner every 25 adds; completion toast replaces the sticky progress message); every click or `G` generates once immediately; **Batch** or `B` runs the current batch size (still blocked while fill runs, when No Repeat pool is exhausted, or when the range is invalid/disabled)
- **History** with filter (persists for the browser tab; included in **session export** when set), stats (**min / max / median / avg** for visible rows, including when filtered), **Copy All** in the History header (wide) or **More → History** (narrow): plain text, one number per line, honoring **Export only matching filter** like CSV/JSON; success banner **History copied** (with filter suffix when applicable), **Manage** mode to drag-reorder the full list (persisted) and remove chips with **×** — entering Manage clears an active filter; manage mode exits if you apply a filter while managing, undo last / **Restore Cleared** (restores hero + highlight), click a chip to show in hero (**Shift+click** to copy; **arrow keys** move focus between chips), empty state is **No history yet.** (use hero **Generate Once**); CSV/JSON import with clearer errors, duplicate hints on append, and toast notes when a filter or filter-only export was cleared
- **Session JSON** backup/restore (includes displayed number and optional history filter); import success toast notes entry count, summary, and restored filter
- **Share link** via URL query (`?n=` for current value); copying the share URL shows **Share link copied to clipboard**
- **Status feedback** via a bottom **banner toast** (top layer); confirm/prompt dialogs use native `<dialog>`. **Generate Once**, **Batch**, and **Fill Unique Range** use **`notify-when-disabled`** so blocked clicks still show the banner (keyboard shortcuts match); **Copy All** / **Clear History** and most other actions use true **disabled** (no click)
- **Downloads** use dated filenames (`random-number-history_YYYY-MM-DD_HHmm.csv` / `.json`, session export similarly); history and **session** JSON exports include a **summary** block (count, min, max, median, average). Filter-only history JSON exports set **`filtered: true`** and **`filterQuery`** when applicable
- Keyboard shortcuts (`G`, `B` batch, `C`, `S` share link, `Shift+C` copy all, `M` manage history, `Ctrl+Z`, `Esc` manage/filter, `/` focus filter, `?` help, **Enter** to confirm non-destructive dialogs), dark/light theme; display value persists across reload

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `G` | Generate once (display card); blocked attempts (invalid range, No Repeat exhausted, fill in progress) show a brief banner |
| `B` | Batch generate (hero **Batch**; uses current batch size from Range); same blocked banner as `G` |
| `C` | Copy current number (hero **Copy** button) |
| `S` | Share link (hero **Share**; Web Share API or copy URL to clipboard) |
| `Shift+C` | Copy all history (**Copy All**; honors **Export only matching filter**) |
| `Shift`+click history chip | Copy that history value |
| `M` or **Manage** (History header / **More → History**) | Toggle manage mode: **drag** to reorder, **×** to remove (visible only in manage); **Done** or `M` again to exit. Clears filter when entering |
| Arrow keys on focused chip | Move focus between chips |
| `Delete` / `Backspace` on focused chip (manage mode) | Remove that entry |
| `Ctrl+Z` / `⌘Z` | Undo last history entry |
| `Esc` | Exit manage mode, or clear history filter |
| `/` | Focus history filter |
| `?` | Toggle shortcuts help |
| `Enter` | Confirm non-destructive dialog; in Min/Max fields, generate once |

Shortcuts are disabled while typing in fields or when a dialog is open.

## Setup

```sh
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Typecheck + production build |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm preview` | Preview production build |

CI runs `pnpm test` and `pnpm build` on push/PR (see `.github/workflows/ci.yml`).

**pnpm 12:** `pnpm-workspace.yaml` `allowBuilds` allows install scripts for `esbuild` (Vite) and `workerd` / `wrangler` (Cloudflare Pages), avoiding `ERR_PNPM_IGNORED_BUILDS`.

## SEO & production URL

Production site: **https://random-number-generator.sandlada.com/**

Static assets in `public/`:

| File | Purpose |
| --- | --- |
| `favicon.svg` | Primary site icon (SVG dice mark) |
| `favicon.ico` | Legacy fallback icon |
| `og-cover.svg` | Open Graph / social preview (1200×630) |
| `site.webmanifest` | PWA-style name, theme color, icon |
| `robots.txt` | Crawler rules + sitemap pointer |
| `sitemap.xml` | Single-page sitemap for the canonical URL |

`index.html` sets canonical URL, meta description, Open Graph, Twitter Card, and JSON-LD `WebApplication`. Some social networks prefer **PNG/JPEG** for `og:image`; if previews fail on a platform, export `og-cover.svg` to PNG at 1200×630 and point the meta tags at that file.
