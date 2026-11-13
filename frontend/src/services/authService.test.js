import { afterEach, describe, expect, it, vi } from "vitest";
import { authService } from "./authService";
import { todoService } from "./todoService";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockFetch(body, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("JWT frontend service tests", () => {
  it("login posts email and password and receives JWT", async () => {
    const fetchMock = mockFetch({ token: "example-jwt", user: { name: "Alice" } });
    const result = await authService.login("alice@example.com", "password123!");
    expect(result.token).toBe("example-jwt");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "alice@example.com",
          password: "password123!",
        }),
      })
    );
  });

  it("getMe includes the bearer token", async () => {
    const fetchMock = mockFetch({ user: { name: "Alice" } });
    await authService.getMe("sample-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/auth/me",
      expect.objectContaining({
        headers: { Authorization: "Bearer sample-token" },
      })
    );
  });

  it("Todo requests include the bearer token", async () => {
    const fetchMock = mockFetch([]);
    await todoService.getAll("sample-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/todos",
      expect.objectContaining({
        headers: { Authorization: "Bearer sample-token" },
      })
    );
  });

  it("Todo creation includes JSON body and JWT", async () => {
    const fetchMock = mockFetch({ _id: "1", title: "Study testing" }, 201);
    await todoService.create("Study testing", "sample-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/todos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "Study testing" }),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sample-token",
        },
      })
    );
  });

  it("login surfaces backend error messages", async () => {
    mockFetch({ message: "Invalid credentials" }, 401);
    await expect(authService.login("x@y.com", "bad"))
      .rejects.toThrow("Invalid credentials");
  });

  it("Todo requests fail without a token before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(todoService.getAll(null))
      .rejects.toThrow("Please log in first");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});