# AGENTS.md

This repository is TypeScript-first. Follow these rules when generating or modifying code.

## Tooling & package manager

- Use **npm** (not pnpm/yarn/bun).
- Install deps with:
  - `npm ci` (CI / clean installs)
  - `npm install` (local dev only, when appropriate)
- Run scripts with `npm run <script>`.

If `package-lock.json` exists, keep it updated. Do not introduce a different lockfile.

## Project goals

- Prefer correctness, clarity, and maintainability over cleverness.
- Keep changes minimal and scoped to the request.
- Avoid breaking public APIs unless explicitly asked.

## TypeScript rules

- TypeScript **strict mode** is assumed.
- Do not use `any` unless absolutely necessary; prefer `unknown` + narrowing.
- Prefer `interface` for object shapes that are meant to be extended; `type` for unions/utility composition.
- Prefer explicit return types on exported functions and public methods.
- Avoid non-null assertions (`!`). If you must use one, explain why and add a guard if possible.
- Never ignore type errors. Fix the types.

## Coding standards

- Prefer small, composable modules.
- Use pure functions where reasonable; isolate side effects.
- Keep cyclomatic complexity low: refactor deeply nested logic.
- Use early returns over deep nesting.
- Validate inputs at boundaries (HTTP handlers, CLI args, public functions).
- Handle errors intentionally:
  - Throw typed/custom errors for domain logic.
  - Return `Result`-style objects only if the codebase already uses that pattern.
- Do not log secrets or PII.

## Architecture & design patterns (apply pragmatically)

Use patterns when they reduce complexity and improve testability:

- **Dependency Injection**: Pass dependencies (clients, repositories, clocks) as parameters or constructor args.
- **Adapter**: Wrap external APIs in thin adapters to keep the core domain stable.
- **Strategy**: Use for interchangeable algorithms (e.g., pricing rules, formatters).
- **Factory**: Use for complex construction when it clarifies setup.
- **Repository**: Encapsulate persistence concerns behind an interface.
- **Command / Handler**: For discrete actions with clear inputs/outputs.
- **Observer / Events**: Only when the codebase already has an eventing approach.

Avoid over-engineering:
- Don’t introduce a pattern unless it clearly improves the code.
- Prefer simple functions over classes unless state/lifecycle is needed.

## Async/concurrency guidelines

- Prefer `async/await`.
- Avoid unbounded parallelism (`Promise.all` on large arrays). Use batching/limits if needed.
- Always handle rejection paths; don’t leave floating promises.
- Use timeouts / abort signals for network calls where appropriate.

## Security & safety

- Treat all external input as untrusted.
- Use parameterized queries for DB access.
- Escape/encode output in templating contexts.
- Avoid dynamic `eval`, `Function`, or unsafe deserialization.
- Follow the principle of least privilege for tokens/permissions.

## Testing expectations

- Add or update tests for behavior changes and bug fixes.
- Prefer deterministic tests; avoid relying on real time or network.
- Use fakes/mocks via dependency injection (prefer fakes over heavy mocks).
- Test at the right level:
  - Unit tests for domain logic.
  - Integration tests for adapters and persistence (when feasible).

If a test is not added, include a short explanation in the PR/summary.

## Formatting & linting

- Respect existing lint/format configuration.
- Do not reformat unrelated files.
- Keep imports organized (follow existing conventions).

## Documentation

- Update README/inline docs when behavior or public interfaces change.
- Add JSDoc/TSDoc for exported APIs when it clarifies usage and constraints.

## Git / change hygiene

- Make atomic, logically grouped commits when possible.
- Do not include generated artifacts unless the repo expects them.
- Keep diffs focused: no drive-by renames or sweeping refactors unless requested.

## Output expectations (when you generate code)

When presenting changes:
- Summarize what you changed and why.
- Call out any tradeoffs, risks, or assumptions.
- Provide exact commands to verify locally, typically:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

If some scripts don’t exist, suggest the closest available commands from `package.json`.

## Default project structure (if unspecified)

If you need to create new files and the repo has no established structure, prefer:

- src/ for implementation
- src/__tests__/ or test/ for tests (match existing patterns)
- src/lib/ for reusable modules
- src/domain/ for core business logic
- src/adapters/ for external integrations
- src/api/ for HTTP handlers/routes

Always align to the repository’s existing conventions first.