# MD-Docs

A personal wiki and documentation system built with Next.js. Write your documents in Markdown, organize them in folders, and access them from anywhere.

## Features

- **Markdown Support**: Write documents in familiar Markdown syntax
- **BBCode Extensions**: Extended formatting with BBCode syntax
- **Backlinks**: Automatic bidirectional linking between documents
- **Full-text Search**: Fast search across all your documents
- **GitHub Integration**: Store your documents in a GitHub repository
- **Public/Private Visibility**: Share specific documents publicly while keeping others private
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A GitHub account (for OAuth and document storage)

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/yourusername/md-docs.git
cd md-docs
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with the following variables:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Step 1: Fork the Repository

Fork this repository to your own GitHub account.

### Step 2: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: MD-Docs (or your preferred name)
   - **Homepage URL**: Your Vercel app URL (e.g., `https://your-app.vercel.app`)
   - **Authorization callback URL**: `https://your-app.vercel.app/api/auth/callback/github`
4. Click "Register application"
5. Generate a new client secret
6. Save the Client ID and Client Secret

### Step 3: Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import your forked repository
4. Configure the environment variables:
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth Client Secret
   - `NEXTAUTH_URL`: Your Vercel app URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`: A random string for session encryption (generate with `openssl rand -base64 32`)
5. Click "Deploy"

### Step 4: Update GitHub OAuth App

After deployment, update your GitHub OAuth App's callback URL with your actual Vercel URL:
- `https://your-actual-app-name.vercel.app/api/auth/callback/github`

## Document Visibility

Documents can be either **private** (default) or **public**.

### Making a Document Public

Add `public: true` to the document's frontmatter:

```yaml
---
title: My Public Document
public: true
---

This document is publicly accessible at /p/my-public-document
```

### Making a Folder Public

Create a `_folder.json` file in the folder:

```json
{
  "title": "Public Folder",
  "public": true
}
```

All documents in this folder will be public by default (unless they explicitly set `public: false`).

### Access Rules

| Route | Authentication |
|-------|---------------|
| `/` | Public |
| `/p/*` | Public (public documents only) |
| `/docs/*` | Required |
| `/edit/*` | Required |
| `/api/github/*` | Required |

## Project Structure

```
md-docs/
├── content/           # Local markdown documents (fallback)
├── src/
│   ├── app/           # Next.js app router pages
│   │   ├── docs/      # Private document routes
│   │   ├── edit/      # Document editor
│   │   └── p/         # Public document routes
│   ├── components/    # React components
│   ├── lib/           # Utility functions
│   └── types/         # TypeScript types
├── vercel.json        # Vercel deployment config
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | Yes |
| `NEXTAUTH_URL` | Your app's base URL | Yes |
| `NEXTAUTH_SECRET` | Random string for session encryption | Yes |

## License

MIT License - See [LICENSE](LICENSE) for details.
