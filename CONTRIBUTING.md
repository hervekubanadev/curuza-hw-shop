# Contributing to CURUZA

Thank you for considering contributing to CURUZA. This document outlines the development workflow, branching strategy, and quality standards for this project.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Code Review Checklist](#code-review-checklist)
- [Development Setup](#development-setup)
- [Running Tests](#running-tests)

## Development Workflow

1. Pick or create an issue and assign it to yourself.
2. Create a branch from `main` following the branching strategy below.
3. Make changes in small, logical commits following the commit convention.
4. Run lint, typecheck, and tests locally before pushing.
5. Open a Pull Request against `main` and request review.
6. Address review feedback and ensure CI passes.
7. Squash-merge once approved.

## Branching Strategy

| Branch pattern      | Purpose                          |
| ------------------- | -------------------------------- |
| `main`              | Production-ready code            |
| `feat/*`            | New features                     |
| `fix/*`             | Bug fixes                        |
| `chore/*`           | Maintenance, config, deps        |
| `docs/*`            | Documentation only               |
| `refactor/*`        | Code restructuring               |
| `release/*`         | Release preparation              |

Branches should be short-lived. Rebase onto `main` frequently to keep history linear.

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`, `style`.
Scopes: `ui`, `api`, `auth`, `inventory`, `sales`, `debts`, `docker`, `ci`, etc.

Examples:
- `feat(inventory): add bulk stock adjustment`
- `fix(sales): correct tax calculation for VAT invoices`
- `ci: add security audit job to workflow`
- `docs: add contributing guide`

## Pull Request Process

1. Title must follow the commit convention (e.g., `feat: add bulk stock adjustment`).
2. Description must include:
   - What this PR does
   - Why it is needed (link to issue)
   - Screenshots / screen recordings for UI changes
   - Migration instructions if schema changes
3. Ensure the PR template is filled out.
4. Assign at least one reviewer.
5. Do not merge until CI is green and all conversations are resolved.

### PR Template

```markdown
## Description

[Brief description of changes]

## Related Issue

Closes #[issue-number]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation
- [ ] Refactor
- [ ] CI / DevOps

## Testing

- [ ] Lint passes (`bun run lint`)
- [ ] Type check passes (`bunx tsc --noEmit`)
- [ ] Build passes (`bun run build`)
- [ ] Tests pass (`bunx vitest run`)

## Screenshots (if applicable)

[Add screenshots]

## Checklist

- [ ] My code follows the project style
- [ ] I have performed a self-review
- [ ] I have commented complex logic
- [ ] I have updated documentation if needed
- [ ] My changes generate no new warnings
```
```

## Code Review Checklist

Reviewers should verify:

- **Correctness**: Does the code do what it claims?
- **Security**: Are RLS policies respected? Are user inputs validated? No secrets leaked?
- **Performance**: Are N+1 queries avoided? Are indexes appropriate?
- **Maintainability**: Is the code readable? Are functions small and focused?
- **Testing**: Are there tests for edge cases?
- **Error handling**: Are errors caught and surfaced appropriately?
- **TypeScript**: Are types strict? Any `any` or unsafe casts?
- **Accessibility**: Are UI changes keyboard-navigable? Do ARIA labels exist?
- **i18n**: Are user-facing strings ready for translation?
- **Migration safety**: Are schema changes backward-compatible?

## Development Setup

```bash
bun install
cp .env.example .env
bun run dev
```

See [README.md](README.md) for full setup instructions.

## Running Tests

```bash
# All tests
bunx vitest run

# Watch mode
bunx vitest

# With coverage
bunx vitest run --coverage
```

## Questions?

Open a [Discussion](https://github.com/hervekubanadev/curuza-hw-shop/discussions) or reach out to the maintainers.
