# Tanzania Rabies Dashboard

A situational dashboard for tracking rabies cases and vaccinations across Tanzania's 31 administrative regions.

## Features

- Interactive chloropleth map of Tanzania showing:
  - Administrative regions with coloring based on vaccine stock levels
  - High-risk bite case markers
  - Rabies death markers
- Linked bar chart visualization showing:
  - Regional bite data (low-risk, high-risk, and deaths)
  - Vaccine stock levels
- Expandable data tables for detailed analysis
- Region/district search functionality
- OAuth authentication
- Toast notifications for system alerts
- Optimized for performance on slow connections

## Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS
- **Visualizations**: Nivo for maps and charts
- **Data Tables**: Svelte-table
- **Notifications**: [svelte-hot-french-toast](https://svelte-hot-french-toast.vercel.app/)
- **Authentication**: Auth.js (formerly NextAuth)

## Getting Started

### Prerequisites

- Node.js (see `.nvmrc` for the recommended version)
- Google OAuth credentials (for authentication)

### Setup

```sh
# Clone the repository
git clone https://github.com/RabiesResearch/audrey.git
cd audrey

# Use correct node version
nvm use

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Google OAuth credentials:
# AUTH_GOOGLE_ID=your-google-oauth-client-id
# AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
# AUTH_SECRET=your-auth-secret-key-at-least-32-characters

# Start development server
npm run dev

# Build for production
npm run build
```

### Authentication Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5173/auth/callback/google` (for development)
5. Copy the Client ID and Client Secret to your `.env` file
6. Generate a secure random string for `AUTH_SECRET` (at least 32 characters)

## Project Structure

- `/src/lib/components` - Reusable UI components
- `/src/lib/data` - Data sources and utilities
- `/src/routes` - SvelteKit page routes
- `/static/data` - Static GeoJSON files for Tanzania

## Development Roadmap

See the [Issues](https://github.com/RabiesResearch/audrey/issues) for detailed development tasks and progress.
