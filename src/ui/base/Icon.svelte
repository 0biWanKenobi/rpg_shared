<script lang="ts">
    import {getIcon} from "obsidian";

    interface Props {
        icon?: string;
        size?: number | [number, number] | string | null;
        stroke_width?: number | null;
        class?: string;
    }

    let {icon = "", size = null, stroke_width = null, class: className = "", ...rest}: Props = $props();

    const icon_element: SVGElement | null = $derived.by(() => {
        const result = !icon.startsWith("<svg")
            ? getIcon(icon)
            : <SVGElement>(
                    new DOMParser().parseFromString(icon, "text/html").body.childNodes[0]
                );
        
        if(!result) return result;

        if (className) result.classList.add(...className.split(" "));


        if(stroke_width)
            result.style.strokeWidth = stroke_width + "px";

        if(!size)
            return result;


        if (typeof size === "number") {
            result.style.width = size + "px";
            result.style.height = size + "px";
        } else if (Array.isArray(size)) {
            result.style.width = size[0] + "px";
            result.style.height = size[1] + "px";
        } else {
            result.style.width = `var(--${size})`;
            result.style.height = `var(--${size})`;
        }

        return result;
    })

</script>

{@html icon_element?.outerHTML ?? ""}
