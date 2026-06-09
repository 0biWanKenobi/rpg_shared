<script lang="ts">
	import Modal from "../obsidian/Modal.svelte";
	import { Button } from "../base";

	type Props = {
		open?: boolean;
		title?: string;
		onClose?: (confirmed: boolean) => void;
	};

	let {
		open = $bindable(false),
		title = "Confirm",
		onClose,
	}: Props = $props();

	function close(wasConfirmed: boolean) {
		open = false;
		onClose?.(wasConfirmed);
	}
</script>

<Modal {title} bind:open onClose={() => close(false)} class="confirm-modal">
	<div class="confirm-modal-buttons">
		<Button text="Yes" warning onClick={() => close(true)} />
		<Button text="No" onClick={() => close(false)} />
	</div>
</Modal>

<style>
	.confirm-modal-buttons {
		display: flex;
		column-gap: 5px;
		justify-content: end;
	}
</style>
