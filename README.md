# 🤖 AI Stack Planner

> Personalized AI stack recommendation platform that turns your goals, budget, and workflow needs into curated AI tool bundles for Indian users.

[![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-222?logo=githubpages&logoColor=white)](https://pages.github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**[🚀 Live Demo](https://OM-DHOMNE.github.io/ai-stack-planner/)** &nbsp;·&nbsp; 

---

<!-- Replace with actual screenshot / GIF -->
![AI Stack Planner demo](assets/demo.gif)

---

## Key metrics

| | |
|---|---|
| **25+** AI tools reviewed | **6** bundle archetypes |
| **₹0** minimum viable stack | **3** decision layers |

---

## What it does

AI Stack Planner helps users pick the right AI tools without wasting time or money.

Input:
- role
- use case
- budget
- priority
- optional needs like image generation, workflow automation, long context, privacy, and integrations

Output:
- recommended AI stacks
- cheapest / fastest / best-output / privacy-first options
- tradeoffs, pros, cons, and compatibility notes
- official links for every tool

The app is designed for Indian users, with prices shown in ₹ and practical notes around payment friction, context limits, and bundle compatibility.

---

## Key findings

- **Use-case fit matters more than tool popularity** — the best stack is often a bundle, not a single “best model”.
- **Token burn / context limits can change the recommendation** — Claude, Gemini, and GPT behave very differently for long-document workflows.
- **Tool overlap creates regret** — the app avoids recommending redundant tools that solve the same job.
- **Indian payment friction is real** — pricing and payment support are surfaced upfront so users can choose stacks they can actually buy.

---

## Architecture

```text
User role + use case + budget + priorities
                │
                ▼
       Intent parsing layer
   (role, budget, feature flags)
                │
                ▼
      Tool scoring engine
(use case fit, budget fit, priority fit,
 token risk, India payment friction)
                │
                ▼
      Bundle assembly engine
(best, budget, speed, privacy, power)
                │
                ▼
  Tradeoff + compatibility narrative
                │
                ▼
     Results UI + comparison table
