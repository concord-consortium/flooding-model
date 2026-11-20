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
