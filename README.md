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

| Layer      | Tools                                          |
| ---------- | ---------------------------------------------- |
| Frontend   | React, Vite                                    |
| Styling    | CSS / responsive layout                        |
| Data       | JSON-based tool catalog and bundle definitions |
| Logic      | Rule-based recommendation engine               |
| Deployment | GitHub Pages                                   |


| Section             | What it shows                                                     |
| ------------------- | ----------------------------------------------------------------- |
| Landing / Hero      | Clear value proposition and CTA                                   |
| Questionnaire       | Role, budget, priority, and optional needs                        |
| Recommended Bundles | Best overall, cheapest, fastest, privacy-first, best for builders |
| Bundle Detail       | Pros, cons, tradeoffs, compatibility notes, source links          |
| Comparison Table    | Tool-by-tool comparison with pricing and capability summary       |


Recommendation logic

The engine scores every tool internally using:

use-case fit
role fit
budget fit
priority alignment
feature flags
token exhaustion risk
Indian payment friction

Then it assembles bundles that minimize overlap and maximize practical usefulness.

The UI does not show raw scores.
It shows:

bundle names
fit explanations
pros / cons
tradeoffs
compatibility notes
official source links

That keeps the product explainable and user-friendly.

Bundle archetypes

The app ships with 6 core bundle types:

Best overall match
Lowest cost
Fastest to ship
Privacy-first
Maximum output
Best for builders

Each bundle shows:

tools included
estimated monthly cost in ₹
why it fits
what to watch out for
what overlaps or conflicts
official links
India-first design choices

This project is specifically optimized for Indian users:

prices shown in ₹/month
default estimates for common subscriptions
Indian payment friction noted clearly
native UPI / Indian card support highlighted where relevant
workarounds surfaced only when necessary
bundle recommendations consider practical affordability
Design philosophy
Start with the user’s decision, not the tool catalog
Show the top recommendation first
Keep the UI opinionated but transparent
Make tradeoffs visible instead of hiding them
Optimize for Indian budgets and buying constraints
Avoid raw scores in the UI; show human-readable reasoning
Keep the app clean, premium, and product-like
