# Terms of Use Link and Licensing Copy for Flood Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/FM-5
**Repo**: https://github.com/concord-consortium/flooding-model
**Implementation Spec**: [implementation.md](implementation.md)
**Status**: **In Development**

## Overview

Flood Explorer's About and Share dialogs get the license and Terms of Use copy approved for CODAP's About dialog, replacing the old CC BY-NC copyright block, so that every Geo app states the same thing: the source is MIT, and use of the hosted site is governed by Concord's Terms of Use. The top bar's Reload, Share and About controls become keyboard-reachable buttons, reached by Tab from left to right as on screen, and both dialogs are named by their titles, close with a real Close button, and return focus to the button that opened them.

## Project Owner Overview

Concord published non-commercial Terms of Use for everything served from its servers, and the Geo simulations are widely embedded in commercial curricula. Flood Explorer does not mention the Terms of Use anywhere today; its About and Share dialogs end with a Creative Commons (CC BY-NC) copyright block. After this story, both dialogs end with the same short statement the other Geo apps and CODAP show, with working links to the MIT License, the Terms of Use, concord.org/licensing and the licensing email, and the current year in a 12px copyright line. Flood Explorer always shows its top bar, standalone and embedded, so the statement is reachable everywhere the app runs.

The top bar's controls also become usable from the keyboard and by screen-reader users: Reload, Share and About can be reached with Tab, in the order they appear, and used with Enter, each dialog announces its title, its close control is a named button, and closing it puts the keyboard focus back where it was. Kiley reviews the result on the branch deploy before merge.

## Background

