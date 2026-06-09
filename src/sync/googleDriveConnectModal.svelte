<script lang="ts">
    import Modal from "../ui/obsidian/Modal.svelte";
    import Button from "../ui/base/Button.svelte"
    import Icon from "../ui/base/Icon.svelte";

    type Props = {
        open: boolean,
        statusMsg?: string
        statusIcon?: string
        authUrl: string
    }

    let {
        open = $bindable(false),
        statusMsg = $bindable(""),
        statusIcon = $bindable(""),
        authUrl
    }: Props = $props();

    let showLogin = $state(true)
    let showStatus = $derived(!!statusMsg)
    let cancelled = $state(false)
    let isOpen = $derived(() => open || !cancelled )

    function login(){
        showLogin = false;
        
        statusMsg = "Waiting for Google sign-in";
        statusIcon = "loader"

        window.open(authUrl, "_blank", "noopener,noreferrer")
    }

    function cancel(){
        cancelled = true;
        open = false;
    }
    
</script>

<Modal 
    title="Connect"
    class="gdrive-connect-modal"
    onClose={cancel}
    open={isOpen()}
>
    <p>
        Click the button below to login to your Google Drive from the web.
    </p>

    <div class="gdrive-connect-status">
        {#if showStatus}
            <div class="gdrive-connect-status-inner">
                {#if !!(statusIcon)}
                    <Icon icon={statusIcon}/>
                {/if}
                <span>
                    {statusMsg}
                </span>
            </div>
        {/if}
    </div>
    <div class="gdrive-connect-modal-buttons">
        {#if showLogin}
            <Button text="Login" class="gdrive-login-btn" cta onClick={(_) => login()}></Button>
            <Button text="Cancel" onClick={(_) => cancel()}></Button>
        {/if}
    </div>
</Modal>