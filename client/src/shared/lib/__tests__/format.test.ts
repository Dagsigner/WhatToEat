import { describe, it, expect } from "vitest";
import { formatMinutes, formatDifficulty, formatDate } from "../format";

describe("formatMinutes", () => {
  it("возвращает минуты, если < 60", () => {
    expect(formatMinutes(30)).toBe("30 мин");
  });

  it("возвращает 0 мин для нуля", () => {
    expect(formatMinutes(0)).toBe("0 мин");
  });

  it("возвращает только часы, если кратно 60", () => {
    expect(formatMinutes(60)).toBe("1 ч");
    expect(formatMinutes(120)).toBe("2 ч");
  });

  it("возвращает часы и минуты", () => {
    expect(formatMinutes(90)).toBe("1 ч 30 мин");
    expect(formatMinutes(150)).toBe("2 ч 30 мин");
  });
});

describe("formatDifficulty", () => {
  it("переводит известные значения", () => {
    expect(formatDifficulty("easy")).toBe("Легко");
    expect(formatDifficulty("medium")).toBe("Средне");
    expect(formatDifficulty("hard")).toBe("Сложно");
  });

  it("возвращает исходное значение для неизвестного ключа", () => {
    expect(formatDifficulty("unknown")).toBe("unknown");
  });
});

describe("formatDate", () => {
  it("форматирует ISO строку в русскую дату", () => {
    const result = formatDate("2024-01-15T12:00:00Z");
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });
});
