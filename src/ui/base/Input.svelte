<script lang="ts">
  import type { HTMLInputTypeAttribute } from "svelte/elements";

  interface Props {
    id?: string,
    type: HTMLInputTypeAttribute;
    value?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    onEnter?: () => void;
    valid?: boolean;
    readonly?: boolean;
    class?: string;
  }

    let {
        id,
        type = "text",
        value = "",
        placeholder = "",
        onChange = () => {},
        onEnter = () => {},
        valid = false,
        readonly = false,
        class: className = ""
    }: Props = $props();


</script>

<!--TODO: value keyword is still an issue-->
<input
  {id}
  {type}
  {placeholder}
  {readonly}
  {value}
  oninput={e => onChange(e.currentTarget.value)}
  onkeydown={e => {
    if(e.key != "Enter") return;
    onEnter();
  }}
  class={className}
  class:svelcomlib-input-success={valid}
  class:svelcomlib-input-fail={valid === false}
/>
