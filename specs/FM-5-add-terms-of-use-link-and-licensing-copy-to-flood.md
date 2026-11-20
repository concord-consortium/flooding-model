# Terms of Use Link and Licensing Copy for Flood Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/FM-5

**Status**: **Closed**

## Overview

Flood Explorer's About and Share dialogs get the license and Terms of Use copy approved for CODAP's About dialog, replacing the old CC BY-NC copyright block, so that every Geo app states the same thing: the source is MIT, and use of the hosted site is governed by Concord's Terms of Use. The top bar's Reload, Share and About controls become keyboard-reachable buttons, reached by Tab from left to right as on screen, and both dialogs are named by their titles, close with a real Close button, and return focus to the button that opened them.

FM-5 is one of five matching Geo stories (HURR-70, SE-4, TE-10, WM-67, FM-5). The decisions they share are in the global oob doc `streams/terms-of-use/geo-common.md` (decisions 1 to 12); this spec applies them to Flood. Kiley Brown decided 3, 5, 6 and 9 on 2026-11-17, and after reviewing the Geo branch builds on 2026-11-19 asked for Reload as a button, a 12px copyright line and Tab in on-screen order in every app (decisions 4 and 12).

## Requirements

### License copy

- **R1. One license-copy component** renders the copy below and is the last block of both the About dialog and the Share dialog, replacing `<Copyright />` in each. `geohazard-components/top-bar/copyright.tsx` is deleted (decision 5).
- **R2. Copy, word for word** (geo-common "Copy"; CODAP `V3.AboutDialog.*` with the product and host swapped), in this order:
  - Paragraph 1: **Flood Explorer is free, open-source software.** The Flood Explorer source code is released under the [MIT License], so you’re welcome to use, modify, and build on it.
  - Paragraph 2: **Your use of Flood Explorer at flood.concord.org** is governed by our [Terms of Use]. The hosted version is free for non-commercial use; commercial use requires a separate written agreement. For more information, visit [concord.org/licensing] or contact [licensing@concord.org].
  - Copyright line at exactly 12px (decision 12; the old block used 0.8em, 12.8px here): `© {current year} The Concord Consortium, Inc.` "Inc." stays, confirmed by Kiley on 2026-11-19.
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
- **R10. Reload, Share and About are `<button type="button">`s** that look as their previous controls did (Reload: MUI's 24px Refresh icon in the same place; Share and About: 17px Lato; all `#797979`, `#434343` on hover, same position and spacing; no default button border, background or padding), keeping `data-testid="reload"`, `"share"` and `"about"`, Reload's `onBeforeReload` call, `TopBarReloadButtonClicked` log and reload, and the `ShareDialogOpened` and `AboutDialogOpened` logs. Reload has no visible text, so it is named "Reload" by `aria-label` with a matching `title` tooltip, as Hurricane's is. Each shows a visible focus indicator on keyboard focus whose outline fits inside the 22px top bar with no side clipped. Tab reaches them in on-screen order, Reload, Share, About, from left to right. (Decision 4: [applies story] for About; [beyond story] for Share, decided by Doug on 2026-11-18 after Teale Fristoe's review of HURR-70; [beyond story] for Reload and the Tab order, asked for by Kiley on 2026-11-19.)

### Dialog behavior

These apply to both About and Share, since both use the one `Dialog` component (decision 7).

