import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../client";
import {
  fetchRecipes,
  fetchRecipeDetail,
  addFavorite,
  removeFavorite,
  addToHistory,
} from "../recipes";

vi.mock("../client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchRecipes", () => {
  it("вызывает GET /recipes с параметрами", async () => {
    const mockData = { items: [], total: 0, limit: 20, offset: 0 };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await fetchRecipes({ limit: 10, offset: 0 });

    expect(api.get).toHaveBeenCalledWith("/recipes", {
      params: { limit: 10, offset: 0 },
    });
    expect(result).toEqual(mockData);
  });

  it("вызывает GET /recipes без параметров по умолчанию", async () => {
    const mockData = { items: [], total: 0, limit: 20, offset: 0 };
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    await fetchRecipes();

    expect(api.get).toHaveBeenCalledWith("/recipes", { params: {} });
  });
});

describe("fetchRecipeDetail", () => {
  it("вызывает GET /recipes/{id}", async () => {
    const mockDetail = { id: "abc", title: "Test" };
    vi.mocked(api.get).mockResolvedValue({ data: mockDetail });

    const result = await fetchRecipeDetail("abc");

    expect(api.get).toHaveBeenCalledWith("/recipes/abc");
    expect(result).toEqual(mockDetail);
  });
});

describe("addFavorite", () => {
  it("вызывает POST /recipes/{id}/favorite", async () => {
    const mockResp = { id: "abc", is_favorited: true };
    vi.mocked(api.post).mockResolvedValue({ data: mockResp });

    const result = await addFavorite("abc");

    expect(api.post).toHaveBeenCalledWith("/recipes/abc/favorite");
    expect(result).toEqual(mockResp);
  });
});

describe("removeFavorite", () => {
  it("вызывает DELETE /recipes/{id}/favorite", async () => {
    const mockResp = { id: "abc", is_favorited: false };
    vi.mocked(api.delete).mockResolvedValue({ data: mockResp });

    const result = await removeFavorite("abc");

    expect(api.delete).toHaveBeenCalledWith("/recipes/abc/favorite");
    expect(result).toEqual(mockResp);
  });
});

describe("addToHistory", () => {
  it("вызывает POST /recipes/{id}/history", async () => {
    const mockResp = { id: "abc", is_in_history: true };
    vi.mocked(api.post).mockResolvedValue({ data: mockResp });

    const result = await addToHistory("abc");

    expect(api.post).toHaveBeenCalledWith("/recipes/abc/history");
    expect(result).toEqual(mockResp);
  });
});
