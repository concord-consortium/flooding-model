# Implementation Plan: Terms of Use Link and Licensing Copy for Flood Explorer

**Jira**: https://concord-consortium.atlassian.net/browse/FM-5
**Requirements Spec**: [requirements.md](requirements.md)
**Status**: **In Development**

## Implementation Plan

Three steps, each its own commit: the CI action upgrade (R16), the license copy in both dialogs (R1 to R7, R15's copy tests and its 12px Cypress test), and the Reload, Share and About buttons with the labeled dialog (R10 to R13, R15's top-bar and dialog tests and its Tab-order Cypress test). No dependency or lockfile changes: `@testing-library/user-event` 14.4.3 is already a devDependency. R8, R9 and R14 need no code: no surface is added, nothing hides the top bar, and the about text, Share's textareas and citation, what Reload does and MUI's height cap are untouched. R17 is Kiley's review of the branch deploy.

All code below was built on master as throwaway code and run before this plan was written (see Verification). Use Node 20, as CI does: `npm ci --legacy-peer-deps`, `npx jest`, `npm run lint`, and `npx cypress run` against `npm start`.

### Move CI's Cypress action to v7

**Summary**: R16. One line in `.github/workflows/ci.yml`, first on the branch and alone in its commit, so the first push runs Cypress on an action that works on GitHub's current runner, and a CI problem bisects to this commit rather than to the app change.

**Files affected**:
- `.github/workflows/ci.yml`: `cypress-io/github-action@v6` to `@v7`.

**Estimated diff size**: 1 line.

```yaml
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: cypress-io/github-action@v7
        with:
          install-command: npm ci --legacy-peer-deps
          start: npm start
          wait-on: 'http://localhost:8080'
```

No other input changes: v7 accepts every input the job passes (`install-command`, `start`, `wait-on`, `record`, `parallel`), and its breaking change is the action's own runtime moving from Node 20 to Node 24. The `actions/setup-node` step before it keeps `npm ci` and the dev server on Node 20.

---

### Show the license copy in About and Share

**Summary**: R1 to R7, R15's copy tests and its 12px Cypress test. A new `src/components/license/` folder holds the link constants, an `ExternalLink` component and the `LicenseCopy` component, which replaces `<Copyright />` at the end of both dialog contents. `Copyright` is deleted.

**Files affected**:
- `src/components/license/license-constants.ts` (new): the four link targets.
- `src/components/license/external-link.tsx` and `external-link.scss` (new): a new-tab link with the hidden hint.
- `src/components/license/license-copy.tsx` and `license-copy.scss` (new): the copy.
- `src/components/license/license-copy.test.tsx` (new): 12 tests, six each for About and Share.
- `cypress/e2e/license-copy.cy.ts` (new): 2 tests, the copyright line's size in each dialog.
- `src/components/about-dialog-content.tsx` and `share-dialog-content.tsx`: `<Copyright />` to `<LicenseCopy />`.
- `src/geohazard-components/top-bar/copyright.tsx`: deleted.

**Estimated diff size**: ~165 lines (134 in the new folder, 14 in the Cypress spec, 8 changed, 9 deleted), 93 of them tests.

`license-constants.ts`, identical to hurricane-model's apart from the repo in the MIT URL:

```ts
export const kMitLicenseUrl = "https://github.com/concord-consortium/flooding-model/blob/master/LICENSE";
export const kTermsOfUseUrl = "https://concord.org/terms-of-use/";
export const kLicensingUrl = "https://concord.org/licensing";
export const kLicensingEmail = "licensing@concord.org";
```

`external-link.tsx`. The props type omits `target` and `rel`, and the spread comes first, so no caller can weaken either:

```tsx
import React, { AnchorHTMLAttributes, ReactNode } from "react";
import css from "./external-link.scss";

interface IProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> {
  href: string;
  children: ReactNode;
}

// A link that opens in a new tab and tells screen-reader users that it does.
export const ExternalLink = ({ href, children, ...others }: IProps) => (
  <a {...others} href={href} target="_blank" rel="noopener noreferrer">
    {children}
    <span className={css.visuallyHidden}> (opens in a new tab)</span>
  </a>
);
```

`external-link.scss`:

```scss
.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

`license-copy.tsx`. `data-testid` follows this repo's convention (HURR-70's `data-test` is hurricane-model's); the curly apostrophe is U+2019:

```tsx
import React from "react";
import { ExternalLink } from "./external-link";
import { kLicensingEmail, kLicensingUrl, kMitLicenseUrl, kTermsOfUseUrl } from "./license-constants";
import css from "./license-copy.scss";

