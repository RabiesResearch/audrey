This is a Svelte based dashboard for visualising the latest rabies situation in Tanzania.

## Code Standards

### Required for dev set up

- Before anything else, ensure you have nvm installed and use the .nvmrc file to set the Node.js version to v22, i.e. `nvm use`
- Install dependencies using `npm install`
- Ensure submodules are initialized and updated with `git submodule update --init --recursive`

### Required Before Each Commit

- Run `npm run format` before committing any changes to ensure proper code formatting
  - This will run prettier on all .svelte, .css, .ts and .html files to maintain consistent style
- Run `npm run lint` before committing any changes to ensure no warnings or errors
  - This will run eslint on all .svelte and .ts files to maintain code quality
- Run `npm run check` before committing any changes to ensure there are no transpile warnings or errors
  - This will run svelte-check to check for type errors and other issues in Svelte files

### Commit message formatting

- Use conventional commit messages for clarity and consistency
- Use gitmojis after the colon to indicate the type of change with a bit of fun
- Example: `feat: ✨ add new feature for Audrey`

### Pull Requests

- Use conventional commit style for PR titles with gitmojis
- Example: `feat: ✨ add new feature for Audrey`
- Ensure PRs are descriptive and include context on what was changed and why
- Use the PR description to explain the changes and any relevant context
- Link to any relevant issues or discussions
- After making changes following a code review, rerequest review from the original reviewer

## Key Guidelines

1. Follow promptfoo best practices and idiomatic patterns
2. Maintain existing code structure and organization
