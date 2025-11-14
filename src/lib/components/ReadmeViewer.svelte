<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import hljs from 'highlight.js';
  import mermaid from 'mermaid';
  import DOMPurify from 'dompurify';
  import Button from './ui/button.svelte';
  import Card from './ui/card.svelte';
  import CardContent from './ui/card-content.svelte';

  declare global {
    interface Window {
      MathJax?: {
        tex?: {
          inlineMath?: string[][];
          displayMath?: string[][];
        };
        typesetPromise?: (elements: Element[]) => Promise<void>;
      };
    }
  }

  interface Props {
    readmeContent: string | null;
    open?: boolean;
    repoOwner?: string;
    repoName?: string;
    defaultBranch?: string;
  }

  let { readmeContent, open = $bindable(false), repoOwner = '', repoName = '', defaultBranch = 'main' }: Props = $props();
  let container = $state<HTMLDivElement | null>(null);
  let renderedHtml = $state('');

  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#9ca3af',
      primaryTextColor: '#1f2937',
      primaryBorderColor: '#6b7280',
      lineColor: '#6b7280',
      secondaryColor: '#374151',
      tertiaryColor: '#4b5563'
    }
  });

  function renderMarkdown(content: string) {
    marked.setOptions({
      highlight: function(code, lang) {
        if (lang === 'mermaid') {
          return code;
        }
        return code;
      },
      breaks: true,
      gfm: true
    });

    let html = marked.parse(content) as string;

    if (repoOwner && repoName) {
      html = html.replace(
        /<img([^>]*?)src="([^"]+)"([^>]*?)>/g,
        (match, before, src, after) => {
          if (src.startsWith('http://') || src.startsWith('https://')) {
            return match;
          }
          const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
          const absoluteUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${defaultBranch}/${cleanSrc}`;
          return `<img${before}src="${absoluteUrl}"${after}>`;
        }
      );

      html = html.replace(
        /<a([^>]*?)href="([^"]+)"([^>]*?)>/g,
        (match, before, href, after) => {
          if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
            return match;
          }
          if (href.startsWith('/')) {
            const cleanHref = href.slice(1);
            const absoluteUrl = `https://github.com/${repoOwner}/${repoName}/blob/${defaultBranch}/${cleanHref}`;
            return `<a${before}href="${absoluteUrl}"${after} target="_blank" rel="noopener noreferrer">`;
          }
          return match;
        }
      );
    }

    html = html.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
      '<div class="mermaid">$1</div>'
    );

    html = html.replace(
      /\$\$([\s\S]*?)\$\$/g,
      '<div class="math-block">$$$1$$</div>'
    );

    html = html.replace(
      /\$([^\$\n]+?)\$/g,
      '<span class="math-inline">$$$1$$</span>'
    );

    html = html.replace(/<pre><code( class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g, (match, fullClass, lang, codeContent) => {
      if (lang === 'mermaid') {
        return match;
      }
      let highlighted = '';
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlighted = hljs.highlight(codeContent.trim(), { language: lang }).value;
        } catch (err) {
          highlighted = hljs.highlightAuto(codeContent.trim()).value;
        }
      } else {
        highlighted = hljs.highlightAuto(codeContent.trim()).value;
      }
      return `<pre><code class="hljs language-${lang || 'plaintext'}">${highlighted}</code></pre>`;
    });

    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'del',
        'sub', 'sup'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true,
      FORBID_ATTR: []
    });

    return sanitized;
  }

  function renderMermaid() {
    if (!container) return;
    const mermaidElements = container.querySelectorAll('.mermaid:not([data-processed])');
    mermaidElements.forEach((el, index) => {
      const id = `mermaid-${Date.now()}-${index}`;
      el.id = id;
      el.setAttribute('data-processed', 'true');
      mermaid.render(id, el.textContent || '').then((result) => {
        el.innerHTML = result.svg;
      }).catch(() => {
        el.innerHTML = '<p class="text-red-400">Failed to render diagram</p>';
      });
    });
  }

  function renderMath() {
    if (typeof window === 'undefined' || !window.MathJax) return;

    const mathElements = container.querySelectorAll('.math-inline, .math-block');
    if (mathElements.length > 0) {
      window.MathJax.typesetPromise([container]).catch(() => {});
    }
  }

  $effect(() => {
    if (readmeContent && open) {
      renderedHtml = renderMarkdown(readmeContent);
      setTimeout(() => {
        renderMermaid();
        renderMath();
      }, 100);
    }
  });

  onMount(() => {
    if (typeof window === 'undefined') return;

    if (!window.MathJax) {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']]
        }
      };

      const mathJaxScript = document.createElement('script');
      mathJaxScript.id = 'MathJax-script';
      mathJaxScript.async = true;
      mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      document.head.appendChild(mathJaxScript);
    }
  });
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 p-4"
    role="button"
    tabindex="0"
    onclick={() => open = false}
    onkeydown={(e) => e.key === 'Escape' && (open = false)}
  >
    <Card class="max-w-5xl max-h-[95vh] w-full flex flex-col border-gray-600 bg-gray-800" onclick={(e) => e.stopPropagation()}>
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-600">
        <h2 class="text-xl font-semibold text-gray-100">README.md</h2>
        <Button onclick={() => open = false} variant="outline" size="sm">Close</Button>
      </div>
      <CardContent class="overflow-y-auto flex-1 px-8 py-6 bg-gray-800">
        <div
          bind:this={container}
          class="readme-content"
        >
          {@html renderedHtml}
        </div>
      </CardContent>
    </Card>
  </div>
{/if}

