# Project Memory — Perspective Funnel/Quiz Builder

> Vite + React SPA that replicates Perspective's mobile-first, page-sequence funnel builder. Canvas is the only manipulation surface; left rail is the only property surface.

## Stack
- **Build:** Vite 8.2 + `@vitejs/plugin-react`, `vite build` → `dist/`
- **Runtime:** React 19.2, ReactDOM 19.2 — functional components, hooks only
- **Styling:** Plain CSS (`src/index.css` tokens + `src/App.css` layout), CSS variables for theming (`--theme-bg/fg/accent`), no UI framework
- **Icons:** SVG sprite `public/icons.svg` via `<use>`
- **Lint:** `oxlint` (`npm run lint`), config `.oxlintrc.json`
- **No backend** — pure SPA, localStorage persistence

## File Map
| Path | Role |
|---|---|
| `perspective build sheet.txt` | Canonical spec — shell, 5 interaction patterns, component inventory, phased roadmap |
| `src/store.jsx` | Single source of truth: `FunnelContext`/`useFunnel`, `makeBlock`/`defaultContent`, `THEMES`, `initialFunnel`, `migratePersisted`, `funnelReducer`, undo/redo (50 steps), localStorage `perspective:funnel:v3` + deep-link `?pageId&componentId`, device/published state |
| `src/App.jsx` | All UI: `SettingsModal`, `PreviewModal`, `TopBar`, `SizeStepper`, `ColorPicker`, `resolveColor/resolveBg/buttonBg`, `LeftRail`, `PropertyPanel`, `RuleBuilder`, `InlineToolbar`, `BlockRenderer`, `FloatingToolbar`, `Canvas`, `Shell` (~1686 lines) |
| `src/App.css` | Shell/rail/canvas/block/panel/toolbar styles (~205 lines) |
| `src/index.css` | Design tokens, reset, CSS vars |
| `vite.config.js` / `index.html` | Vite entry |

## Data Model
```js
Funnel { id, name, themeId, settings, pages[], results[], messages[], blocksById{}, themes[] }
Page { id, index, name, slug, confetti, blocks: string[], background: {kind:'token'|'solid'|'gradient'}, desktopLayout:{mode:'stack'|'split', ratio:'50/50'|'60/40'|'40/60'|'70/30'} }
Block { id, type, parentId, order, content, style, styleOverrides, trackingId, linking, resultRef, children: string[] }
Theme { id, name, font, colors: [4], radius, transition, transitionDuration, disableAnimation, isSystem }
Settings { progressBar, cookieBanner, socialTitle/Desc, favicon, language, funnelBackground, startCta, brandName, category, subtitle, autoAdvance, autoAdvanceDelayMs, legal, progressStyle }
Quiz: Block.content { question } + optionDisplay:'text'|'icon'|'image'|'card-photo'|'card-icon', autoAdvance, autoAdvanceDelayMs, multiSelect, cardColor, cardTextColor, cardTextSize, cardTextFont, cardLayout:'grid'|'stack'|'2col'
Answer: score, tags, icon, reportHeadline/Body, insightUrl/Label
```

**Normalized** `blocksById` + `pages[].blocks` (childIds). Quiz answers are child `answer` blocks (`parentId=quizId`, `quiz.children=[answerIds]`). Serialized inverted commands enable undo/redo/autosave/multiplayer.

