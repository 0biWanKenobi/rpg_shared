<script lang="ts">
    import { onMount, type Snippet } from "svelte";
  import { Icon } from "./index";

  interface Props {
    text?: string;
    children?: Snippet;
    icon?: string;
    tooltip?: string;
    size?: number | null;
    cta?: boolean,
    warning?: boolean,
    disabled?: boolean;
    loading?: boolean;
    class?: string;
    onClick?: (evt: MouseEvent) => (void | Promise<void>);

  }

  let { 
    text = "",
    children,
    icon = "",
    tooltip = "",
    size = null,
    onClick = () => {},
    class: className = "",
    cta = false,
    warning = false,
    disabled = false,
    loading = $bindable(false)
   }: Props = $props();

   onMount(() => {
    if(text && children){
      throw new Error("Button cannot have both text and children")
    }
   })

   let onClickLoading = $state(false)
   const loadingVal = $derived(onClickLoading || loading)

   async function onBtnClick(evt: MouseEvent) {

    onClickLoading = true;
    try {
      await onClick(evt)
    } finally {
      onClickLoading = false;
    }

   }
</script>

<button
  class={className}
  class:icon-button={icon}
  class:mod-warning={warning}
  class:mod-cta={cta}
  class:svelcomlib-icon-text={icon}
  class:mod-loading={loadingVal}
  aria-label={tooltip}
  onclick={onBtnClick}
  {disabled}
>
  {#if icon}
    <Icon class="icon" {icon} {size} />
  {/if}
  {#if text}
    <div>{text}</div>
  {:else if children}
    {@render children()}
  {/if}
</button>


<style>
  :global(.icon-button) {
      column-gap: 5px;
      .icon {
          display: flex;
          align-items: center;
      }
  }
</style>