# GitHub Repo Info

A modern Svelte application for exploring GitHub repositories with detailed information display and full README rendering capabilities.

## Features

### Repository Information
- Search repositories by GitHub URL or owner/repo format
- Display repository age in years, months, and days
- Show comprehensive statistics (stars, forks, issues)
- Language display with color-coded indicators
- Repository metadata including creation date, last update, and last push

### README Viewer
- Full GitHub Flavored Markdown support
- Syntax highlighting with highlight.js (github-dark theme)
- Mermaid diagram rendering
- MathJax support for mathematical notation
- Image and link resolution from GitHub
- Clean, readable markdown rendering

## Tech Stack

- **SvelteKit** - Full-stack framework with Svelte 5 runes
- **Bun** - Runtime and package manager
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type safety
- **marked** - Markdown parser
- **highlight.js** - Syntax highlighting
- **mermaid** - Diagram rendering
- **MathJax** - Mathematical notation rendering
- **DOMPurify** - HTML sanitization

## Getting Started

### Prerequisites

- Bun (latest version)

### Installation

Install dependencies:

```bash
bun install
```

### Development

Run the development server:

```bash
bun run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

### Type Checking

Run type checking:

```bash
bun run check
```

Run type checking in watch mode:

```bash
bun run check:watch
```

## Usage

### Searching Repositories

You can search for repositories in two ways:

1. **GitHub URL**: Paste the full GitHub URL
   - Example: `https://github.com/vercel/next.js`

2. **Owner/Repo format**: Enter the owner and repository name
   - Example: `vercel/next.js`

Press Enter or click the Search button to fetch repository information.

### Viewing README

After searching for a repository, a "View README.md" button will appear at the bottom of the page. Click it to open a modal with the full README content, including:

- Formatted markdown with proper styling
- Syntax-highlighted code blocks
- Rendered Mermaid diagrams
- Mathematical equations with MathJax
- Properly resolved images and links

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── GeometricBackground.svelte # Animated background
│   │   ├── ReadmeViewer.svelte        # README modal viewer
│   │   └── ui/                        # UI components
│   ├── github.ts                      # GitHub API integration
│   ├── languageColors.ts              # Language color mapping
│   └── utils.ts                       # Utility functions
├── routes/
│   ├── api/
│   │   └── github/
│   │       └── repos/
│   │           └── [owner]/
│   │               └── [repo]/
│   │                   ├── +server.ts        # API route for repo info
│   │                   └── readme/
│   │                       └── +server.ts    # API route for README
│   ├── +layout.svelte                 # Main layout
│   └── +page.svelte                   # Home page
└── app.css                            # Global styles
```

## Environment Variables

To avoid GitHub API rate limiting, you need to set up a GitHub Personal Access Token:

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate a new token with `public_repo` scope (or `repo` for private repos)
3. Add it to your Vercel project:
   - Go to your Vercel project settings
   - Navigate to Settings > Environment Variables
   - Add a new variable:
     - Name: `GITHUB_TOKEN`
     - Value: Your GitHub personal access token
     - Environment: Production, Preview, and Development
   - Save and redeploy

For local development, create a `.env` file in the root directory:

```
GITHUB_TOKEN=your_token_here
```

## Deployment

This project is configured for deployment on Vercel using the `@sveltejs/adapter-vercel` adapter with Node.js 20.x runtime.

Make sure to add the `GITHUB_TOKEN` environment variable in Vercel before deploying to avoid rate limiting issues.

## License

Private project.
