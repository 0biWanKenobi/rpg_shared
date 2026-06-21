<script lang="ts">
	import type { Snippet } from "svelte";
	import type { SvelteHTMLElements } from "svelte/elements";

	type ElementTag = keyof SvelteHTMLElements;

	type Props = {
		as?: ElementTag;
		onClick?: ((event: MouseEvent) => void) | undefined;
		children?: Snippet;
		class?: string;
	};

	const interactiveElements = new Set<ElementTag>([
		"a",
		"button",
		"input",
		"option",
		"select",
		"summary",
		"textarea",
	]);

	let {
		as = "div",
		onClick,
		children,
		class: className = "",
	}: Props = $props();

	const isKeyboardClickable = (event: KeyboardEvent) =>
		event.key === "Enter" || event.key === " ";

	function handleKeyDown(event: KeyboardEvent) {
		if (!onClick || interactiveElements.has(as) || !isKeyboardClickable(event)) return;

		event.preventDefault();
		onClick(event as unknown as MouseEvent);
	}

	const needsA11yShim = $derived(!!onClick && !interactiveElements.has(as));
</script>

<svelte:element
	this={as}
	class={className}
	onclick={onClick}
	onkeydown={needsA11yShim ? handleKeyDown : undefined}
	role={needsA11yShim ? "button" : undefined}
	tabindex={needsA11yShim ? 0 : undefined}
>
	{@render children?.()}
</svelte:element>
