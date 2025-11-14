<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrame: number;
  let dots: Array<{ x: number; y: number; vx: number; vy: number; size: number; pulse: number }> = [];
  let time = 0;

  const dotCount = 80;
  const connectionDistance = 180;
  const minDotRadius = 1.5;
  const maxDotRadius = 3.5;
  const lineOpacity = 0.25;

  function initCanvas() {
    if (!canvas) return;
    
    ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    dots = [];
    const width = rect.width;
    const height = rect.height;
    for (let i = 0; i < dotCount; i++) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: minDotRadius + Math.random() * (maxDotRadius - minDotRadius),
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function animate() {
    if (!ctx || !canvas) return;

    time += 0.01;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    // Create gradient for lines
    const lineGradient = ctx.createLinearGradient(0, 0, width, height);
    lineGradient.addColorStop(0, 'rgba(156, 163, 175, 0.3)');
    lineGradient.addColorStop(0.5, 'rgba(107, 114, 128, 0.25)');
    lineGradient.addColorStop(1, 'rgba(75, 85, 99, 0.2)');

    // Draw connections with gradient
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      
      dot.x += dot.vx;
      dot.y += dot.vy;

      if (dot.x < 0 || dot.x > width) dot.vx *= -1;
      if (dot.y < 0 || dot.y > height) dot.vy *= -1;

      dot.x = Math.max(0, Math.min(width, dot.x));
      dot.y = Math.max(0, Math.min(height, dot.y));

      for (let j = i + 1; j < dots.length; j++) {
        const other = dots[j];
        const dx = dot.x - other.x;
        const dy = dot.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * lineOpacity;
          
          // Create gradient for each line
          const gradient = ctx.createLinearGradient(dot.x, dot.y, other.x, other.y);
          const baseOpacity = opacity * 0.8;
          gradient.addColorStop(0, `rgba(156, 163, 175, ${baseOpacity})`);
          gradient.addColorStop(0.5, `rgba(107, 114, 128, ${baseOpacity * 1.2})`);
          gradient.addColorStop(1, `rgba(156, 163, 175, ${baseOpacity})`);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.5 + (1 - distance / connectionDistance) * 0.5;
          ctx.beginPath();
          ctx.moveTo(dot.x, dot.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    }

    // Draw dots with pulsing effect and gradients
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const pulseSize = dot.size + Math.sin(time * 2 + dot.pulse) * 0.5;
      
      // Create radial gradient for each dot
      const dotGradient = ctx.createRadialGradient(
        dot.x, dot.y, 0,
        dot.x, dot.y, pulseSize * 2
      );
      dotGradient.addColorStop(0, 'rgba(156, 163, 175, 0.9)');
      dotGradient.addColorStop(0.5, 'rgba(107, 114, 128, 0.6)');
      dotGradient.addColorStop(1, 'rgba(75, 85, 99, 0.2)');
      
      ctx.fillStyle = dotGradient;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(156, 163, 175, 0.4)';
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, pulseSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function handleResize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    const width = rect.width;
    const height = rect.height;
    dots.forEach(dot => {
      if (dot.x > width) dot.x = width;
      if (dot.y > height) dot.y = height;
    });
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
  class="fixed inset-0 pointer-events-none z-0 bg-transparent"
  style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;"
></canvas>