FM-5 is the Flood Explorer story in a set of five matching Geo stories (HURR-70, SE-4, TE-10, WM-67, FM-5). The decisions shared by all five are in the global oob doc `streams/terms-of-use/geo-common.md` (decisions 1 to 11). Doug took all but four; Kiley Brown decided 3, 5, 6 and 9 on 2026-11-17. After reviewing the Geo branch builds on 2026-11-19, Kiley signed off and asked for three changes in every Geo app so they match: Reload as a keyboard button, the copyright line at 12px, and Tab following the on-screen order (R2, R10). In the same review she confirmed, with no code change, that embeds are covered by the About dialog plus the Activity Player footer (R9) and that "Inc." and the current-year-only copyright line stay (R2, R3). This spec applies them to Flood rather than re-deciding them. HURR-70 (hurricane-model PR #163) is the worked example for the component split and the tests; SE-4's and TE-10's specs, on their branches, add what their self-reviews found.

What the code has today (master):

- `src/components/app.tsx` always renders `TopBar` from `src/geohazard-components/top-bar/top-bar.tsx`, passing `projectName="Flood Explorer"`, `<AboutDialogContent />` and `<ShareDialogContent />`. No configuration hides the top bar.
- `top-bar.tsx` renders Reload as a `<span data-testid="reload" onClick>` holding MUI's 24px Refresh icon, and Share and About as `<span data-testid onClick>` elements. None is focusable, so Tab never reaches them. The bar is a flex row (`justify-content: space-between`) with Reload first on the left and one `<span>` holding Share then About on the right, with no floats or reordering, so the DOM order is the on-screen order (Reload, Share, About from left to right). The mismatch Teale Fristoe found in Seismic, where floated buttons put Tab right to left, does not arise. Opening logs `ShareDialogOpened` or `AboutDialogOpened`.
- `geohazard-components/top-bar/dialog.tsx` wraps MUI v4's `Dialog` (`@material-ui/core` 4.12.2). MUI gives the paper `role="dialog"`, a focus trap, Esc to close, and focus restore to the element focused before opening. The title is a plain `<div>` not tied to the dialog, so the dialog has no accessible name, and the close control is a bare `<CloseIcon onClick>` that is neither focusable nor named. Measured in Chromium: the open dialog has no `aria-labelledby`, and after Esc focus lands on `<body>`, because the span that opened it cannot hold focus.
- `src/components/about-dialog-content.tsx` and `share-dialog-content.tsx` each end with `<Copyright />` (`geohazard-components/top-bar/copyright.tsx`): "Copyright © {year} The Concord Consortium. All rights reserved. This resource is licensed under a Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)…", at 0.8em. That is FM-3's text (geo-common decision 5). Share also has the page link and embed textareas and a "Suggested citation" line.
- `LICENSE` is MIT (copyright 2018), and the default branch is `master`, so the story's "flag it if not MIT" condition does not trigger.
- Flood does not wait for an Activity Player message: the Share dialog's own embed code (a 1000 × 800 iframe) loads the full app with its top bar in a plain HTML page (checked in Chromium).

## Requirements

### License copy

- **R1. One license-copy component** renders the copy below and is the last block of both the About dialog and the Share dialog, replacing `<Copyright />` in each. `geohazard-components/top-bar/copyright.tsx` is deleted (decision 5).
- **R2. Copy, word for word** (geo-common "Copy"; CODAP `V3.AboutDialog.*` with the product and host swapped), in this order:
  - Paragraph 1: **Flood Explorer is free, open-source software.** The Flood Explorer source code is released under the [MIT License], so you’re welcome to use, modify, and build on it.
  - Paragraph 2: **Your use of Flood Explorer at flood.concord.org** is governed by our [Terms of Use]. The hosted version is free for non-commercial use; commercial use requires a separate written agreement. For more information, visit [concord.org/licensing] or contact [licensing@concord.org].
  - Copyright line at exactly 12px, the size Kiley set for every Geo app on 2026-11-19 (the old CC BY-NC block used 0.8em, 12.8px here): `© {current year} The Concord Consortium, Inc.` "Inc." stays, confirmed by Kiley on 2026-11-19.
  - The leading phrase of each paragraph is bold. "you’re" uses the curly apostrophe U+2019 (decision 1).
- **R3. Year** is `new Date().getFullYear()` at render time. No range and no build-time constant (decision 1; Kiley confirmed the current-year-only line on 2026-11-19).
- **R4. The old text is gone** from both dialogs: no "Creative Commons", "CC BY" or "All rights reserved" (decision 5).

### Links

- **R5. Link targets**, kept in one constants module rather than inline in JSX:
  - MIT License: `https://github.com/concord-consortium/flooding-model/blob/master/LICENSE`
  - Terms of Use: `https://concord.org/terms-of-use/`
  - concord.org/licensing: `https://concord.org/licensing`
  - licensing@concord.org: `mailto:licensing@concord.org`
- **R6. Web links open in a new tab**: the three web links have `target="_blank"` and `rel="noopener noreferrer"` (decision 2), and append visually hidden text " (opens in a new tab)" so their accessible name is the visible text plus the hint. The mailto link is a plain same-tab `<a>` with no hint.
- **R7. Links in the copy are underlined.**

### Reachability

- **R8. No other new surface**: no top-bar Terms of Use item, no heading over the copy, no CODAP-style links row (decision 6; Kiley confirmed the link inside the dialogs counts as visible).
- **R9. Reachable standalone and embedded**: Flood always renders its top bar, so About and Share, and the copy in them, are reachable standalone, in Activity Player, and in a plain iframe such as the Share dialog's own embed code. Nothing is added for embeds: Kiley decided (2026-11-17 and 2026-11-19) that the About dialog plus the Activity Player's own footer (AP-146) cover embedded use, with no corner link, and that third-party embeds that hide the top bar are out of scope. Flood cannot hide its top bar, so only the About dialog applies here (decision 3).
- **R10. Reload, Share and About are `<button type="button">`s** that look as their current controls do (Reload: MUI's 24px Refresh icon in the same place; Share and About: 17px Lato; all `#797979`, `#434343` on hover, same position and spacing; no default button border, background or padding), keeping `data-testid="reload"`, `"share"` and `"about"`, Reload's `onBeforeReload` call, `TopBarReloadButtonClicked` log and reload, and the `ShareDialogOpened` and `AboutDialogOpened` logs. Reload has no visible text, so it is named "Reload" by `aria-label` with a matching `title` tooltip, as Hurricane's is. Each shows a visible focus indicator on keyboard focus whose outline fits inside the 22px top bar with no side clipped. Tab reaches them in on-screen order, Reload, Share, About, from left to right; master's DOM order already matches the screen, so this holds by keeping that order. (geo-common decision 4: [applies story] for About; [beyond story] for Share, decided by Doug on 2026-11-18 after Teale Fristoe's review of HURR-70 asked for Share to be keyboard reachable; [beyond story] for Reload and the Tab order, asked for by Kiley in her 2026-11-19 review so the Geo apps match.)

### Dialog behavior

These apply to both About and Share, since both use the one `Dialog` component (decision 7).

- **R11. Each dialog is named by its title**: "About: Flood Explorer" and "Share: Flood Explorer". The title keeps its look.
- **R12. The close control is a `<button type="button">` named "Close"**, keeping today's look (MUI's Close icon, 24px, 8px from the top right corner, `#797979`, `#434343` on hover), with a visible focus indicator on keyboard focus.
- **R13. Focus starts on Close, stays in the dialog and comes back** (geo-common decision 7, "Focus on open and on close"): every time a dialog opens, including a reopen while it is still fading out, focus goes to its Close button, inside the element that carries the dialog's name, so a screen reader announces the title (MUI v4 alone focuses a container outside that element). Tab stays inside the open dialog and Esc closes it (MUI's existing behavior), and closing the dialog by Esc, Close or a backdrop click returns focus to the button that opened it, including after a mouse click in a browser that does not focus a button on click (macOS Safari and Firefox). [beyond story]; decided by Doug on 2026-11-18 and refined on 2026-11-19.

### Unchanged

- **R14.** About's descriptive paragraphs and its creator and NSF credit line, and their links, are unchanged. Share's page link and embed textareas and its "Suggested citation" line are unchanged (decision 11). What Reload does is unchanged. The dialogs keep MUI's height cap (the viewport minus 64px), so a dialog taller than a small frame scrolls inside itself rather than running off screen.

### Tests

- **R15.** Unit tests render the real About and Share content (not the copy component alone) and cover, for each: the four hrefs, asserted as literal URLs rather than the constants module's values; `target` and `rel` on the three web links and their absence on the mailto link; each web link's accessible name including the " (opens in a new tab)" hint, and the mailto link's name as its text alone; the R2 copy word for word and in order, including the curly apostrophe and the two bold lead-in phrases; that the copy is the dialog's last block (R1); the copyright line, with the clock pinned to a fixed date and the year asserted as a literal, under two different pinned years so neither a year computed as the code computes it nor a hardcoded year passes; and that the R4 text is absent. Tests also cover, through the real top bar: Reload is a `type="button"` button named "Reload" with a `title` of "Reload", the first Tab stop, and Enter on it reloads (R10); and for both Share and About: each is a `type="button"` button reached by Tab after Reload, in that order; Enter opens its dialog, named by its title (R11), with focus on Close (R13); after a click that does not focus the button, with focus first on the body, Esc and the Close button each close the dialog and return focus to the button (R12, R13); and reopening while the dialog is still fading out puts focus on Close (R13). Jest's style mock applies no Sass, so two Cypress tests against the real app cover what is layout: the top-bar buttons' DOM order (their Tab order) runs left to right on screen, and the copyright line computes to 12px in both dialogs. R10's and R12's look and focus indicators are checked in the browser.

### CI

- **R16. CI's Cypress job runs on GitHub's current runner.** `.github/workflows/ci.yml` uses `cypress-io/github-action@v6`, the version whose dev-server wait failed on GitHub's current runner for HURR-70 (two red runs on its branch, one of them after pinning `ubuntu-24.04`, each failing the `wait-on` step with "Socket closed before the connection was established", then green from the move to `@v7`). It moves to `@v7`, as the first commit on the branch and in a commit of its own.

### Review

- **R17.** Kiley reviews the result on the branch deploy before merge (story acceptance criterion). CI's S3 deploy publishes each branch at `https://models-resources.concord.org/flooding-model/branch/<name>/index.html` (`deployRunUrl` in `.github/workflows/ci.yml`), and `s3-deploy-action` strips a leading Jira key from the branch name (DEV-163's branch is served at `branch/flooding-model-oidc/`), so this story's branch is at `https://models-resources.concord.org/flooding-model/branch/add-terms-of-use-link/index.html`. Kiley's steps, one per acceptance criterion:
  - **Visible standalone and embedded**: open that URL, then paste the Share dialog's embed code (a 1000 × 800 iframe) into any HTML page and open it; in both, About and Share in the top bar each open a dialog that ends with the copy.
  - **Copy with working links**: in each dialog, MIT License, Terms of Use and concord.org/licensing each open the right page in a new tab, and licensing@concord.org opens a new email.
  - **Wording matches CODAP**: the copy reads as CODAP's About dialog (codap#2758) does, apart from "Flood Explorer" and "flood.concord.org".
  - **Reviewed on the deployed branch**: these checks on the URL above are that review.

