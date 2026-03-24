<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Browser Automation

Use `agent-browser` for web automation, testing, and interaction simulation.

Core workflow:
1. `agent-browser open <url>` — Navigate to a page
2. `agent-browser snapshot -i` — Get interactive elements with refs (`@e1`, `@e2`, etc.)
3. `agent-browser click @e1` / `agent-browser fill @e2 "text"` — Interact using refs
4. Re-snapshot after page changes to get updated refs
5. `agent-browser close` — Close the browser session

Useful commands:
- `agent-browser console` — View console logs and errors
- `agent-browser screenshot [path]` — Take visual screenshots
- `agent-browser --help` — See all available commands