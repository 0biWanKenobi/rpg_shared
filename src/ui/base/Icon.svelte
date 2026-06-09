<script lang="ts">
    import { getIcon } from "obsidian";
    import { onMount } from "svelte";

    type Props = {
        icon?: string;
        size?: number | [number, number] | string | null;
        stroke_width?: number | null;
        class?: string;
    } & Record<string, unknown>;

    type ParsedIcon = {
        inner: string;
        attrs: Record<string, string>;
        class: DOMTokenList
    };

    let {
        icon = "",
        size = null,
        stroke_width = null,
        class: className = "",
        ...rest
    }: Props = $props();

    onMount(() => {
        (SVGElement.prototype as any).isShown = function(){
            return !!this.parentNode.offsetParent
        }
    })

    function parseIcon(icon: string): ParsedIcon {
        const svg = !icon.startsWith("<svg")
            ? getIcon(icon)
            :<SVGElement>(
                    new DOMParser().parseFromString(icon, "text/html").body.childNodes[0]
                );

        if (!svg) throw Error("Cannot load icon")

        const attrs: Record<string, string> = {};

        for (const name of svg.getAttributeNames()) {
            const value = svg.getAttribute(name);
            if (value != null) attrs[name] = value;
        }

        return {
            inner: svg.innerHTML,
            attrs,
            class: svg.classList
        };
    }

    function getSizeStyles(size: Props["size"]) {
        if (!size) return {};

        if (typeof size === "number") {
            return{
                "--icon-size": `${size}px`,
                width: "var(--icon-size)",
                height: "var(--icon-size)",
            };
        }

        if (Array.isArray(size)) {
            return { width: `${size[0]}px`, height: `${size[1]}px` };
        }

        return {
            width: `var(--${size})`,
            height: `var(--${size})`,
        };
    }

    const parsed = $derived(parseIcon(icon));

    const svgAttrs = $derived.by(() => {
        const base = parsed.attrs ?? {};

        const styleMap = {
            ...getSizeStyles(size),
            ...(stroke_width ? { "stroke-width": `${stroke_width}px` } : {}),
        };

        const style = Object.entries(styleMap)
            .map(([key, value]) => `${key}: ${value}`)
            .join("; ");

        
        if(className) parsed.class.add(...className.split(" "));
        return {
            xmlns: "http://www.w3.org/2000/svg",
            ...base,
            ...(className ? { class: parsed.class.toString() } : {}),
            ...(style ? { style } : {}),
        };
    });
</script>


<svg {...svgAttrs} {...rest}>
    {@html parsed.inner }
</svg>