## Technical Notes

- **Reference implementation**: CODAP's About dialog (CODAP-1595 / codap#2758): strings `V3.AboutDialog.*` in `v3/src/utilities/translation/lang/en-US.json5`, links in `about-dialog-constants.ts`, new-tab links in `components/common/external-link.tsx` with hint `V3.ExternalLink.opensInNewTab`. HURR-70's `src/components/license/` (`license-constants.ts`, `external-link.tsx`, `license-copy.tsx`, `license-copy.test.tsx`) and its `dialog.tsx` are the Geo worked examples; Flood is on MUI v4 and React 18, so it follows their shape, not their code.
- **No shared package**: the Geo apps share no component library; `src/geohazard-components/` is a copy local to this repo, not a dependency, so changing its top bar and dialog affects only Flood (geo-common "No shared package").
- **Stack**: React 18.2, MobX 6, MUI v4 (`@material-ui/core` 4.12.2), Sass modules (camelCase class names), TypeScript targeting ES5, Jest 29 with jsdom, @testing-library/react 14 and @testing-library/user-event 14.4.3 (already a devDependency; one copy of @testing-library/dom, 9.3.0), ESLint with `plugin:testing-library/react` on `*.test.*` files. Node 20, as CI uses; the repo has no `.nvmrc`.
- **MUI v4 dialog**: v4's `Dialog` puts `role="dialog"` on its paper and spreads `PaperProps` onto it, so the dialog can be named by its title there. Generated ids are best avoided in the top bar: React 18's client `useId` numbers ids in mount order, and the Cypress page objects select the side panel's react-tabs by their generated ids (`#tab\:r1\:0`), which any `useId` mounted before them renumbers. On open it focuses its own container `div` around the paper, outside the `role="dialog"` element, unless focus is already inside. Closing keeps the dialog mounted through its exit fade, so a reopen during the fade reuses it and `autoFocus` does not fire again; the transition's `onEntering` runs on every enter, so focusing Close there covers both cases, and MUI's trap then leaves focus alone (measured in jsdom and Chromium). Pass it through `TransitionProps`: the bare `onEntering` prop logs a deprecation error in 4.12. MUI's focus restore (on by default) returns focus to the element focused when the dialog opened, so R13 follows once Share and About hold focus; macOS Safari and Firefox do not focus a button on a mouse click, so the open handlers focus their button first.
- **Dialog size**: measured in Chromium. At 1000 × 800 (the Share embed size) the About dialog grows from 459 to 554px tall and Share from 302 to 397px with the copy, both unscrolled. At 900 × 600 About reaches MUI's cap (536px) and scrolls its content (592px); its title and × are inside the scrolling paper, so they scroll out of view with the content, as any long MUI v4 dialog does today, and Esc and Tab still reach Close.
- **Top bar layout**: master's Reload `<span>` is 24 × 32 at (11, -5), taller than the 22px bar because of the icon's `margin-top: 4px`, with the icon at (11, -1, 24 × 24); an inset ring on that box would lose its top edge above the page. As a button, the icon is `display: block` with `margin: -1.5px 0`, which makes the button 24 × 21 at (11, 0.5), the height of Share and About, and leaves the icon at master's (11, -1); the inset ring then shows all four sides inside the bar (Chromium screenshot). The 22px bar holds Share at (878.8, 0.5, 42.8 × 21) and About at (937.7, 0.5, 46.3 × 21) at 1000px wide. A `<button>` with the same `textButton` class plus `padding: 0; border: none; background: none; font: inherit; color: inherit` measured the same boxes in Chromium. A focus outline drawn 2px outside a 21px button in a 22px bar would lose its top and bottom edges (TE-10 found the same in its 20px bar), so it is drawn inset (`outline-offset: -2px`), which showed all four sides in a screenshot.
- **Links**: the browser's default link style already underlines links in the dialogs (nothing in the app resets it), and the four copy links measured underlined in Chromium.
- **Logging**: no new log events, so `LOGGED-EVENTS.md` is unchanged.
- **CI**: v6 runs the action on Node 20 and v7 on Node 24; the job's `actions/setup-node` step keeps the app's install and dev server on Node 20. The job's other inputs (`install-command`, `start`, `wait-on`, `record`, `parallel` and the env block) are the ones hurricane-model's job passes to v7 apart from `parallel`, which v7 keeps. flooding-model's last CI run was in July 2026, before the runner change.