export const LicenseCopy = () => (
  <div data-testid="license-copy">
    <p>
      <strong>Flood Explorer is free, open-source software.</strong> The Flood Explorer source code is released
      under the <ExternalLink href={kMitLicenseUrl}>MIT License</ExternalLink>, so you’re welcome to use, modify, and
      build on it.
    </p>
    <p>
      <strong>Your use of Flood Explorer at flood.concord.org</strong> is governed by
      our <ExternalLink href={kTermsOfUseUrl}>Terms of Use</ExternalLink>. The hosted version is free for
      non-commercial use; commercial use requires a separate written agreement. For more information,
      visit <ExternalLink href={kLicensingUrl}>concord.org/licensing</ExternalLink> or
      contact <a href={`mailto:${kLicensingEmail}`}>{kLicensingEmail}</a>.
    </p>
    <p className={css.copyright}>© {new Date().getFullYear()} The Concord Consortium, Inc.</p>
  </div>
);
```

`license-copy.scss`, the 12px Kiley set for every Geo app (R2). No underline rule: the browser's default link style already underlines the links (R7), and nothing in the app resets it.

```scss
.copyright {
  font-size: 12px;
}
```

In `about-dialog-content.tsx` and `share-dialog-content.tsx`, the import and the last child change:

```tsx
import { LicenseCopy } from "./license/license-copy";
// ...
    <LicenseCopy />
  </div>
);
```

`license-copy.test.tsx`. It renders the real dialog contents, so dropping `<LicenseCopy />` from either fails it. The repo's `plugin:testing-library/react` rules forbid direct DOM access (`querySelectorAll`, `nextElementSibling`), so paragraphs are found with a text matcher on the element's tag and the bold lead-ins with `toContainHTML`; the tsconfig's ES5 target rules out spreading a `NodeList`, which the matcher also avoids. "Last block" is checked as "the dialog's last paragraph is the copyright line, inside the copy", which fails when any paragraph follows the copy (Share's citation moved after it, for one).

```tsx
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { AboutDialogContent } from "../about-dialog-content";
import { ShareDialogContent } from "../share-dialog-content";

const webLinks = [
  ["MIT License", "https://github.com/concord-consortium/flooding-model/blob/master/LICENSE"],
  ["Terms of Use", "https://concord.org/terms-of-use/"],
  ["concord.org/licensing", "https://concord.org/licensing"]
];

const isParagraph = (_content: string, element: Element | null) => element?.tagName === "P";

