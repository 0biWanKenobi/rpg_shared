<script lang="ts">

interface Props {
    name: string,
    selected: boolean,
    onSelect: () => void,
}

let {name, selected, onSelect}: Props = $props();

const className = $derived(`rpg-tab-header${selected ? ` rpg-tab-header-selected` : ''}`)

const onKeyDown = (e: KeyboardEvent) => {
    if(e.key != 'Enter' || e.shiftKey || e.ctrlKey) return;
    onSelect();
}

</script>


<div
    class={className} onclick={onSelect}
    onkeydown={onKeyDown}
    role="button"
    tabindex="0"
>
{name}
</div>

<style>

.rpg-tab-header {
    padding: 5px;
    cursor: pointer;
    font-weight: bold;

    &.rpg-tab-header-selected {
        color: var(--interactive-accent);
        border-bottom: 2px solid var(--interactive-accent);
    }
}
</style>