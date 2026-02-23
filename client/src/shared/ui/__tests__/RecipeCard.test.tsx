import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecipeCard } from "../RecipeCard";
import type { RecipeListItem } from "@/shared/types/recipe";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockRecipe: RecipeListItem = {
  id: "recipe-1",
  slug: "test-recipe",
  title: "Борщ классический",
  photo_url: "/uploads/borsch.jpg",
  prep_time: 20,
  cook_time: 40,
  difficulty: "medium",
  servings: "4",
  is_favorited: false,
  is_in_history: false,
};

describe("RecipeCard vertical (default)", () => {
  it("рендерит название, время и сложность", () => {
    render(<RecipeCard recipe={mockRecipe} />);

    expect(screen.getByText("Борщ классический")).toBeInTheDocument();
    expect(screen.getByText("1 ч · Средне")).toBeInTheDocument();
  });

  it("ссылка ведёт на /recipes/{id}", () => {
    render(<RecipeCard recipe={mockRecipe} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/recipes/recipe-1");
  });

  it("клик по кнопке избранного вызывает onFavoriteToggle", () => {
    const onToggle = vi.fn();
    render(<RecipeCard recipe={mockRecipe} onFavoriteToggle={onToggle} />);

    const btn = screen.getByRole("button");
    fireEvent.click(btn);

    expect(onToggle).toHaveBeenCalledWith("recipe-1", false);
  });
});

describe("RecipeCard horizontal", () => {
  it("рендерит название и время", () => {
    render(<RecipeCard recipe={mockRecipe} variant="horizontal" />);

    expect(screen.getByText("Борщ классический")).toBeInTheDocument();
    expect(screen.getByText("1 ч")).toBeInTheDocument();
  });
});
