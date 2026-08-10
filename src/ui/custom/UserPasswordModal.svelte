<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../base/Button.svelte";
    import Input from "../base/Input.svelte";
    import Modal from "../obsidian/Modal.svelte";
    import SettingItem from "../obsidian/SettingItem.svelte";
    import SettingItemGroup from "../obsidian/SettingItemGroup.svelte";


    type Props = {
        title: string,
        open: boolean,
        onReturn?: (v:string|undefined) => void,
        onCancel?: () => void
    }

    let {title, open = $bindable(false), onReturn, onCancel}: Props = $props();

    let inputValue = $state<string | undefined>('')



    onMount(() => {
        return () => onReturn?.(inputValue);
    })

    const onConfirm = (e: MouseEvent | KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if(!inputValue) return;
        onReturn?.(inputValue);
        inputValue = undefined;
    }

    const okBtnDisabled = $derived(!inputValue || inputValue.length == 0);
    const btnTooltip = $derived(!inputValue || inputValue.length == 0 ? "Please provide a password" : "");

</script>


<Modal
    bind:open
     onClose={() => {
        onReturn?.(inputValue);
        inputValue = undefined;
    }}
    onCancel={() => {
        onCancel?.();
        inputValue = undefined;
    }}
>
    <form class="pwd_form">
        <SettingItemGroup>
            <SettingItem name={title}>
                <Input type="password" onChange={v => inputValue=v} onEnter={e => onConfirm(e)}/>
            </SettingItem>
            <SettingItem>
                <div class="confirm-modal-buttons">
                    <Button cta text="Ok" onClick={e => onConfirm(e)} disabled={okBtnDisabled} tooltip={btnTooltip}/>
                    <Button text="Cancel" onClick={() => {
                        inputValue = undefined;
                        onCancel?.();
                    }}/>
                </div>
            </SettingItem>
        </SettingItemGroup>
    </form>
</Modal>

<style>
    .pwd_form {
        padding: 10px;
    }

    .confirm-modal-buttons {
        display: flex;
        column-gap: 5px;
        justify-content: end;
    }
</style>