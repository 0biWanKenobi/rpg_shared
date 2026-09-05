<!-- Copied over from obsidian-periodic-notes -->
<script lang="ts" generics="T">
  type IOption<TValue> = {
    value: TValue;
    text: string;
  }

  type DropdownProps = {
    onChange: (value: T, el: HTMLSelectElement) => void;
    options: IOption<T>[];
    value: T;
    disabled?: boolean;
    class?: string;
  }

    let {
        onChange = () => {},
        options = [],
        value,
        disabled = false,
        class: className = ""
    }: DropdownProps = $props();

    function handleChange(el: HTMLSelectElement): void {
      const option = options[el.selectedIndex];
      if (option) onChange(option.value, el);
    }
</script>

<select
  class={className ? className + " dropdown" : "dropdown"}
  {disabled}
  onchange={(e) => handleChange(e.currentTarget)}
>
  {#each options as option, index}
    <option value={index} selected={Object.is(option.value, value)}>
      {option.text}
    </option>
  {/each}
</select>
