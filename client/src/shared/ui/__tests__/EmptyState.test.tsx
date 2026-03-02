import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("рендерит title и description", () => {
    render(<EmptyState title="Пусто" description="Ничего не найдено" />);

    expect(screen.getByText("Пусто")).toBeInTheDocument();
    expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
  });

  it("рендерит дефолтную иконку (svg), если не передана", () => {
    const { container } = render(<EmptyState title="Пусто" />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("рендерит переданную иконку", () => {
    render(<EmptyState title="Пусто" icon={<span data-testid="custom-icon">!</span>} />);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("не рендерит description, если не передан", () => {
    render(<EmptyState title="Пусто" />);

    expect(screen.queryByText("Ничего не найдено")).not.toBeInTheDocument();
  });
});