describe.each([
  ["About", AboutDialogContent],
  ["Share", ShareDialogContent]
])("license copy in the %s dialog", (_name, Content) => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2031-03-04T12:00:00Z") });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("links the MIT License, Terms of Use and licensing page in a new tab", () => {
    render(<Content />);
    const copy = within(screen.getByTestId("license-copy"));
    expect(copy.getAllByRole("link")).toHaveLength(4);
    for (const [text, href] of webLinks) {
      const link = copy.getByRole("link", { name: `${text} (opens in a new tab)` });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("links the licensing email in the same tab", () => {
    render(<Content />);
    const mail = within(screen.getByTestId("license-copy")).getByRole("link", { name: "licensing@concord.org" });
    expect(mail).toHaveAttribute("href", "mailto:licensing@concord.org");
    expect(mail).not.toHaveAttribute("target");
    expect(mail).not.toHaveAttribute("rel");
  });

  it("shows the approved copy and the current year", () => {
    render(<Content />);
    const copy = screen.getByTestId("license-copy");
    const paragraphs = within(copy).getAllByText(isParagraph).map(p => p.textContent?.replace(/\s+/g, " ").trim());
    expect(paragraphs).toEqual([
      "Flood Explorer is free, open-source software. The Flood Explorer source code is released under " +
      "the MIT License (opens in a new tab), so you’re welcome to use, modify, and build on it.",
      "Your use of Flood Explorer at flood.concord.org is governed by our Terms of Use (opens in a new " +
      "tab). The hosted version is free for non-commercial use; commercial use requires a separate written " +
      "agreement. For more information, visit concord.org/licensing (opens in a new tab) or contact " +
      "licensing@concord.org.",
      "© 2031 The Concord Consortium, Inc."
    ]);
    expect(copy).toContainHTML("<strong>Flood Explorer is free, open-source software.</strong>");
    expect(copy).toContainHTML("<strong>Your use of Flood Explorer at flood.concord.org</strong>");
  });

  it("computes the copyright year when it renders", () => {
    jest.setSystemTime(new Date("2047-11-20T12:00:00Z"));
    render(<Content />);
    expect(screen.getByTestId("license-copy")).toHaveTextContent("© 2047 The Concord Consortium, Inc.");
  });

  it("is the last block in the dialog", () => {
    render(<Content />);
    const paragraphs = screen.getAllByText(isParagraph);
    expect(paragraphs[paragraphs.length - 1]).toHaveTextContent("© 2031 The Concord Consortium, Inc.");
    expect(screen.getByTestId("license-copy")).toContainElement(paragraphs[paragraphs.length - 1]);
  });

  it("drops the old Creative Commons copyright block", () => {
    render(<Content />);
    expect(document.body).not.toHaveTextContent(/Creative Commons|CC BY|All rights reserved/);
  });
});
```

`cypress/e2e/license-copy.cy.ts`. Jest maps `.scss` to `identity-obj-proxy`, so no style reaches jsdom and the size is checked in the real app. Putting the copyright line back to 0.8em computes 12.8px and fails both tests:

```ts
context("License copy", () => {
  beforeEach(() => {
    cy.visit("");
  });

  ["about", "share"].forEach(id => {
    it(`shows the copyright line at 12px in the ${id} dialog`, () => {
      cy.get(`[data-testid="${id}"]`).click();
      cy.get('[data-testid="license-copy"] p').last()
        .should("contain.text", "The Concord Consortium, Inc.")
        .and("have.css", "font-size", "12px");
    });
  });
});
```

---

### Make Reload, Share and About buttons and name the dialogs

**Summary**: R10 to R13, R15's top-bar and dialog tests and its Tab-order Cypress test. Reload, Share and About become `<button type="button">`s with today's look and an inset focus ring, in master's DOM order, which is already the on-screen order; Reload is named by `aria-label` with a matching `title`, as Hurricane's is; the dialog's title becomes an `<h2>` that names it, and its close icon moves into a named Close button that takes focus each time the dialog opens. MUI v4's existing focus trap, Esc handling and focus restore do the rest once the opener can hold focus.

**Files affected**:
- `src/geohazard-components/common.scss`: a `focusRing` mixin.
- `src/geohazard-components/top-bar/top-bar.tsx` and `top-bar.scss`: Reload, Share and About as buttons, Share and About focused on click.
- `src/geohazard-components/top-bar/dialog.tsx` and `dialog.scss`: labeled title, and a Close button focused on every open.
- `src/geohazard-components/top-bar/top-bar.test.tsx`: 9 tests, one for Reload and four each for Share and About.
- `cypress/e2e/top-bar.cy.ts` (new): 1 test, the buttons' Tab order against their on-screen order.
- `src/geohazard-components/top-bar/dialog.test.tsx`: 2 tests.

**Estimated diff size**: ~187 lines, 102 of them tests.

`common.scss` gains one mixin, appended after `$controlLabel`, so the top bar and the dialog draw the same ring (`#434343` on white, 9.89:1):

```scss
@mixin focusRing($offset: 2px) {
  &:focus-visible {
    outline: 2px solid $controlLabel;
    outline-offset: $offset;
  }
}
```

`top-bar.tsx`, the two open handlers and the three controls (`handleReload` is unchanged):

```tsx
  // macOS Safari and Firefox do not focus a button on click, so focus it here for the dialog to restore focus to on close.
  const handleShareOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus();
    setShareOpen(true);
    log("ShareDialogOpened");
  };
  const handleAboutOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus();
    setAboutOpen(true);
    log("AboutDialogOpened");
  };
```

```tsx
      <button
        type="button"
        data-testid="reload"
        className={css.textButton}
        aria-label="Reload"
        title="Reload"
        onClick={handleReload}
      >
        <RefreshIcon />
      </button>
      <span>
        <button type="button" data-testid="share" className={css.textButton} onClick={handleShareOpen}>
          Share
        </button>
        <button type="button" data-testid="about" className={css.textButton} onClick={handleAboutOpen}>
          About
        </button>
      </span>
```

`top-bar.scss`. Inside `.textButton`, the icon rule changes so Reload is as tall as Share and About (21px) and its ring fits inside the bar, while the icon stays where master draws it (see requirements.md, Top bar layout):

```scss
    // MUI's 24px icon, pulled in to the 21px height of Share and About so Reload's focus ring fits inside the bar.
    svg {
      display: block;
      margin: -1.5px 0;
    }
```