## Out of Scope

- From the story: a third-party library acknowledgements list, usage tracking, changing the software license, localizing the legal copy, a cookie banner, and a Terms of Use link for third-party embeds that hide the top bar (which Flood cannot do).
- Existing credit links in the About dialog, including their `rel="noreferrer"` without `noopener` (geo-common "How links open").
- Share's "Suggested citation" line (decision 11).
- The top-bar text color: `#797979` on white measures about 4.35:1, just under WCAG AA's 4.5:1 for 17px text. R10 keeps the current look.
- The README's stale "Starter Projects are Copyright 2020" license section and its pointer to a `license.md` that does not exist.
- The other four Geo apps and Boreal Forest Fire Explorer.

## Open Questions

### RESOLVED: Judgment call: where does the new code live?
**Context**: The copy names Flood; `src/geohazard-components/` holds the top bar and dialog that geo-common's FM-5 row says to reuse.

**Options considered**:
- A) A new `src/components/license/` folder for the constants, `ExternalLink`, the copy and its test, as HURR-70 did; the top-bar and dialog fixes stay in `geohazard-components/top-bar/`.
- B) Put the copy in `geohazard-components/top-bar/` beside the `Copyright` it replaces.

**Decision**: A. The copy is Flood's own text, not part of the generic top bar, and A keeps the five apps' layouts alike.

