<script lang="ts">
  import { onMount, tick } from 'svelte';
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
        'sub', 'sup', 'center', 'figure', 'figcaption', 'section',
        'article', 'header', 'footer', 'nav', 'aside', 'main'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'style', 'align', 'width', 'height'],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true,
      FORBID_ATTR: []
    });

    // Decode HTML entities - DOMPurify encodes them, so we need to decode
    // Decode numeric entities first (like &#39; for apostrophe)
    let decoded = sanitized.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });
    
    // Decode hex entities
    decoded = decoded.replace(/&#x([a-f\d]+);/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // Decode named entities (but preserve &amp; in attributes, decode it in text)
    decoded = decoded.replace(/&apos;/g, "'");
    decoded = decoded.replace(/&quot;/g, '"');
    decoded = decoded.replace(/&lt;/g, '<');
    decoded = decoded.replace(/&gt;/g, '>');
    decoded = decoded.replace(/&nbsp;/g, ' ');
    
    // Decode &amp; but be careful - only decode standalone &amp; not &amp;lt; etc
    // Replace &amp; that's not part of another entity
    decoded = decoded.replace(/&amp;(?![a-z0-9#]+;)/gi, '&');

    return decoded;
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

  function wrapBadgeParagraphs() {
    if (!container) return;
    
    const centerTags = Array.from(container.querySelectorAll('center:not([data-badge-processed])'));
    
    if (centerTags.length === 0) {
      const allParagraphs = Array.from(container.querySelectorAll('p:not([data-badge-processed])'));
      
      allParagraphs.forEach((p) => {
        const hasAlignCenter = p.getAttribute('align') === 'center';
        if (hasAlignCenter) {
          p.setAttribute('data-badge-processed', 'true');
          return;
        }
        
        const hasImg = p.querySelector('img');
        const imgCount = p.querySelectorAll('img').length;
        const textContent = p.textContent?.trim() || '';
        const hasOnlyImages = hasImg && textContent === '' && imgCount > 1;
        
        if (hasOnlyImages || (hasImg && imgCount > 1 && textContent.length < 50)) {
          if (p instanceof HTMLElement) {
            const computedDisplay = window.getComputedStyle(p).display;
            if (computedDisplay === 'flex') {
              p.setAttribute('data-badge-processed', 'true');
              return;
            }
            
            p.style.setProperty('display', 'flex', 'important');
            p.style.setProperty('flex-wrap', 'wrap', 'important');
            p.style.setProperty('justify-content', 'center', 'important');
            p.style.setProperty('gap', '0.5rem', 'important');
            p.style.setProperty('align-items', 'center', 'important');
            p.style.setProperty('margin-bottom', '1rem', 'important');
            p.style.setProperty('flex-direction', 'row', 'important');
            
            const children = Array.from(p.children);
            children.forEach((child) => {
              if (child instanceof HTMLElement) {
                child.style.setProperty('margin', '0', 'important');
                child.style.setProperty('flex-shrink', '0', 'important');
              }
            });
            
            p.setAttribute('data-badge-processed', 'true');
          }
        } else {
          p.setAttribute('data-badge-processed', 'true');
        }
      });
    }
    
    centerTags.forEach((center) => {
      if (center instanceof HTMLElement) {
        const computedDisplay = window.getComputedStyle(center).display;
        if (computedDisplay === 'flex') {
          center.setAttribute('data-badge-processed', 'true');
          return;
        }
        
        center.style.setProperty('display', 'flex', 'important');
        center.style.setProperty('flex-wrap', 'wrap', 'important');
        center.style.setProperty('justify-content', 'center', 'important');
        center.style.setProperty('gap', '0.5rem', 'important');
        center.style.setProperty('align-items', 'center', 'important');
        center.style.setProperty('margin-bottom', '1rem', 'important');
        center.style.setProperty('flex-direction', 'row', 'important');
        center.style.setProperty('width', '100%', 'important');
        
        const allChildren = Array.from(center.children);
        allChildren.forEach((child) => {
          if (child instanceof HTMLElement) {
            child.style.setProperty('margin', '0', 'important');
            child.style.setProperty('flex-shrink', '0', 'important');
            child.style.setProperty('width', 'auto', 'important');
            child.style.setProperty('max-width', 'none', 'important');
            if (child.tagName === 'P') {
              child.style.setProperty('display', 'block', 'important');
            }
          }
        });
        
        center.setAttribute('data-badge-processed', 'true');
      }
    });
    
    const paragraphs = Array.from(container.querySelectorAll('p'));
    let currentGroup: HTMLParagraphElement[] = [];
    
    paragraphs.forEach((p) => {
      if (p.closest('center')) return;
      
      const hasOnlyImage = p.children.length === 1 && 
        (p.querySelector('img') || p.querySelector('a > img'));
      const hasOnlyLinkWithImage = p.children.length === 1 && 
        p.querySelector('a') && p.querySelector('a > img');
      const textContent = p.textContent?.trim() || '';
      
      if (hasOnlyImage || hasOnlyLinkWithImage || (textContent === '' && p.querySelector('img'))) {
        currentGroup.push(p);
      } else {
        if (currentGroup.length > 1) {
          const wrapper = document.createElement('div');
          wrapper.className = 'badge-group';
          wrapper.style.display = 'flex';
          wrapper.style.flexWrap = 'wrap';
          wrapper.style.gap = '0.5rem';
          wrapper.style.alignItems = 'center';
          wrapper.style.marginBottom = '1rem';
          
          const firstP = currentGroup[0];
          firstP.parentNode?.insertBefore(wrapper, firstP);
          
          currentGroup.forEach((badgeP) => {
            badgeP.style.display = 'inline-block';
            badgeP.style.margin = '0';
            badgeP.style.marginBottom = '0';
            wrapper.appendChild(badgeP);
          });
        }
        currentGroup = [];
      }
    });
    
    if (currentGroup.length > 1) {
      const wrapper = document.createElement('div');
      wrapper.className = 'badge-group';
      wrapper.style.display = 'flex';
      wrapper.style.flexWrap = 'wrap';
      wrapper.style.gap = '0.5rem';
      wrapper.style.alignItems = 'center';
      wrapper.style.marginBottom = '1rem';
      
      const firstP = currentGroup[0];
      firstP.parentNode?.insertBefore(wrapper, firstP);
      
      currentGroup.forEach((badgeP) => {
        badgeP.style.display = 'inline-block';
        badgeP.style.margin = '0';
        badgeP.style.marginBottom = '0';
        wrapper.appendChild(badgeP);
      });
    }
  }

  function renderMath() {
    if (typeof window === 'undefined' || !window.MathJax) return;

    const mathElements = container.querySelectorAll('.math-inline, .math-block');
    if (mathElements.length > 0) {
      window.MathJax.typesetPromise([container]).catch(() => {});
    }
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (readmeContent && open) {
      renderedHtml = renderMarkdown(readmeContent);
      if (container) {
        const allElements = container.querySelectorAll('[data-badge-processed]');
        allElements.forEach((el) => el.removeAttribute('data-badge-processed'));
      }
      tick().then(() => {
        renderMermaid();
        renderMath();
        wrapBadgeParagraphs();
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          wrapBadgeParagraphs();
        }, 100);
      });
    }
  });

  $effect(() => {
    if (container && open) {
      let mutationTimer: ReturnType<typeof setTimeout> | null = null;
      
      const observer = new MutationObserver(() => {
        if (mutationTimer) clearTimeout(mutationTimer);
        mutationTimer = setTimeout(() => {
          wrapBadgeParagraphs();
        }, 50);
      });
      
      observer.observe(container, {
        childList: true,
        subtree: true
      });
      
      wrapBadgeParagraphs();
      
      return () => {
        if (mutationTimer) clearTimeout(mutationTimer);
        observer.disconnect();
      };
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
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 p-4 cursor-default"
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
          class="readme-content cursor-default"
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
  :global(.readme-content p[align="center"]) {
    text-align: center !important;
    display: block !important;
  }
  :global(.readme-content p[align="center"] img) {
    display: block !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  :global(.readme-content p[align="center"] a) {
    display: inline-block !important;
  }
  :global(.readme-content center p) {
    margin-bottom: 0 !important;
  }
  :global(.readme-content a) {
    @apply text-gray-200 underline hover:text-gray-100 cursor-pointer;
    display: inline-block;
  }
  :global(.readme-content a img) {
    display: inline-block;
    vertical-align: middle;
    margin: 0;
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
    @apply rounded;
    display: inline-block;
    vertical-align: middle;
    margin: 0;
    max-width: 100%;
    height: auto;
  }
  :global(.readme-content p img) {
    margin: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
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
  :global(.readme-content p:has(> a > img:only-child)) {
    display: inline-block;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    vertical-align: middle;
  }
  :global(.readme-content p:has(> img:only-child)) {
    display: inline-block;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    vertical-align: middle;
  }
  :global(.readme-content center) {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 0.5rem !important;
    align-items: center !important;
    margin-bottom: 1rem !important;
    flex-direction: row !important;
    width: 100% !important;
  }
  :global(.readme-content center p),
  :global(.readme-content center > p) {
    margin: 0 !important;
    margin-bottom: 0 !important;
    margin-top: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
    width: auto !important;
    max-width: none !important;
    flex-basis: auto !important;
  }
  :global(.readme-content center > *) {
    margin: 0 !important;
    flex-shrink: 0 !important;
  }
  :global(.readme-content center img) {
    display: block !important;
  }
  :global(.readme-content center a) {
    display: inline-block !important;
  }
  :global(.readme-content p:has(img:nth-of-type(2))) {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 0.5rem !important;
    align-items: center !important;
    flex-direction: row !important;
  }
  :global(.readme-content p:has(img:nth-of-type(2)) > *) {
    margin: 0 !important;
    flex-shrink: 0 !important;
  }
</style>

