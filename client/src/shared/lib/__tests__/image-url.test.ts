import { describe, it, expect } from "vitest";
import { getImageUrl } from "../image-url";

describe("getImageUrl", () => {
  it("возвращает placeholder для null", () => {
    expect(getImageUrl(null)).toBe("/placeholder-recipe.svg");
  });

  it("возвращает placeholder для undefined", () => {
    expect(getImageUrl(undefined)).toBe("/placeholder-recipe.svg");
  });

  it("не изменяет https URL", () => {
    expect(getImageUrl("https://example.com/img.png")).toBe(
      "https://example.com/img.png",
    );
  });

  it("не изменяет http URL", () => {
    expect(getImageUrl("http://example.com/img.png")).toBe(
      "http://example.com/img.png",
    );
  });

  it("не изменяет путь начинающийся с /uploads/", () => {
    expect(getImageUrl("/uploads/photo.png")).toBe("/uploads/photo.png");
  });

  it("добавляет / к uploads/ без слэша", () => {
    expect(getImageUrl("uploads/photo.png")).toBe("/uploads/photo.png");
  });

  it("возвращает прочие значения как есть", () => {
    expect(getImageUrl("/some/other/path.jpg")).toBe("/some/other/path.jpg");
  });
});
