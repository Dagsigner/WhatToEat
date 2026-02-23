import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../client";
import { fetchProfile, updateProfile } from "../users";

vi.mock("../client", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchProfile", () => {
  it("вызывает GET /users/me", async () => {
    const mockProfile = { id: "1", tg_id: 123, tg_username: "test" };
    vi.mocked(api.get).mockResolvedValue({ data: mockProfile });

    const result = await fetchProfile();

    expect(api.get).toHaveBeenCalledWith("/users/me");
    expect(result).toEqual(mockProfile);
  });
});

describe("updateProfile", () => {
  it("вызывает PATCH /users/me с body", async () => {
    const body = { first_name: "Иван" };
    const mockProfile = { id: "1", tg_id: 123, first_name: "Иван" };
    vi.mocked(api.patch).mockResolvedValue({ data: mockProfile });

    const result = await updateProfile(body);

    expect(api.patch).toHaveBeenCalledWith("/users/me", body);
    expect(result).toEqual(mockProfile);
  });
});
