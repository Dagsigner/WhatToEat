import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../client";
import { fetchCategories } from "../categories";

vi.mock("../client", () => ({
  api: {
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchCategories", () => {
  it("вызывает GET /categories без параметров", async () => {
    const mockData = [{ id: "1", title: "Супы", is_active: true, recipes_count: 5 }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await fetchCategories();

    expect(api.get).toHaveBeenCalledWith("/categories", {
      params: undefined,
    });
    expect(result).toEqual(mockData);
  });

  it("вызывает GET /categories с query", async () => {
    const mockData = [{ id: "1", title: "Суп", is_active: true, recipes_count: 3 }];
    vi.mocked(api.get).mockResolvedValue({ data: mockData });

    const result = await fetchCategories("суп");

    expect(api.get).toHaveBeenCalledWith("/categories", {
      params: { query: "суп" },
    });
    expect(result).toEqual(mockData);
  });
});
