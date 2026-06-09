<script lang="ts">
  interface Props {
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
    getTooltip?: (value: number) => string;
  }

    let {
        min = 0,
        max = 100,
        step = 1,
        value = 0,
        onChange = () => {},
        getTooltip = (value: number) => value.toString(),
    }: Props = $props();
</script>

<input
  type="range"
  class="slider"
  bind:value
  {min}
  {max}
  {step}
  oninput={() => {
    const tooltip_el = activeDocument.body.lastChild as HTMLElement | null;
    if (tooltip_el && tooltip_el.classList.contains("tooltip")) {
      // Manually grabbing the tooltip and forcefully updating it, as I do not have the proper reference to it
      // Note: width="auto" is necessary, as width is exactly set, and sometimes the text overflows
      const firstChild = tooltip_el.firstChild as HTMLElement | null;
      if(!firstChild) return
      firstChild.textContent = getTooltip(value);
      tooltip_el.style.width = "auto";
    }
  }}
  onchange={(_) => {
    onChange(value);
  }}
  aria-label={getTooltip(value)}
  data-tooltip-position="top"
/>
