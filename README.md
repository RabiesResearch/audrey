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

```sh
# Clone the repository
git clone https://github.com/RabiesResearch/audrey.git
cd audrey

# Use correct node version
nvm use

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

- `/src/lib/components` - Reusable UI components
- `/src/lib/data` - Data sources and utilities
- `/src/routes` - SvelteKit page routes
- `/static/data` - Static GeoJSON files for Tanzania

## Development Roadmap

See the [Issues](https://github.com/RabiesResearch/audrey/issues) for detailed development tasks and progress.
