<script lang="ts">
	import { Portal } from "@jsrob/svelte-portal";
	import Icon from "../base/Icon.svelte";
    import Box from "../base/Box.svelte";

	type Props = {
		title?: string;
		children?: any;
		portalTarget?: HTMLElement;
		open?: boolean;
		class?: string
		onClose?: () => void
	};

	let {
		title = "",
		children,
		open = $bindable(false),
		class: className = "",
		onClose
	}: Props = $props();

	const closeModal = () => {
		open = false;
		onClose?.()
	};

	// support for Settings opening in separate window from Obsidian 1.13 onwards
	const document = globalThis.activeWindow?.activeDocument ?? globalThis.document;
    const portalTarget = document.querySelector(".modal.mod-settings")?.parentElement!
</script>

<Portal target={portalTarget ?? document.body}>
	{#if open}
		<Box class={className + " modal-container mod-dim"} onClick={closeModal}>
			<div class="modal-bg" style="opacity: 0.85;"></div>
			<Box class="modal" onClick={e => e.stopPropagation()}>
				<div class="modal-close-button mod-raised clickable-icon">
					<span role="button" tabindex="0" onkeypress={null} onclick={() => closeModal()} style="display: contents;">
						<Icon icon="x" />
					</span>
				</div>
				<div class="modal-header">
					<div class="modal-title">{title}</div>
				</div>
				<div class="modal-content">
					{@render children?.()}
				</div>
			</Box>
		</Box>
	{/if}
</Portal>