---

### RESOLVED: Judgment call: how does the focus ring fit the 22px bar?
**Context**: R10 requires a ring with no side clipped. HURR-70 shrank its buttons' line height so a ring outside them fits; TE-10 drew its ring inside the button.

**Options considered**:
- A) An inset ring (`outline-offset: -2px`) on the unchanged 21px buttons.
- B) Shrink the buttons' line height to leave room for an outside ring.

**Decision**: A. The buttons keep their exact boxes, and the inset ring showed all four sides in Chromium.

---

### RESOLVED: Judgment call: test Enter in Jest?
**Context**: SE-4 could not test Enter on a native button (jsdom 11, no user-event) and left it to the browser.

**Options considered**:
- A) Test Enter with user-event 14, which this repo already has and which activates a native button on Enter in jsdom.
- B) Check Enter only in the browser, as SE-4 does.

**Decision**: A. R15 tests Enter; turning About back into a span fails it. The browser check repeats it.

---

### RESOLVED: Low confidence: Safari's click focus is reasoned, not run
**Context**: R13's Safari case rests on Safari not focusing a button on click; the planned test simulates a click that does not move focus.

**Options considered**:
- A) Check it in Playwright's WebKit and record the result.
- B) Guard it with the Jest test that clicks without moving focus, as HURR-70 does.

**Decision**: B. Not focusing a button on click is a macOS platform convention that Safari follows, not a WebKit engine rule, so Playwright's Linux WebKit build would not show it either way (and no installed Playwright matches the cached WebKit build). The Jest test fails when the open handler stops focusing its button, which is the line that matters; Safari itself is outside what can be run here.

## Self-Review

Roles: WCAG accessibility expert, QA engineer, senior engineer, Kiley as acceptance reviewer, reader of the spec a year from now. Every claim below was checked against the code or in Chromium against a throwaway build of the plan; findings that did not survive are not listed.

### Reader of the spec a year from now

#### RESOLVED: Background stated other stories' live status
Background called HURR-70 "implemented" and SE-4 and TE-10 "specced", which stops being true as those stories move. It now names them as worked examples without their status.

#### RESOLVED: R2 described the copyright style by a component this story deletes
"as `Copyright` uses today" points at a file R1 deletes. R2 now says the old CC BY-NC block used 0.8em.

### Held up

- R10's look: About is `#797979` at rest and `#434343` on hover as a button, and Share and About keep master's boxes; the inset ring shows all four sides in the 22px bar.
- R12's look: the × keeps master's size and place in the paper (24 × 24, 8px from its top and right edges), turns `#434343` on hover, and its 2px ring shows on all four sides inside the paper.
- R11: the title keeps master's size and place in the paper (904 × 23, 16px from its top) as an `<h2>`.
- R16: the failure cause is in HURR-70's failed run log, and v7 accepts every input FM's job passes, `parallel` included.
- R17: all four link targets, flood.concord.org and the branch-deploy pattern returned 200 on 2026-11-18.

### Self-review round 1

Recorded in full in implementation.md. Here it added the MUI v4 note (Technical Notes) on where focus lands when a dialog opens, and R13 now starts focus on Close, as Doug decided.

### Self-review round 2

Recorded in implementation.md. Here it restated the R11 and R12 boxes as size and place in the paper, which is what matches master, and dated the R17 link check.

### Decision 7 revision (2026-11-19)

geo-common decision 7 was refined after TE-10's final review: Close gets focus on every open, not only on mount, and the click-without-focus case is tested by Esc and by Close. R13 and R15 now say so, and the MUI v4 note explains why `onEntering` replaces `autoFocus`.

### Kiley's review (2026-11-19)

Kiley reviewed the Geo branch builds, signed off, and asked for three changes in every Geo app. Reload becomes a named, keyboard-reachable button with a tooltip (R10); the copyright line is 12px (R2); and Tab follows the on-screen order (R10), which Flood's top bar already does, so the spec keeps that order and adds a Cypress test that fails if it changes. R15 adds the tests. R2, R3 and R9 record what she confirmed with no code change.
