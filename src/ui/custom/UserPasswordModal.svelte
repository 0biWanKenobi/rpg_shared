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
    }

    let {title, open = $bindable(false)}: Props = $props();

    let inputValue = $state<string | undefined>('')

    const {promise, resolve} = Promise.withResolvers<string|undefined>()

    export async function onReturn(){
        return promise;
    }

    onMount(() => {
        return () => resolve(undefined)
    })

    const onConfirm = () => {
        if(!inputValue) return;
        resolve(inputValue);
        inputValue = undefined;
    }

</script>


<Modal bind:open onClose={() => {
    resolve(inputValue);
    inputValue = undefined;
}}>
    <form class="pwd_form">
        <SettingItemGroup>
            <SettingItem name={title}>
                <Input type="password" onChange={v => inputValue=v} onEnter={onConfirm}/>
            </SettingItem>
            <SettingItem>
                <div class="confirm-modal-buttons">
                    <Button cta text="Ok" onClick={onConfirm}/>
                    <Button text="Cancel" onClick={() => {
                        inputValue = undefined;
                        resolve(inputValue)
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