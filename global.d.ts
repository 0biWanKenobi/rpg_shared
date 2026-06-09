declare module "*.css";

declare module '*.svelte' {
    import type { Component } from 'svelte';
    // This forces TypeScript to view every .svelte file as a Svelte 5 Component function,
    // rather than the Svelte 4 legacy SvelteComponent class.
    const component: Component<any, any, any>;
    export default component;
}