## Key Behaviors
- **Selection:** 3 states — hover (dashed+grey badge), selected (blue outline+blue badge+toolbar+panel+URL), editing (contentEditable caret on 2nd click). `selectedBlockId` auto-flips rail to Design; Esc deselects. 150ms pointer block after rail swap prevents accidental clicks.
- **Toolbar:** Portal `fixed` over `.canvas-wrap` (avoids `overflow:hidden` clip): +add underneath, ≡move (drag), ⧉duplicate (⌘D), 📋copy (⌘C), 🗑delete (Del). Child answers lose add/copy.
- **Canvas:** Device chrome (`mobile 390×844 / tablet 834×1194↔1194×834 landscape / desktop 1120×700`) with `scale min(1, avail/outer)`, `canvas-inner` centered vertically on tablet/desktop (`safe center`) with `maxWidth 680/760` + `fontScale 1.32/1.48`, images capped `280/320px`, `isLandscape` swaps tablet w/h. Progress pill + banner. `pageBgInner` keyed `page-anim pt-*` with `transitionDuration`.
- **Add flow:** `+` bottom → fires `open-library` → rail `add` mode (Basic/Interactive/Sections). Tile click creates `previewBlock` (+ `_extra` for quiz 4 answers) with dashed preview + `✓/✕` confirm bar (bottom -18px). Confirm dispatches `ADD_BLOCK` (+ `extraBlocks`). Guard `safeSetPreview` prevents overwrite until confirmed.
- **Theming:** Scoped via `document.documentElement.style.setProperty('--theme-*', theme.colors[i])`. `resolveColor/resolveBg` map token→`theme.colors[slot-1]`, transparent=`slot 0`. `buttonBg` tones `#111`→`#4a4a4a`. Page bg → `canvas-frame` inner; funnel bg → `canvas-wrap`.
- **Video:** `video` type stores URL string; left rail `Video URL` input auto-converts youtube `watch?v|youtu.be → /embed/`, vimeo, mp4 (`<video>` vs `<iframe 16/9>`). Preview chips for demos.
- **Rich text:** Text/quiz/answer/button store `innerHTML` (not textContent); `InlineToolbar` (B/I/U/◧ highlight/✕ clear via `execCommand`) floats above selection while editing; `⌘B/I/U` native. Block-level style (size/bold/italic/underline/align) still applies; `lineHeight` slider `1→2.2 step 0.05` per text-like block (`style.lineHeight`, default 1.45).
- **Themes (7):** Editorial, Minimal, Sunset, Ocean, Party (`#fff1f2/#831843/#ec4899/#8b5cf6` Fraunces), AI Nebula (`#faf5ff/#2e1065/#7c3aed` JetBrains Mono), AI Vector (`#010d03/#00ff41/#22c55e` Asteroids CRT, JetBrains Mono). `migratePersisted` merges missing system themes + `transitionDuration:380`, `desktopLayout`, `card*`.
- **Persistence:** `localStorage perspective:funnel:v3` (v2 fallback), `migratePersisted` fixes phantom pages, invisible quiz/answer (`slot1→2`), empty p3, backfills `card*`/`multiSelect`. Hydrated-ref gates autosave + URL write. Deep-link read on mount.
- **Quiz parity (this session):** Scoring/tags per answer, `collectScoreAndTags`/`resolveResultId`/`interpolateTokens` (merge `{{score}}`/`{{firstName}}` etc), `card-photo`/`card-icon` with `grid/stack/2col` + odd-centered `auto-fit`, bottom `28%` solid `cardColor` + `cardText*`, `multiSelect` array scoring, `autoAdvance` global+per-quiz, `page.desktopLayout` split `50/50-70/30` (headline/media left, quiz right on desktop), `transition`+`duration`+`confetti` (126 pieces burst+fall, front `z20`, smooth).

## Conventions
- Actions via `funnelReducer`: `REHYDRATE, SET_FUNNEL_NAME, SET_THEME, UPDATE_THEME, CREATE_THEME, FORK_THEME, DELETE_THEME, ADD_PAGE, DUPLICATE_PAGE, DELETE_PAGE, RENAME_PAGE, UPDATE_PAGE_LAYOUT, ADD_RESULT, DELETE_RESULT, ADD_BLOCK, UPSERT_BLOCKS, UPDATE_BLOCK, UPDATE_BLOCK_CONTENT, UPDATE_BLOCK_STYLE, DELETE_BLOCK, DUPLICATE_BLOCK, MOVE_BLOCK, UPDATE_PAGE_BACKGROUND, UPDATE_FUNNEL_BACKGROUND, UPDATE_SETTINGS, UPDATE_LEGAL`
- Color helpers: `resolveColor`, `resolveBg`, `buttonBg`
- CSS classes: `.shell/.topbar/.main/.rail/.canvas-wrap/.canvas-frame/.canvas-inner/.block/.badge/.block-toolbar-portal/.canvas-toolbar/.panel/.picker/.confirm-bar`
- No floating popovers/right inspector — in-rail panels only; CSS variables for theming

## Gotchas & Fixes Applied
- Vite scaffolding to `/` cancelled — scaffold to `/tmp/pv` then `cp -r`
- `onChange` inline `const nc=[...]; nc[i]=` invalid in JSX — use `.map`
- `PreviewModal/SettingsModal` patch inline comma/brace — use helper
- `setsid` not found for dev server — use polling
- Toolbar clipped by `overflow:hidden` → portal fixed
- `+` preview overwritten / ✓/✗ clipped → guard + `left:50% bottom:-18px overflow:visible`
- Invisible text: `slot1 #f0f9ff on #f0f9ff` → migrate to `slot2`, default `slot2` for new blocks
- Progress bar square ends → `borderRadius:99 margin:6px 10px 0`
- Button harsh `#111` → `#4a4a4a` via `buttonBg`
- Gradient not rendering → `resolveBg` handles `gradient` kind
- Device frame stretched (width no height) → explicit `w/h/pad/radius` + scale math + scrollable inner

## Build & Run
```bash
npm install
npm run dev -- --port 5173 --host   # Vite, 50ms build
npm run build                        # → dist/assets index-*.js ~285k gzip ~84k, CSS ~13.6k
npm run lint
```

## Roadmap (from build sheet)
- Phases 0-7 shell + 5 interactions + canvas/library/panels → done
- Page/funnel backgrounds, video URL, party/AI themes, inline formatting, line-height, desktop split (Q7 60/40), question cards (photo/icon), confetti polish → done (this session)
- Remaining polish: section library live previews, A/B branching, contacts/metrics/apps tabs, OG publish flow

## Session Preferences
- Loop until complete, clean design best practices, token budget 200k (check in if hit), one-line terminal updates, in-document DOM not iframe, no floating popovers, visible progress polish
