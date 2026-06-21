<script lang="ts">
    import Modal from "../obsidian/Modal.svelte";
    import Button from "../base/Button.svelte"
    import Icon from "../base/Icon.svelte";

    type Props = {
        open: boolean,
        afterLoginButtons: boolean,
        loginInProgress: boolean,
        statusMsg?: string
        statusIcon?: string
        authUrl: string
        onClose?: (cancelled: boolean) => void | Promise<void>
    }

    let {
        open = $bindable(false),
        afterLoginButtons,
        loginInProgress = $bindable(false),
        statusMsg = $bindable(""),
        statusIcon = $bindable(""),
        authUrl,
        onClose
    }: Props = $props();

    let showLogin = $state(true)
    let showStatus = $derived(!!statusMsg)
    let cancelled = $state<boolean>(false)
    let isOpen = $derived(open && !loginInProgress )

    $effect(() => {
        if(open) cancelled = false;
    })

    function login(){
        showLogin = false;
        loginInProgress = true;
        
        statusMsg = "Waiting for Google sign-in";
        statusIcon = "loader"

        window.open(authUrl, "_blank", "noopener,noreferrer")
    }

    function cancel(){
        open = false;
        loginInProgress = false;
        onClose?.(true)
    }
    
    function close(){
        open = false;
        onClose?.(false)
    }
    
</script>

<Modal 
    title="Connect"
    class="gdrive-connect-modal"
    onClose={close}
    open={isOpen}
>
    <p>
        Click the button below to login to your Google Drive from the web.
    </p>

    {#if showStatus}
        <div class="gdrive-connect-status">
            <div class="gdrive-connect-status-inner">
                {#if !!(statusIcon)}
                    <Icon icon={statusIcon}/>
                {/if}
                <span>
                    {statusMsg}
                </span>
            </div>
        </div>
    {/if}
    <div class="gdrive-connect-modal-buttons">
        {#if showLogin}
            <Button text="Login" class="gdrive-login-btn" cta onClick={(_) => login()}></Button>
            <Button text="Cancel" onClick={(_) => cancel()}></Button>
        {:else if afterLoginButtons}
            <Button text="Close" class="gdrive-login-btn" cta onClick={(_) => close()}></Button>
        {/if}
    </div>
</Modal>