- **R11. Each dialog is named by its title**: "About: Flood Explorer" and "Share: Flood Explorer". The title keeps its look.
- **R12. The close control is a `<button type="button">` named "Close"**, keeping its look (MUI's Close icon, 24px, 8px from the top right corner, `#797979`, `#434343` on hover), with a visible focus indicator on keyboard focus.
- **R13. Focus starts on Close, stays in the dialog and comes back** (decision 7, "Focus on open and on close"): every time a dialog opens, including a reopen while it is still fading out, focus goes to its Close button, inside the element that carries the dialog's name, so a screen reader announces the title. Tab stays inside the open dialog and Esc closes it, and closing the dialog by Esc, Close or a backdrop click returns focus to the button that opened it, including after a mouse click in a browser that does not focus a button on click (macOS Safari and Firefox). [beyond story]; decided by Doug on 2026-11-18 and refined on 2026-11-19.

### Unchanged

- **R14.** About's descriptive paragraphs and its creator and NSF credit line, and their links, are unchanged. Share's page link and embed textareas and its "Suggested citation" line are unchanged (decision 11). What Reload does is unchanged. The dialogs keep MUI's height cap (the viewport minus 64px), so a dialog taller than a small frame scrolls inside itself.

### Tests

- **R15.** Unit tests render the real About and Share content (not the copy component alone) and cover, for each: the four hrefs, asserted as literal URLs rather than the constants module's values; `target` and `rel` on the three web links and their absence on the mailto link; each web link's accessible name including the " (opens in a new tab)" hint, and the mailto link's name as its text alone; the R2 copy word for word and in order, including the curly apostrophe and the two bold lead-in phrases; that the copy is the dialog's last block; the copyright line, with the clock pinned to a fixed date and the year asserted as a literal, under two different pinned years; and that the R4 text is absent. Tests also cover, through the real top bar: Reload is a `type="button"` button named "Reload", with an `aria-label` and a `title` of "Reload" (asserted as attributes, since the `title` alone would also name it), the first Tab stop, and Enter on it reloads; and for both Share and About: each is a `type="button"` button reached by Tab after Reload, in that order; Enter opens its dialog, named by its title, with focus on Close; after a click that does not focus the button, with focus first on the body, Esc and the Close button each close the dialog and return focus to the button; and reopening while the dialog is still fading out puts focus on Close. Jest's style mock applies no Sass, so two Cypress tests against the real app cover layout: the top-bar buttons' DOM order (their Tab order) runs left to right on screen, and the copyright line computes to 12px in both dialogs. R10's and R12's look and focus indicators are checked in the browser.

### CI

- **R16. CI's Cypress job runs on GitHub's current runner.** `cypress-io/github-action@v6`, whose dev-server wait failed on GitHub's current runner for HURR-70 ("Socket closed before the connection was established" in `wait-on`), moves to `@v7` in `.github/workflows/ci.yml`, as the first code commit on the branch, after the spec, and in a commit of its own.

### Review

- **R17.** Kiley reviews the result on the branch deploy before merge (story acceptance criterion), at `https://models-resources.concord.org/flooding-model/branch/add-terms-of-use-link/index.html` (`s3-deploy-action` strips the leading Jira key from the branch name). Her steps, one per acceptance criterion:
  - **Visible standalone and embedded**: open that URL, then paste the Share dialog's embed code (a 1000 × 800 iframe) into any HTML page and open it; in both, About and Share each open a dialog that ends with the copy.
  - **Copy with working links**: in each dialog, MIT License, Terms of Use and concord.org/licensing each open the right page in a new tab, and licensing@concord.org opens a new email.
  - **Wording matches CODAP**: the copy reads as CODAP's About dialog (codap#2758) does, apart from "Flood Explorer" and "flood.concord.org".
  - **Reviewed on the deployed branch**: these checks on the URL above are that review.

## Technical Notes

- **Reference implementation**: CODAP's About dialog (CODAP-1595 / codap#2758) for the strings, link constants and new-tab link with its hidden hint. HURR-70's `src/components/license/` and `dialog.tsx` are the Geo worked examples; Flood is on MUI v4 and React 18, so it follows their shape, not their code.
- **No shared package**: `src/geohazard-components/` is a copy local to this repo, so changing its top bar and dialog affects only Flood.
- **MUI v4 dialog**: `role="dialog"` is on the paper and `PaperProps` spreads onto it, so the dialog is named there with `aria-label={title}`. Left alone, MUI focuses its container `div` outside the paper on open, and a closing dialog stays mounted through its exit fade, so `autoFocus` on Close misses a reopen during the fade. Close is focused from the transition's `onEntering`, which runs on every enter, passed through `TransitionProps` because the bare `onEntering` prop is deprecated in 4.12. MUI's focus restore returns focus to the opener once the opener can hold focus; the open handlers focus their button because macOS Safari and Firefox do not focus a button on click.
- **Generated ids**: React 18's `useId` numbers ids in mount order, and the Cypress page objects select the side panel's react-tabs by generated id (`#tab\:r1\:0`), so a `useId` in the top bar renumbers them and breaks 7 Cypress tests.
- **Top bar layout**: the old Reload span was 24 × 32, taller than the 22px bar because of its icon's `margin-top: 4px`. With the icon `display: block` and `margin: -1.5px 0`, the button is 24 × 21 like Share and About and the icon stays where it was. Focus rings are drawn inset (`outline-offset: -2px`), since a ring outside a 21px button in a 22px bar would lose its top and bottom edges.
- **Links**: the browser's default link style underlines the copy's links; nothing in the app resets it.
- **Logging**: no new log events, so `LOGGED-EVENTS.md` is unchanged.
- **CI**: v7 runs the action on Node 24, and the job's `actions/setup-node` step keeps the app's install and dev server on Node 20.

## Out of Scope

- From the story: a third-party library acknowledgements list, usage tracking, changing the software license, localizing the legal copy, a cookie banner, and a Terms of Use link for third-party embeds that hide the top bar (which Flood cannot do).
- Existing credit links in the About dialog, including their `rel="noreferrer"` without `noopener`.
- Share's "Suggested citation" line (decision 11).
- The top-bar text color: `#797979` on white is about 4.35:1, just under WCAG AA's 4.5:1 for 17px text; R10 keeps the existing look.
- The README's stale "Starter Projects are Copyright 2020" license section and its pointer to a `license.md` that does not exist.
- The other four Geo apps and Boreal Forest Fire Explorer.

## Decisions

### Where does the new code live?
**Context**: The copy names Flood; `src/geohazard-components/` holds the generic top bar and dialog.
**Options considered**:
- A) A new `src/components/license/` folder for the constants, `ExternalLink`, the copy and its test, as HURR-70 did.
- B) The copy in `geohazard-components/top-bar/` beside the `Copyright` it replaces.

