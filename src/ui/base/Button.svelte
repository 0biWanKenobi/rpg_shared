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
    onClick?: (evt: MouseEvent) => void;
    class?: string;
    disabled?: boolean;
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
   }: Props = $props();

   onMount(() => {
    if(text && children){
      throw new Error("Button cannot have both text and children")
    }
   })
</script>

<button
  class={className + (icon ? " icon-button": "") + (warning ? " mod-warning" : "") + (cta? " mod-cta" : "")}
  class:svelcomlib-icon-text={icon}
  aria-label={tooltip}
  onclick={onClick}
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