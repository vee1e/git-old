<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className = '', children, ...restProps }: Props = $props();
</script>

<div
  class={cn('rounded-lg border border-gray-600 bg-gray-800 text-gray-200 shadow-sm', className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</div>