<style>
  :global(.readme-content) {
    @apply font-sans text-gray-200;
    letter-spacing: -0.04em;
  }
  :global(.readme-content h1) {
    @apply text-3xl font-semibold mb-4 mt-8 first:mt-0 text-gray-100;
  }
  :global(.readme-content h2) {
    @apply text-2xl font-semibold mb-3 mt-6 text-gray-100;
  }
  :global(.readme-content h3) {
    @apply text-xl font-semibold mb-2 mt-4 text-gray-100;
  }
  :global(.readme-content h4) {
    @apply text-lg font-semibold mb-2 mt-3 text-gray-100;
  }
  :global(.readme-content h5) {
    @apply text-base font-semibold mb-2 mt-2 text-gray-100;
  }
  :global(.readme-content h6) {
    @apply text-base font-semibold mb-2 mt-2 text-gray-100;
  }
  :global(.readme-content p) {
    @apply mb-4 text-gray-300 leading-relaxed;
  }
  :global(.readme-content a) {
    @apply text-gray-200 underline hover:text-gray-100;
  }
  :global(.readme-content strong) {
    @apply font-semibold text-gray-100;
  }
  :global(.readme-content em) {
    @apply italic;
  }
  :global(.readme-content ul) {
    @apply mb-4 ml-6 list-disc;
  }
  :global(.readme-content ol) {
    @apply mb-4 ml-6 list-decimal;
  }
  :global(.readme-content ul li) {
    @apply mb-1 text-gray-300;
  }
  :global(.readme-content ol li) {
    @apply mb-1 text-gray-300;
  }
  :global(.readme-content li) {
    @apply text-gray-300;
  }
  :global(.readme-content code:not(pre code)) {
    @apply bg-gray-900 border border-gray-600 px-1.5 py-0.5 rounded text-sm font-mono text-gray-200;
  }
  :global(.readme-content pre) {
    @apply bg-gray-900 border border-gray-600 p-4 rounded mb-4 overflow-x-auto;
  }
  :global(.readme-content pre code.hljs) {
    @apply bg-transparent border-0 p-0 text-gray-200;
    display: block;
    overflow-x: auto;
    padding: 0;
  }
  :global(.readme-content code.hljs) {
    @apply bg-transparent border-0 p-0;
  }
  :global(.readme-content img) {
    @apply max-w-full h-auto my-4 rounded border border-gray-600;
  }
  :global(.readme-content blockquote) {
    @apply border-l-4 border-gray-500 pl-4 my-4 italic text-gray-400;
  }
  :global(.readme-content hr) {
    @apply border-gray-600 my-6;
  }
  :global(.readme-content table) {
    @apply border border-gray-600 mb-4 w-full;
  }
  :global(.readme-content th) {
    @apply border border-gray-600 px-4 py-2 font-semibold bg-gray-900 text-gray-200;
  }
  :global(.readme-content td) {
    @apply border border-gray-600 px-4 py-2 text-gray-300;
  }
  :global(.readme-content .mermaid) {
    @apply my-6 flex justify-center;
  }
</style>

