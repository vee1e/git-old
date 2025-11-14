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
    default: 'h-8 px-3 py-1 text-sm',
    sm: 'h-7 px-2 text-xs',
    lg: 'h-9 px-4 text-base'
  };
</script>

<button
  class={cn(
    'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap',
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