It replaces master's `svg { margin-top: 4px; }`. Then a new rule inside `.topBar`, after `.textButton`. It removes the browser's button styling so the buttons keep the spans' boxes, and draws the ring 2px inside the 21px button so no side falls outside the 22px bar. `.textButton`'s existing margins, cursor and hover color apply unchanged (its `:hover` rule outranks this one):

```scss
  button.textButton {
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    @include focusRing(-2px);
  }
```

`dialog.tsx`. The title becomes an `<h2>`, and the dialog is named by the same `title` through `PaperProps`, since MUI v4 puts `role="dialog"` on the paper and spreads `PaperProps` onto it. It deliberately takes no generated id: React 18's client `useId` numbers ids from one counter in mount order, both dialogs mount before the side panel's tabs, and the Cypress page objects (`cypress/support/elements/maps.ts` and `bottombarcontainer.ts`) select those tabs as `#tab\:r1\:0` and `#panel\:r1\:N`; a `useId` here renumbered them to `:r3:` and failed 7 Cypress tests in `maps.cy.ts` and `timeperiod.cy.ts`. Close is focused from the transition's `onEntering` (R13): left alone, MUI v4 focuses its container `div` outside the `role="dialog"` paper, so a screen reader may not announce the title. `autoFocus` is not enough, because MUI keeps a closing dialog mounted through its exit fade and a reopen during the fade does not remount Close; `onEntering` runs on every enter, and MUI's trap leaves focus that is already inside alone. It goes through `TransitionProps`, since the bare `onEntering` prop is deprecated in 4.12:

```tsx
import * as React from "react";
import MuiDialog from "@material-ui/core/Dialog";
import CloseIcon from "@material-ui/icons/Close";
import css from "./dialog.scss";

interface IProps {
  onClose: () => void;
  open: boolean;
  title?: string;
  children?: JSX.Element;
}

export const Dialog: React.FC<IProps> = ({ onClose, open, title, children }) => {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  return (
    <MuiDialog
      onClose={onClose}
      open={open}
      maxWidth="lg"
      PaperProps={{ "aria-label": title }}
      TransitionProps={{ onEntering: () => closeRef.current?.focus() }}
    >
      <div className={css.dialogBody}>
        { title && <h2 className={css.title}>{ title }</h2> }
        <button ref={closeRef} type="button" aria-label="Close" className={css.closeButton} onClick={onClose}>
          <CloseIcon />
        </button>
        <div className={css.content}>{ children }</div>
      </div>
    </MuiDialog>
  );
};
```

`dialog.scss`: `.title` gains `margin: 0` so the `<h2>` keeps the `<div>`'s box, and `.closeButton` gains the button reset and the ring; `display: flex` keeps the button the icon's 24 × 24 box:

```scss
.title {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0;
}

.closeButton {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 0;
  border: none;
  background: none;
  display: flex;
  color: #797979;
  cursor: pointer;
  &:hover {
    color: $controlLabel;
  }
  @include focusRing;
}
```

`top-bar.test.tsx`: the import becomes `import { fireEvent, render, screen, waitFor } from "@testing-library/react";`, a `type User = ReturnType<typeof userEvent.setup>;` follows the imports (user-event 14.4.3 does not export its type), and a Reload `describe` and a `describe.each` for Share and About are added at the end of the outer `describe`. The existing Reload, Share and About tests select by `data-testid` and pass unchanged. Reload is the first Tab stop, Share the second and About the third. The Reload test stubs `window.location` as the file's two existing Reload tests do, and checks the reload itself, not only the click. user-event 14 turns Enter on a focused native button into a click in jsdom, so Enter is tested here, unlike SE-4. The click-without-focus cases start with focus on the body, use `fireEvent.click`, which does not move focus, and close by Esc and by Close (geo-common decision 7). The reopen test first asserts that the dialog is still mounted after Esc, so it cannot pass by reopening a dialog that has already left:

