<script lang="ts">
  import { fetchRepoInfo, formatAge, parseRepoInput, fetchReadme, type RepoInfo } from '$lib/github';
  import { getLanguageColor } from '$lib/languageColors';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import CardHeader from '$lib/components/ui/card-header.svelte';
  import CardTitle from '$lib/components/ui/card-title.svelte';
  import CardContent from '$lib/components/ui/card-content.svelte';
  import ReadmeViewer from '$lib/components/ReadmeViewer.svelte';

  let repoInput = '';
  let loading = false;
  let error: string | null = null;
  let repoInfo: RepoInfo | null = null;
  let readmeContent: string | null = null;
  let readmeLoading = false;
  let showReadme = false;

  async function handleSearch() {
    if (!repoInput.trim()) return;

    const parsed = parseRepoInput(repoInput);
    if (!parsed) {
      error = 'Please enter a valid GitHub repository URL or owner/repo format';
      return;
    }

    loading = true;
    error = null;
    repoInfo = null;

    try {
      repoInfo = await fetchRepoInfo(parsed.owner, parsed.repo);
      readmeContent = null;
      readmeLoading = true;
      try {
        readmeContent = await fetchReadme(parsed.owner, parsed.repo);
      } catch (e) {
        console.error('Failed to fetch README:', e);
      } finally {
        readmeLoading = false;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to fetch repository';
    } finally {
      loading = false;
    }
  }

  function openReadme() {
    if (readmeContent) {
      showReadme = true;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !loading && repoInput.trim()) {
      e.preventDefault();
      handleSearch();
    }
  }
</script>

<div class="container mx-auto px-4 py-16 max-w-4xl">
  <div class="text-center mb-12">
    <h1 class="text-5xl font-serif font-semibold mb-4 text-gray-100">GitHub Repo Info</h1>
    <p class="text-lg font-semibold text-gray-400">Discover repository details and age</p>
  </div>

  <div class="mb-8">
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      class="flex gap-2"
    >
      <Input
        placeholder="GitHub URL or owner/repo (e.g., https://github.com/vercel/next.js)"
        bind:value={repoInput}
        onkeydown={handleKeydown}
        disabled={loading}
        class="flex-1"
      />
      <Button onclick={handleSearch} disabled={loading || !repoInput.trim()}>
        {loading ? 'Loading...' : 'Search'}
      </Button>
    </form>
  </div>

  {#if error}
    <Card class="border-red-600">
      <CardContent class="pt-6">
        <p class="text-red-400 font-semibold">{error}</p>
      </CardContent>
    </Card>
  {/if}

  {#if repoInfo}
    <Card>
      <CardHeader>
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <CardTitle class="mb-2">
              <a
                href={repoInfo.repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                class="hover:underline text-gray-200"
              >
                {repoInfo.repo.full_name}
              </a>
            </CardTitle>
            {#if repoInfo.repo.description}
              <p class="text-gray-300 font-semibold mb-4">{repoInfo.repo.description}</p>
            {/if}
          </div>
          <a
            href={repoInfo.repo.owner.html_url}
            target="_blank"
            rel="noopener noreferrer"
            class="ml-4"
          >
            <img
              src={repoInfo.repo.owner.avatar_url}
              alt={repoInfo.repo.owner.login}
              class="w-12 h-12 rounded-full border border-gray-600"
            />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Age</h3>
            <p class="text-2xl font-semibold mb-1 text-gray-200">{formatAge(repoInfo.age)}</p>
            <p class="text-sm font-mono text-gray-400">{repoInfo.age.totalDays} days old</p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Created</h3>
            <p class="text-lg font-semibold mb-1 text-gray-200">
              {new Date(repoInfo.repo.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p class="text-sm font-mono text-gray-400">
              {new Date(repoInfo.repo.created_at).toISOString()}
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Language</h3>
            {#if repoInfo.repo.language}
              <div class="flex items-center gap-3">
                <div
                  class="w-4 h-4 rounded-full"
                  style="background-color: {getLanguageColor(repoInfo.repo.language)}; box-shadow: 0 0 8px {getLanguageColor(repoInfo.repo.language)};"
                ></div>
                <p class="text-lg font-semibold" style="color: {getLanguageColor(repoInfo.repo.language)};">
                  {repoInfo.repo.language}
                </p>
              </div>
            {:else}
              <p class="text-lg font-semibold text-gray-500">N/A</p>
            {/if}
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Stats</h3>
            <div class="flex gap-4">
              <div>
                <p class="text-lg font-semibold text-gray-200">{repoInfo.repo.stargazers_count.toLocaleString()}</p>
                <p class="text-xs font-semibold text-gray-400">Stars</p>
              </div>
              <div>
                <p class="text-lg font-semibold text-gray-200">{repoInfo.repo.forks_count.toLocaleString()}</p>
                <p class="text-xs font-semibold text-gray-400">Forks</p>
              </div>
              <div>
                <p class="text-lg font-semibold text-gray-200">{repoInfo.repo.open_issues_count.toLocaleString()}</p>
                <p class="text-xs font-semibold text-gray-400">Issues</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Last Updated</h3>
            <p class="text-lg font-semibold mb-1 text-gray-200">
              {new Date(repoInfo.repo.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p class="text-sm font-mono text-gray-400">
              {new Date(repoInfo.repo.updated_at).toISOString()}
            </p>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Last Pushed</h3>
            <p class="text-lg font-semibold mb-1 text-gray-200">
              {new Date(repoInfo.repo.pushed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p class="text-sm font-mono text-gray-400">
              {new Date(repoInfo.repo.pushed_at).toISOString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if repoInfo}
    <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <Button
        onclick={openReadme}
        disabled={readmeLoading || !readmeContent}
        class="shadow-lg"
      >
        {readmeLoading ? 'Loading README...' : readmeContent ? 'View README.md' : 'README not found'}
      </Button>
    </div>
  {/if}

  <ReadmeViewer
    readmeContent={readmeContent}
    bind:open={showReadme}
    repoOwner={repoInfo?.repo.owner.login || ''}
    repoName={repoInfo?.repo.name || ''}
    defaultBranch={repoInfo?.repo.default_branch || 'main'}
  />
</div>