**Decision**: A. The copy is Flood's own text, not part of the generic top bar, and A keeps the five apps' layouts alike.

---

### How does the focus ring fit the 22px bar?
**Context**: R10 requires a ring with no side clipped. HURR-70 shrank its buttons' line height; TE-10 drew its ring inside the button.
**Options considered**:
- A) An inset ring (`outline-offset: -2px`) on the unchanged 21px buttons.
- B) Shrink the buttons' line height to leave room for an outside ring.

**Decision**: A. The buttons keep their exact boxes, and the inset ring shows all four sides.

---

### Test Enter in Jest?
**Context**: SE-4 could not test Enter on a native button and left it to the browser.
**Options considered**:
- A) Test Enter with user-event 14, which this repo already has and which activates a native button on Enter in jsdom.
- B) Check Enter only in the browser.

**Decision**: A. Turning a button back into a span fails the Enter tests; the browser check repeats them.

---

### How is the Safari click-focus case covered?
**Context**: R13's Safari case rests on Safari not focusing a button on click, which cannot be run here.
**Options considered**:
- A) Check it in Playwright's WebKit.
- B) Guard it with a Jest test that clicks without moving focus, as HURR-70 does.

**Decision**: B. Not focusing a button on click is a macOS convention, not a WebKit engine rule, so Linux WebKit would not show it. The Jest test fails when an open handler stops focusing its button, which is the line that matters.

---

### Where does focus go when a dialog opens?
**Context**: MUI v4 focuses its container `div` outside the `role="dialog"` paper, so a screen reader may not announce the title. A first fix, `autoFocus` on Close, missed a reopen during the exit fade, since the dialog stays mounted.
**Options considered**:
- A) Leave MUI's default.
- B) `autoFocus` on Close.
- C) Focus Close from the transition's `onEntering`, through `TransitionProps`.

**Decision**: C (Doug, 2026-11-18, refined with geo-common decision 7 on 2026-11-19). It runs on every enter, and the bare `onEntering` prop was rejected for its 4.12 deprecation error.

---

### Keep or drop an explicit underline rule for the copy's links?
**Context**: HURR-70's `license-copy.scss` sets `text-decoration: underline`.
**Options considered**:
- A) Rely on the browser's default underline, which nothing in Flood resets.
- B) Copy HURR-70's rule.

**Decision**: A. The rule would change nothing in Flood, and R7 is checked in the browser either way.

---

### One commit for the top-bar buttons and the dialog fixes?
**Context**: The buttons need the dialog's focus restore to meet R13, and the dialog's naming is tested through the top bar.
**Options considered**:
- A) One step for both, about 187 lines with Reload.
- B) Separate steps for the dialog and the buttons.

**Decision**: A. Focus return only works with both in place, and the step stays well under 500 lines.

---

### Name Reload by `aria-label`, `title`, or both?
**Context**: Reload shows only an icon. A `title` alone also names the button, so a test that looks Reload up by name cannot tell whether `aria-label` is there.
**Options considered**:
- A) Both, as Hurricane does, with the test asserting the `aria-label` attribute as well as the name.
- B) `title` alone.

**Decision**: A. Kiley asked for the Geo apps to match, and the name comes from the attribute meant for it rather than the tooltip. Asserting the attribute makes removing it fail a test.

---

### Reload in the button step or its own step?
**Context**: Reload's change is a few lines in the same files, button reset and ring as Share and About.
**Options considered**:
- A) In the button and dialog step.
- B) A step of its own.

**Decision**: A. The three top-bar buttons share one reset rule, one ring and one Tab order, and the Tab-order tests count Reload's stop.

---

### Where does the focus-ring rule live?
**Context**: The top-bar buttons and the dialog's Close button both need a ring, with different offsets.
**Options considered**:
- A) A `focusRing($offset)` mixin in `geohazard-components/common.scss`.
- B) The outline written out in each rule.

**Decision**: A. One place holds the ring's width and color, so the two cannot drift.

---

### Name the dialog with `aria-label` or `aria-labelledby`?
**Context**: `aria-labelledby` needs an id on the `<h2>`, and `React.useId` shifts the react-tabs ids the Cypress page objects hardcode.
**Options considered**:
- A) `aria-label={title}` on the paper through `PaperProps`.
- B) `aria-labelledby` with an id from a module-level counter.
- C) `useId`, and rewrite the Cypress page objects to find tabs by role and name.

**Decision**: A, confirmed by Doug on 2026-11-18. The accessible name is the title either way, A adds no id machinery, and C would fix brittle selectors this story did not create.
