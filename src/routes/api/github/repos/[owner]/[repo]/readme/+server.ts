import { text } from '@sveltejs/kit';
import { GITHUB_TOKEN } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { owner, repo } = params;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3.raw'
  };
  
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers
  });
  
  if (!response.ok) {
    return text('', { status: response.status });
  }
  
  const readmeText = await response.text();
  return text(readmeText);
};

