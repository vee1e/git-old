# GitHub Repo Info

A minimal Svelte app to fetch and display GitHub repository information, with a focus on repository age.

## Features

- Search any GitHub repository by owner/repo format
- Display repository age in years, months, and days
- Show repository statistics (stars, forks, issues)
- Clean, minimal black-white design
- Custom typography with Instrument Serif, Inter Semibold, and Noto Mono

## Tech Stack

- **SvelteKit** - Framework
- **Bun** - Runtime and package manager
- **shadcn-svelte** - UI components
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Getting Started

Install dependencies:

```bash
bun install
```

Run the development server:

```bash
bun run dev
```

Build for production:

```bash
bun run build
```

## Usage

Enter a repository in the format `owner/repo` (e.g., `vercel/next.js`) and click Search or press Enter.

