import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import type { ReactElement } from "react";

// These component-boundary tests run without a DOM or a real auth provider.
// Hook setters and the navigation/provider ports are fakes; browser interaction
// and Supabase confirmation still require a separate end-to-end test.
const mocks = vi.hoisted(() => ({
  setters: [] as Array<ReturnType<typeof vi.fn>>,
  initialValues: [] as unknown[],
  signUp: vi.fn(),
  push: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const setter = vi.fn();
      mocks.setters.push(setter);
      const value = mocks.initialValues.length ? mocks.initialValues.shift() : initial;
      return [value, setter];
    },
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/auth-actions", () => ({ signUpAction: mocks.signUp }));
// Vite's test runner does not load the Next.js tsconfig alias automatically.
vi.mock("@/components/auth/auth-form", async () => import("../src/components/auth/auth-form"));
vi.mock("@/components/ui/button", () => ({ Button: "button" }));
vi.mock("@/components/ui/input", () => ({ Input: "input" }));
vi.mock("@/components/ui/label", () => ({ Label: "label" }));

import { AuthForm } from "../src/components/auth/auth-form";
import { SignupForm } from "../src/components/auth/signup-form";

type SignupElement = ReactElement<{
  onSubmit: (values: { email: string; password: string }) => Promise<{
    ok: boolean;
    errorMessage?: string;
    navigate?: boolean;
  }>;
  onSuccessNavigateTo: (target: string) => void;
}>;
type FormElement = ReactElement<{ onSubmit: (event: { preventDefault: () => void }) => Promise<void> }>;

function elementText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(elementText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return elementText(node.props.children);
  return "";
}

beforeEach(() => {
  // Vitest uses classic JSX here; Next's production compiler uses automatic JSX.
  vi.stubGlobal("React", React);
  mocks.setters.length = 0;
  mocks.initialValues.length = 0;
  mocks.signUp.mockReset();
  mocks.push.mockReset();
});

afterAll(() => vi.unstubAllGlobals());

describe("signup confirmation state", () => {
  it("shows the pending-email state and explicitly suppresses navigation", async () => {
    mocks.signUp.mockResolvedValue({ ok: true, sessionActive: false });
    const component = SignupForm({ next: "/dashboard/setup" }) as SignupElement;
    const result = await component.props.onSubmit({ email: "person@example.test", password: "test-password" });

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "person@example.test",
      password: "test-password",
      next: "/dashboard/setup",
    });
    expect(mocks.setters[0]).toHaveBeenCalledWith("person@example.test");
    expect(result).toEqual({ ok: true, navigate: false });
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("keeps a pending signup on the confirmation state through the form boundary", async () => {
    mocks.initialValues.push(null, "person@example.test", "test-password", false, null);
    mocks.signUp.mockResolvedValue({ ok: true, sessionActive: false });
    const signup = SignupForm({ next: "/dashboard/setup" }) as SignupElement;
    const form = AuthForm({
      submitLabel: "Create account",
      pendingLabel: "Creating account…",
      next: "/dashboard/setup",
      onSubmit: signup.props.onSubmit,
      onSuccessNavigateTo: signup.props.onSuccessNavigateTo,
    }) as FormElement;
    await form.props.onSubmit({ preventDefault: vi.fn() });

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "person@example.test",
      password: "test-password",
      next: "/dashboard/setup",
    });
    expect(mocks.setters[0]).toHaveBeenCalledWith("person@example.test");
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("renders the confirmation status without promising delivery", () => {
    mocks.initialValues.push("person@example.test");
    const component = SignupForm({ next: "/dashboard" }) as ReactElement<{ role: string }>;
    expect(component.type).toBe("div");
    expect(component.props.role).toBe("status");
    const text = elementText(component);
    expect(text).toContain("If confirmation is required");
    expect(text).toContain("person@example.test");
    expect(text).toContain("Back to sign in");
    expect(text).not.toContain("We sent a confirmation");
  });

  it("permits navigation when signup created an active session", async () => {
    mocks.signUp.mockResolvedValue({ ok: true, sessionActive: true });
    const component = SignupForm({ next: "/dashboard/setup" }) as SignupElement;
    const result = await component.props.onSubmit({ email: "person@example.test", password: "test-password" });

    expect(result).toEqual({ ok: true, sessionActive: true });
    component.props.onSuccessNavigateTo("/dashboard/setup");
    expect(mocks.push).toHaveBeenCalledWith("/dashboard/setup");
  });

  it("preserves provider failure instead of showing confirmation", async () => {
    mocks.signUp.mockResolvedValue({ ok: false, errorMessage: "Please try again." });
    const component = SignupForm({ next: "/dashboard" }) as SignupElement;
    await expect(component.props.onSubmit({ email: "person@example.test", password: "test-password" }))
      .resolves.toEqual({ ok: false, errorMessage: "Please try again." });
    expect(mocks.setters[0]).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe("auth form navigation", () => {
  it("does not navigate when a successful submit explicitly says to stay", async () => {
    const navigate = vi.fn();
    const component = AuthForm({
      submitLabel: "Create account",
      pendingLabel: "Creating account…",
      next: "/dashboard",
      onSubmit: async () => ({ ok: true, navigate: false }),
      onSuccessNavigateTo: navigate,
    }) as FormElement;
    const preventDefault = vi.fn();
    await component.props.onSubmit({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("navigates for a normal successful submit", async () => {
    const navigate = vi.fn();
    const component = AuthForm({
      submitLabel: "Sign in",
      pendingLabel: "Signing in…",
      next: "/dashboard",
      onSubmit: async () => ({ ok: true }),
      onSuccessNavigateTo: navigate,
    }) as FormElement;
    await component.props.onSubmit({ preventDefault: vi.fn() });
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("revalidates the target immediately before navigation", async () => {
    const navigate = vi.fn();
    const component = AuthForm({
      submitLabel: "Sign in",
      pendingLabel: "Signing in…",
      next: "/.//attacker.example/path",
      onSubmit: async () => ({ ok: true }),
      onSuccessNavigateTo: navigate,
    }) as FormElement;
    await component.props.onSubmit({ preventDefault: vi.fn() });
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("reports a failed submit instead of navigating", async () => {
    const navigate = vi.fn();
    const component = AuthForm({
      submitLabel: "Sign in",
      pendingLabel: "Signing in…",
      next: "/dashboard",
      onSubmit: async () => ({ ok: false, errorMessage: "Incorrect credentials." }),
      onSuccessNavigateTo: navigate,
    }) as FormElement;
    await component.props.onSubmit({ preventDefault: vi.fn() });
    expect(navigate).not.toHaveBeenCalled();
    expect(mocks.setters[3]).toHaveBeenCalledWith("Incorrect credentials.");
  });

  it("reports an unexpected submission failure instead of navigating", async () => {
    const navigate = vi.fn();
    const component = AuthForm({
      submitLabel: "Sign in",
      pendingLabel: "Signing in…",
      next: "/dashboard",
      onSubmit: async () => { throw new Error("provider detail must not leak"); },
      onSuccessNavigateTo: navigate,
    }) as FormElement;
    await component.props.onSubmit({ preventDefault: vi.fn() });
    expect(navigate).not.toHaveBeenCalled();
    expect(mocks.setters[3]).toHaveBeenCalledWith(
      "Could not reach the authentication service. Check your connection and retry.",
    );
  });
});
