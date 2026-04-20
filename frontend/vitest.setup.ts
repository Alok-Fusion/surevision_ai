import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserver);
vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0));
vi.stubGlobal("cancelAnimationFrame", (handle: number) => window.clearTimeout(handle));