```tsx
  describe("Reload button keyboard access", () => {
    it("is the first Tab stop, named Reload with a matching tooltip, and reloads on Enter", async () => {
      const user = userEvent.setup();
      const reloadMock = jest.fn();
      Object.defineProperty(window, "location", {
        writable: true,
        value: { reload: reloadMock },
      });
      render(<TopBar projectName="Test" />);
      const reload = screen.getByRole("button", { name: "Reload" });
      expect(reload).toHaveAttribute("type", "button");
      // The title alone would also name it, so check the name's own attribute.
      expect(reload).toHaveAttribute("aria-label", "Reload");
      expect(reload).toHaveAttribute("title", "Reload");
      await user.tab();
      expect(reload).toHaveFocus();
      await user.keyboard("{Enter}");
      await waitFor(() => expect(reloadMock).toHaveBeenCalled());
    });
  });

  describe.each([
    { name: "Share", tabs: 2 },
    { name: "About", tabs: 3 }
  ])("$name button keyboard access", ({ name, tabs }) => {
    it("is a button reached by Tab that opens its dialog with Enter, focusing Close", async () => {
      const user = userEvent.setup();
      render(<TopBar projectName="Test" />);
      const button = screen.getByRole("button", { name });
      expect(button).toHaveAttribute("type", "button");
      for (let i = 0; i < tabs; i++) {
        await user.tab();
      }
      expect(button).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(await screen.findByRole("dialog")).toHaveAccessibleName(`${name}: Test`);
      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    });

    // fireEvent.click does not move focus, like a click in macOS Safari and Firefox.
    it.each([
      { closeWith: "Esc", close: (user: User) => user.keyboard("{Escape}") },
      { closeWith: "Close", close: (user: User) => user.click(screen.getByRole("button", { name: "Close" })) }
    ])("gets focus back when $closeWith closes the dialog after a click that did not focus it", async ({ close }) => {
      const user = userEvent.setup();
      render(<TopBar projectName="Test" />);
      const button = screen.getByRole("button", { name });
      expect(document.body).toHaveFocus();
      fireEvent.click(button);
      await screen.findByRole("dialog");
      await close(user);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(button).toHaveFocus();
    });

    it("focuses Close when reopened while the dialog is still closing", async () => {
      const user = userEvent.setup();
      render(<TopBar projectName="Test" />);
      const button = screen.getByRole("button", { name });
      await user.click(button);
      await user.keyboard("{Escape}");
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      await user.click(button);
      expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    });
  });
```

`dialog.test.tsx` gains `import userEvent from "@testing-library/user-event";` and two tests after the existing one:

```tsx
  it("is named by its title", () => {
    render(<Dialog open={true} onClose={jest.fn()} title="About: Test" />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("About: Test");
    expect(screen.getByRole("heading", { name: "About: Test" })).toBeInTheDocument();
  });

  it("closes with a Close button", async () => {
    const onClose = jest.fn();
    render(<Dialog open={true} onClose={onClose} title="About: Test" />);
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveAttribute("type", "button");
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
```

`cypress/e2e/top-bar.cy.ts`. Tab follows DOM order, which the Jest Tab tests pin, but jsdom has no layout, so only the real app can show that the DOM order is also left to right on screen, which is the mismatch Teale Fristoe found in Seismic. jQuery returns the matched buttons in document order. Swapping Share and About in the JSX fails it (and the Jest Tab tests); reversing them on screen with `flex-direction: row-reverse` on their `<span>` fails only this test:

```ts
context("Top bar", () => {
  beforeEach(() => {
    cy.visit("");
  });

  it("puts its buttons in Tab order from left to right", () => {
    cy.get('[data-testid="reload"], [data-testid="share"], [data-testid="about"]').then($buttons => {
      const buttons = $buttons.toArray();
      expect(buttons.map(b => b.getAttribute("data-testid"))).to.deep.equal(["reload", "share", "about"]);
      const lefts = buttons.map(b => b.getBoundingClientRect().left);
      expect(lefts[0]).to.be.lessThan(lefts[1]);
      expect(lefts[1]).to.be.lessThan(lefts[2]);
    });
  });
});
```

## Verification

Run on master with all three steps applied as throwaway code, then removed (Node 20, Chromium through Playwright):

