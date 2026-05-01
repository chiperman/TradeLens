import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a primary action", () => {
    render(<Button>同步长桥</Button>);

    expect(screen.getByRole("button", { name: "同步长桥" })).toBeInTheDocument();
  });
});
