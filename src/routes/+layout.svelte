<script>
  import '../app.css';
  import GeometricBackground from '$lib/components/GeometricBackground.svelte';
</script>

<GeometricBackground />
<main class="min-h-screen relative z-10 bg-gray-800/95">
  <slot />
</main>

