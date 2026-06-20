<script lang="ts">
    import { type Snippet } from "svelte";
    import TabHeader from "./TabHeader.svelte";
    import { updateTabsContext } from "./tabsContext";

    interface Props {
        tabHeaders: string[],
        tabs: Snippet
    }


    let { tabs, tabHeaders }: Props = $props();

    let tabState = $state({
        selected: 0
    });
    

    updateTabsContext({
        state: tabState
    })
</script>


<div class="rpg-tab-component">
    <div class="rpg-tab-set">
        {#each tabHeaders as headerTitle, index}
            <TabHeader
                name={headerTitle}
                selected={index == tabState.selected}
                onSelect={() => tabState.selected = index}
            />
        {/each}
    </div>
    <div class="rpg-tab-container">
        {@render tabs()}
    </div>
</div>

<style>
    .rpg-tab-set {
    display: flex;
    gap: 5px;
    margin-bottom: 20px;
}
</style>