- `npx jest`: 17 suites, 94 tests pass (71 on master, plus 12 copy tests, 9 top-bar tests and 2 dialog tests), with no "not wrapped in act(...)" warnings. The only console output is the existing "Interactive API is meant to be used in iframe" warning from `log()`.
- `npm run lint` clean, and `npx eslint` on the two new Cypress specs clean; `npm run lint:build` has 0 errors and 1 warning, an existing `console` call in `view-3d/use-show-coords-interaction.tsx`.
- The license-copy step alone (the button and dialog step not applied): `npx jest` 17 suites, 83 tests pass, `npm run lint` is clean, and `license-copy.cy.ts` passes 2 of 2, so it can be committed and reviewed by itself.
- Cypress 13 (Electron, every spec, against the dev server): 18 pass (master's 15 plus the 3 new) and 4 are pending, the snapshot tests that are `it.skip` on master. No existing Cypress spec or page object changes.
- Production build (`webpack --mode production`) compiles. `npx tsc --noEmit` reports 57 errors, all in `node_modules` type definitions and `view-3d/levees.tsx` and `terrain.tsx`, none in a file this plan touches; CI does not run `tsc`.
- Each test fails when the line it guards is broken: dropping `<LicenseCopy />` from About (5 fail) or Share (5), the year hardcoded as 2031, the pinned year (2; the current year, 6), a straight apostrophe (2), `rel="noopener"` only (2), no new-tab hint (4), the MIT URL on `main` (2), the mailto link through `ExternalLink` (4), a paragraph after the copy in Share (1), old text kept in About (1), no bold lead-in (2); Share back to a span (5), About back to a span (4), Share without `type` (1), About without `type` (1), Share's open handler not focusing it (2), About's (2), `disableRestoreFocus` on the dialog (4), no `aria-label` on the paper (3), no `onEntering` (4), `autoFocus` on Close in place of `onEntering` (2, the reopen tests), Close unnamed (7), Close doing nothing (3), Close without `type` (1); Reload back to a span (3), Reload without `aria-label` (1, by the explicit attribute check; without it the `title` still names the button and every test passes), Reload without `title` (1), Reload without `type` (1), Share and About swapped in the JSX (2 in Jest, 1 in Cypress). In Cypress: the copyright line back to 0.8em (2, computed 12.8px), and Share and About reversed on screen with `flex-direction: row-reverse` on their `<span>` (1; Jest has no layout and stays green).
- Browser, at 1000 × 800: Reload is a button at (11, 0.5, 24 × 21) with its icon at master's (11, -1, 24 × 24), named "Reload" with a "Reload" tooltip, and Enter on it reloads the page; Share (878.8, 0.5, 42.8 × 21) and About (937.7, 0.5, 46.3 × 21) are buttons in the same boxes as master's spans; all three are `#797979` at rest and `#434343` on hover; Tab reaches Reload, Share, then About, left to right, each with an inset ring whole on all four sides inside the 22px bar; Enter opens a dialog named "About: Flood Explorer" (with a level-2 heading of the same text), with focus on Close, inside the `role="dialog"` paper, showing its whole ring (Space opens it the same way; opened by a mouse click, Close takes focus without a ring); the side panel's tabs keep master's ids (`tab:r1:0` to `tab:r1:4`); the dialog's title (904 × 23 at x 48) and × (24 × 24 at x 936) keep master's sizes and their offsets from the paper's top (16px and 8px; MUI centers the paper, so their page y moves with its height); Tab stays in the dialog; Esc returns focus to About and Close returns it to Share; reopening 50ms after Esc, while the dialog is still fading out, puts focus on Close again; after a script `click()` with focus on the body (a click that does not focus the button), Esc, Close and a backdrop click each return focus to the button, for Share and About; the four copy links are underlined and the copyright line is 12px in both dialogs. About is 554px tall (459 on master) and Share 397px (302), neither scrolling; at 900 × 600 About reaches MUI's 536px cap and scrolls its 592px of content. In the Share dialog's own embed snippet (1000 × 800 iframe in a plain page) the app loads with its top bar, both dialogs are named, end with the copy and its four links, and return focus on Esc.
- Firefox (Playwright, 1000 × 800): the same button boxes (Reload's included), Reload's name, tooltip, ring and reload on Enter, Tab order, 12px copyright line, dialog name, focus on Close (reopen during the fade included), underlines and focus return (script `click()` then Esc, Close or backdrop included) as Chromium; About is 572px tall there. Neither browser logs a console error.

## Open Questions

### RESOLVED: Judgment call: keep or drop an explicit underline rule for the copy's links?
**Context**: HURR-70's `license-copy.scss` sets `text-decoration: underline` on the copy's links.

**Options considered**:
- A) Rely on the browser's default underline, which nothing in Flood resets (all four links measured underlined).
- B) Copy HURR-70's rule.

**Decision**: A. The rule would change nothing in Flood, and R7 is checked in the browser either way.

---

### RESOLVED: Judgment call: one commit for the top-bar buttons and the dialog fixes?
**Context**: The buttons need the dialog's focus restore to meet R13, and the dialog's naming is tested through the top bar.

**Options considered**:
- A) One step for both, ~187 lines with Reload.
- B) Separate steps for the dialog and the buttons.

