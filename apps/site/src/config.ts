export const GITHUB_URL = "https://github.com/Munawarhussain729/uniskin";

export const ADAPTERS = ["default", "shadcn", "daisyui", "bootstrap", "flowbite", "radix"] as const;
export type AdapterName = (typeof ADAPTERS)[number];
