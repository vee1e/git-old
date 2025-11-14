<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number;
  let dots: Array<{ x: number; y: number; vx: number; vy: number }> = [];

  const dotCount = 50;
  const connectionDistance = 150;
  const dotRadius = 1.5;
  const lineOpacity = 0.15;

  function initCanvas() {
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    dots = [];
    for (let i = 0; i < dotCount; i++) {
      dots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
  }

  function animate() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = `rgba(156, 163, 175, ${lineOpacity})`;
    ctx.fillStyle = 'rgba(156, 163, 175, 0.4)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];

      dot.x += dot.vx;
      dot.y += dot.vy;

      if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
      if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

      dot.x = Math.max(0, Math.min(canvas.width, dot.x));
      dot.y = Math.max(0, Math.min(canvas.height, dot.y));

      for (let j = i + 1; j < dots.length; j++) {
        const other = dots[j];
        const dx = dot.x - other.x;
        const dy = dot.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * lineOpacity;
          ctx.strokeStyle = `rgba(156, 163, 175, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(dot.x, dot.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function handleResize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  onMount(() => {
    initCanvas();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed inset-0 pointer-events-none z-0"
  style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;"
></canvas>

