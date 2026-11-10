export const GITHUB_URL = "https://github.com/Munawarhussain729/uniskin";

export const ADAPTERS = ["default", "shadcn", "daisyui"] as const;
export type AdapterName = (typeof ADAPTERS)[number];
