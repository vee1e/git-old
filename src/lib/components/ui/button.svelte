<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  type ButtonVariant = 'default' | 'outline' | 'ghost';
  type ButtonSize = 'default' | 'sm' | 'lg';

  interface Props {
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    disabled?: boolean;
    children?: Snippet;
    onclick?: () => void;
  }

  let {
    variant = 'default',
    size = 'default',
    class: className = '',
    disabled = false,
    children,
    onclick,
    ...restProps
  }: Props = $props();

  const variantClasses = {
    default: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-400 bg-transparent hover:bg-gray-400 hover:text-gray-900',
    ghost: 'hover:bg-gray-700'
  };

  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8'
  };
</script>

<button
  class={cn(
    'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className
  )}
  disabled={disabled}
  onclick={onclick}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</button>