**Decision**: A. Focus return (R13) only works with both in place, and the step stays well under 500 lines.

---

### RESOLVED: Judgment call: name Reload by `aria-label`, `title`, or both?
**Context**: Reload shows only an icon. Hurricane's Reload has `aria-label="Reload"` and `title="Reload"`. A `title` alone also gives the button the accessible name "Reload", so with both in place, a test that looks Reload up by name cannot tell whether `aria-label` is there.

**Options considered**:
- A) Both, as Hurricane does, with the Reload test asserting the `aria-label` attribute as well as the name.
- B) `title` alone, which names the button and shows the tooltip.

**Decision**: A. Kiley asked for the Geo apps to match, and the name then comes from the attribute meant for it rather than from the tooltip. Asserting the attribute is what makes removing it fail a test (Verification).

---

### RESOLVED: Judgment call: Reload in the button step or its own step?
**Context**: Reload's change is a few lines in `top-bar.tsx` and `top-bar.scss` plus one test, in the same files and the same button reset and ring as Share and About.

**Options considered**:
- A) In the button and dialog step, which becomes ~187 lines.
- B) A fourth step of its own.

**Decision**: A. The three top-bar buttons share one reset rule, one ring and one Tab order, the Tab-order tests count Reload's stop, and the step stays well under 500 lines.

---

### RESOLVED: Judgment call: where does the focus-ring rule live?
**Context**: The top-bar buttons and the dialog's Close button both need a ring, with different offsets.

**Options considered**:
- A) A `focusRing($offset)` mixin in `geohazard-components/common.scss`, which both files already import.
- B) The outline written out in each rule.

**Decision**: A. One place holds the ring's width and color, so the two cannot drift.

---

### RESOLVED: Judgment call: name the dialog with `aria-label` or `aria-labelledby`?
**Context**: R11 asks for each dialog to be named by its title. `aria-labelledby` needs an id on the `<h2>`; the obvious source, `React.useId`, shifts the ids react-tabs generates for the side panel, which the Cypress page objects hardcode (see the dialog step).

**Options considered**:
- A) `aria-label={title}` on the paper through `PaperProps`: the same string as the visible title, from the same prop, with no id.
- B) `aria-labelledby` with an id from a module-level counter outside React's `useId` sequence.
- C) `useId`, and rewrite the Cypress page objects to find tabs by role and name instead of generated id.

**Decision**: A, confirmed by Doug on 2026-11-18. It departs from Hurricane's `dialog.tsx`, which geo-common decision 7 names as the model, only in how the name is attached. The accessible name is the title either way, and A adds no id machinery and leaves the Cypress page objects as they are. C would fix brittle selectors this story did not create; it is left for a story about the Cypress suite.

## Self-Review

Roles: commit reviewer, test writer, operator (CI), senior engineer, lint and style reviewer. Each step was applied to master as throwaway code and run; findings that did not survive are not listed.

### Operator

#### RESOLVED: `useId` in the dialog broke 7 Cypress tests
The first draft named the dialog with `aria-labelledby` and an id from `React.useId`. Both dialogs mount before the side panel, so react-tabs' generated ids moved from `:r1:` to `:r3:`, and the Cypress page objects, which select `#tab\:r1\:0` and `#panel\:r1\:N`, failed 3 tests in `maps.cy.ts` and 4 in `timeperiod.cy.ts` (Jest stayed green, so only CI would have caught it). The dialog step now names the paper with `aria-label={title}` through `PaperProps`; Cypress passes 15/15 with 4 pending as on master, the tabs are back at `tab:r1:*`, and the dialog's accessible name is unchanged. Recorded as a judgment call above.

### Commit reviewer

#### RESOLVED: The button and dialog step's diff estimate was high
It said ~150 lines; built, it is 136 (66 of them tests). The estimates now match the built code, and the license step's breakdown is given.

### Held up

- Each step applies to master in order; the license step alone passes Jest 83/83 with lint clean, and all three pass Jest 94/94 with lint clean and no `act()` warnings.
- Every planned test fails under at least one mutation of the line it guards (Verification lists them all), including the relabeled dialog's (`aria-label` removed: 3 fail).
- The plan's code passes the repo's `plugin:testing-library/react` rules and compiles for the ES5 target; the planned comments describe the code as it stands.
- No dependency or lockfile change: user-event 14.4.3 and @testing-library/react 14 share one @testing-library/dom (9.3.0), so the user-event tests log no `act()` warnings, unlike TE-10's hoisted copy.
- R16: v7 keeps every input the job passes and runs on Node 24; the `setup-node` step keeps the app on Node 20.

