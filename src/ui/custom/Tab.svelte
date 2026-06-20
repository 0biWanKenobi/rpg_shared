<script lang="ts">
    import { type Snippet } from "svelte";
    import { getTabsContext } from "./tabsContext";

    interface Props {
        index: number,
        children: Snippet
    }

    let { children, index }: Props = $props();


    const tabsContext = getTabsContext()
</script>

{#if tabsContext.state.selected == index}
    <div class="rpg-tab">
        {@render children()}
    </div>
{/if}