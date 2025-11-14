<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    type?: string;
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    onkeydown?: (e: KeyboardEvent) => void;
  }

  let {
    class: className = '',
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    disabled = false,
    onkeydown,
    ...restProps
  }: Props = $props();
</script>

<input
  type={type}
  class={cn(
    'flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 ring-offset-gray-800 file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {placeholder}
  bind:value
  {disabled}
  onkeydown={onkeydown}
  {...restProps}
/>

