/**
 * Whether the packages are live on npm. While false the install snippet
 * shows a pre-release notice; the commands themselves are already the
 * post-release ones.
 */
export const RELEASED = false;

export const GITHUB_URL = "https://github.com/Munawarhussain729/uniskin";

export const ADAPTERS = ["default", "shadcn", "daisyui"] as const;
export type AdapterName = (typeof ADAPTERS)[number];
