import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./dialog";

describe("Dialog component", () => {
  it("renders Material UI Dialog component", () => {
    render(<Dialog open={true} onClose={jest.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("is a modal dialog named by its title", () => {
    render(<Dialog open={true} onClose={jest.fn()} title="About: Test" />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("About: Test");
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
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
});
