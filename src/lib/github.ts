export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface RepoInfo {
  repo: GitHubRepo;
  age: {
    years: number;
    months: number;
    days: number;
    totalDays: number;
  };
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  // Add GitHub token if available (from environment variable)
  if (typeof window !== 'undefined') {
    // Client-side: use API route
    const response = await fetch(`/api/github/repos/${owner}/${repo}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch repository: ${response.statusText}`);
    }

    const repoData: GitHubRepo = await response.json();
    return calculateRepoInfo(repoData);
  } else {
    // Server-side: use token directly
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found');
      }
      throw new Error(`Failed to fetch repository: ${response.statusText}`);
    }

    const repoData: GitHubRepo = await response.json();
    return calculateRepoInfo(repoData);
  }
}

function calculateRepoInfo(repoData: GitHubRepo): RepoInfo {
  
  const createdAt = new Date(repoData.created_at);
  const now = new Date();
  const diffTime = now.getTime() - createdAt.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;

  return {
    repo: repoData,
    age: {
      years,
      months,
      days,
      totalDays
    }
  };
}

export function formatAge(age: RepoInfo['age']): string {
  const parts: string[] = [];
  if (age.years > 0) parts.push(`${age.years} ${age.years === 1 ? 'year' : 'years'}`);
  if (age.months > 0) parts.push(`${age.months} ${age.months === 1 ? 'month' : 'months'}`);
  if (age.days > 0 || parts.length === 0) parts.push(`${age.days} ${age.days === 1 ? 'day' : 'days'}`);
  return parts.join(', ');
}

export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  
  if (!trimmed) return null;
  
  const githubUrlMatch = trimmed.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
  if (githubUrlMatch) {
    return {
      owner: githubUrlMatch[1],
      repo: githubUrlMatch[2]
    };
  }
  
  const parts = trimmed.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return {
      owner: parts[0],
      repo: parts[1]
    };
  }
  
  return null;
}

export async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      // Client-side: use API route
      const response = await fetch(`/api/github/repos/${owner}/${repo}/readme`);
      
      if (response.ok) {
        const text = await response.text();
        return text;
      }
    } else {
      // Server-side: use token directly
      const headers: HeadersInit = {
        Accept: 'application/vnd.github.v3.raw'
      };
      
      const token = process.env.GITHUB_TOKEN;
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }
      
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers }
      );
      
      if (response.ok) {
        const text = await response.text();
        return text;
      }
    }
  } catch (e) {
    console.error('Failed to fetch README:', e);
  }
  
  return null;
}

