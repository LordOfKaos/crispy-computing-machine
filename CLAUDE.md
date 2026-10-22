# Working agreement

## Every change goes through a branch and a pull request

- Never commit or push directly to `main`. Pushes to `main` deploy the live site to GitHub Pages.
- For each change, start a new branch from the latest `main` (`git fetch origin main && git checkout -b <type>/<short-description> origin/main`), using a prefix such as `feature/`, `fix/` or `chore/`.
- Run `npm run build` (typecheck + build) before pushing.
- Push the branch and open a pull request into `main`. The description should record:
  - **Summary**: what changed and why
  - **Changes**: the main files and areas touched
  - **Testing**: what was run or checked, and the results
- Leave merging to the repository owner unless they ask otherwise. Merging deploys the site.
