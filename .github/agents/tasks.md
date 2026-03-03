# 🎮 9DTTT — Agent Task Queue

> **Classification: ALL AGENTS**
> This is the active task and coordination log for the 9DTTT agent team.
> Before starting any task, check this file for conflicts on the same files.
> After completing a task, update the status here.
>
> **NO SECRETS.** This file is version-controlled.

---

## How to Use This File

### Claiming a Task

Before touching any shared file (`server.js`, `server/gameManager.js`,
`server/auth.js`, `Public/js/multi-chain-wallet.js`), add an entry to the
**Active Tasks** section:

```markdown
### [YYYY-MM-DD] Task: <short title>
- **Agent**: <agent-file-name or "copilot">
- **Files**: `path/to/file.js`
- **Status**: `in_progress`
- **What**: one-line description of the change
- **Blocks**: any agents that must wait (or "none")
```

### Completing a Task

Change `Status` to `complete` and move the entry to **Completed Tasks**.

---

## Active Tasks

_No active tasks._

---

## Completed Tasks

### [2026-03-03] Task: Enhance agent infrastructure
- **Agent**: copilot
- **Files**: `.github/agents/README.md` (new), `.github/agents/bootstrap.md` (new),
  `.github/agents/game-tester.md` (new), `.github/agents/tasks.md` (new),
  `.github/agents/agent.md` (rewritten for 9DTTT),
  `.github/agents/fullstack-dev.md` (rewritten for 9DTTT),
  `.github/agents/memory.md` (rewritten for 9DTTT),
  `.github/agents/my-agent.agent.md` (rewritten for 9DTTT),
  `.github/agents/Web3_agent.md` (rewritten for 9DTTT)
- **Status**: `complete`
- **What**: Replaced all stale FizzSwap/naming-service agent files with accurate
  9DTTT context. Added README agent index, local bootstrap guide, GameTesterQA
  agent, and task queue. Matched the agent structure from the other repo.

### [2026-03-03] Task: Fix game bugs — pong, brain-age, crypto-quest, thirteen
- **Agent**: copilot (fullstack-dev sub-agent)
- **Files**: `Public/games/pong.html`, `Public/js/brain-age.js`,
  `Public/games/crypto-quest.html`, `Public/games/thirteen.html`
- **Status**: `complete`
- **What**: Fixed keyboard input bug in Pong, currentGame not set bug in Brain Age,
  missing closeInfo() in Crypto Quest, missing #play-type element in Thirteen.

---

## Known Conflicts / Lock Table

| File | Locked By | Since | Expected Release |
|------|-----------|-------|-----------------|
| _(none)_ | — | — | — |

---

*🎮 Check this file before touching any shared server or auth module.*
*Game on. Play fair. Ship quality.*
