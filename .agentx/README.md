# AgentX Pack for 9dttt

This repository is upgraded with AgentX capabilities — now at **AAA game studio quality** standards.

## Included
- `agents.json`: merged core + imported + custom per-repo agents (59 total)
- `access_profiles.json`: safe/balanced/power profiles
- `agency_import.json`: imported agents from agency-agents

## 9DTTT Game Studio Agents

| Agent ID | Role | Profile |
|----------|------|---------|
| `9dttt-game-creative-director` | Creative vision, MDA framework, pillar guardianship | balanced |
| `9dttt-game-technical-director` | Architecture, performance budgets, ADRs, technical invariants | balanced |
| `9dttt-game-designer` | GDD authoring, balancing, economy design, edge cases | balanced |
| `9dttt-gameplay-programmer` | Mechanic implementation, RAF lifecycle, input handling | balanced |
| `9dttt-cybersecurity-expert` | XSS, JWT, WebSocket, web3 wallet security | balanced |
| `9dttt-implementation-pilot` | Scoped code changes with validation | balanced |
| `9dttt-orchestrator` | Multi-agent coordination and handoffs | power |
| `9dttt-repo-architect` | Repository architecture consistency | balanced |

## Custom Agent Files (`.github/agents/`)

| File | Agent | Purpose |
|------|-------|---------|
| `fullstack-dev.md` | Full-Stack Dev | Backend + frontend implementation |
| `game-tester.md` | GameTesterQA | Comprehensive QA across all 35 games |
| `game-creative-director.agent.md` | Game Creative Director | Creative vision + MDA framework |
| `game-technical-director.agent.md` | Game Technical Director | Architecture + performance |
| `game-designer.agent.md` | Game Designer | GDD + balancing + systems |
| `gameplay-programmer.agent.md` | Gameplay Programmer | Clean, data-driven code |
| `cybersecurity-expert.agent.md` | Cybersecurity Expert | Security audits + remediations |
| `Web3_agent.md` | Web3 Specialist | Multi-chain wallet + blockchain |
| `my-agent.agent.md` | Platform Expert | General platform questions |
| `games-master.yml` | Games Master | Game logic + multiplayer mechanics |

## Suggested commands
```bash
agentx find 9dttt
agentx check 9dttt-game-technical-director --profile balanced
agentx check 9dttt-orchestrator --profile power
agentx check 9dttt-cybersecurity-expert --profile balanced
```
