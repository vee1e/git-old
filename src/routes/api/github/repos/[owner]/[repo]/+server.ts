import { json } from '@sveltejs/kit';
import { GITHUB_TOKEN } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { owner, repo } = params;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return json(
      { error: errorData.message || 'Failed to fetch repository' },
      { status: response.status }
    );
  }
  
  const data = await response.json();
  return json(data);
};