### Self-review round 1

Roles: WCAG accessibility expert, MUI v4 engineer, test engineer, Kiley as acceptance reviewer, CI engineer. The plan was rebuilt on master and every stated number re-measured (Jest, lint, `lint:build`, `tsc`, production build, Cypress, eight of the listed mutations, and the Chromium boxes, heights, tab ids and underlines).

- Fixed: the license step's new-folder count was 133; the files total 134 lines.
- Fixed: Verification said focus lands inside the dialog on open. In Chromium, MUI v4 focuses its container `div` around the paper, outside the `role="dialog"` element, so a screen reader may not announce the title. Doug decided Close takes `autoFocus` (R13); rebuilt with it, Jest stays 93/93, lint is clean, Cypress stays 15 pass and 4 pending, removing `autoFocus` fails 2 tests, and Esc and Close still return focus to the opener.
- Held up: the copy matches geo-common word for word; v7's `action.yml` lists every input the job passes and runs on `node24`; `s3-deploy-action` strips `^[A-Za-z]{2,}-[0-9]+-`, so the branch URL in R17 is right.

### Self-review round 2

Roles: reader of the spec a year from now, commit and step reviewer, cross-browser reviewer (Chromium and Firefox through Playwright; no runnable WebKit), copy and legal reviewer, and a HURR-70 and geo-common consistency reviewer. The plan was rebuilt on master, its code checked line by line against the blocks above, and every number re-measured: Jest, lint, `lint:build`, `tsc`, the production build, Cypress, all 21 mutations, and the Chromium boxes, heights and tab ids on the branch and on master.

- Fixed: Close unnamed fails 5 tests, not 3, since the Enter tests also look up Close to check its focus.
- Fixed: the hardcoded-year mutation now names the year: hardcoding the pinned 2031 fails 2 tests, the current year 6.
- Fixed: the title and × boxes were the branch's page coordinates, not master's; master's About paper is shorter and centered lower. What matches master is their size, x and offset from the paper's top, and Verification and requirements.md now say so.
- Added: Firefox gives the same results as Chromium.
- Held up: the license step alone passes Jest 83/83 with lint clean; the copy matches CODAP's `V3.AboutDialog.*` strings and the story text apart from the curly apostrophe (decision 1); `license-constants.ts` and `ExternalLink` match HURR-70's apart from the repo name.

### Decision 7 revision (2026-11-19)

geo-common decision 7 was refined after TE-10's final review, and checked here on a throwaway build before the spec changed:
- A click that does not focus the button (Jest `fireEvent.click`; Chromium script `click()` with focus on the body or another control) already returned focus to it by Esc and by Close, because the open handlers focus their button. Removing those calls sent focus back to the body or the other control in all 8 cases.
- Reopening during the exit fade left focus on MUI's container in Jest and Chromium, because `autoFocus` only fires on mount. The dialog step now focuses Close from `TransitionProps.onEntering`, and the bare `onEntering` prop was rejected for its 4.12 deprecation error.
- The top-bar tests now cover Esc and Close after a click that does not focus the button, starting with focus on the body, and the reopen. Jest stays 93/93 (the top bar keeps 8 tests), lint and `lint:build` are unchanged, `tsc` reports 57 as before, Cypress stays 15 pass and 4 pending, and the 13 top-bar and dialog mutations were re-run.

### Kiley's review (2026-11-19)

Kiley's three changes were built on the throwaway plan and checked before the spec changed:
- Reload: master's span is 24 × 32 at (11, -5), so an inset ring would lose its top edge above the page. With the icon `display: block` and `margin: -1.5px 0`, the button is 24 × 21 and the icon stays at master's (11, -1) in Chromium and Firefox, with the whole ring inside the bar (screenshot). Removing `aria-label` alone first survived every test, since the `title` still names the button; the Reload test now asserts the attribute, and that mutation fails it.
- Copyright: 0.8em computed 12.8px; 12px computes 12px in both dialogs and browsers. Jest applies no Sass, so the check is a Cypress test.
- Tab order: master's top bar has no float or reordering, and its DOM order is Reload, Share, About, left to right, so nothing moves; a Cypress test fails if the DOM order and the screen order part.
- Jest 94/94, lint and `lint:build` unchanged, Cypress 18 pass and 4 pending, the license step alone still passes by itself, and all 18 top-bar and dialog mutations plus the three Cypress ones were run.
