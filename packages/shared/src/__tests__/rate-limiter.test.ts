import { describe, it, expect } from "vitest";
import { RateLimiter } from "../rate-limiter.js";

describe("RateLimiter", () => {
  it("allows immediate requests within budget", async () => {
    const limiter = new RateLimiter(10);
    const start = Date.now();

    for (let i = 0; i < 5; i++) {
      await limiter.acquire();
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it("throttles when budget is exhausted", async () => {
    const limiter = new RateLimiter(2);
    const start = Date.now();

    // Exhaust the 2 tokens
    await limiter.acquire();
    await limiter.acquire();

    // Third should wait
    await limiter.acquire();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(400);
  });
});
