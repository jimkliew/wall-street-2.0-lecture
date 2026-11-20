# Wall Street 2.0 — Hyundai ↔ JPMorgan AI-agent FX classroom lab

**28-slide classroom edition · November 2026**

This repository contains an educational, local-only demonstration of two simulated
AI agents exchanging KRW for USD: Hyundai (treasury/customer) and JPMorgan (bank/FX).

## The point

A chat message is not a payment. Each agent proposes actions. Trusted tools enforce
independent identity, policy, quotation, execution, and audit boundaries.

## What students get

- **PowerPoint**: `Wall_Street_2_Agentic_FX_Classroom_Edition.pptx` (28 slides)
- **Interactive site**: `index.html` (28 slide images + transaction simulator)
- **Python demonstration**: `source/agent_fx_demo.py` (no external dependencies)
- **Architecture notes**: `source/ARCHITECTURE.md`
- **Teaching exercises**: `STUDENT_EXERCISES.md`

The example buys **USD 100,000** for **KRW 145,000,000** at a fictional rate of
1 USD = 1,450 KRW. Hyundai allows up to USD 250,000 per trade and 500,000/day;
JPMorgan allows up to USD 1,000,000 per trade and 2,000,000/day. These are
**invented teaching limits**, not actual JPMorgan/Hyundai controls.

## How to publish to GitHub Pages

1. Create a GitHub repository (for example `wall-street-2.0-lecture`).
2. Upload the **contents of this folder** to the repository root, including `index.html`,
   `data.js`, `app.js`, `simulator.js`, `styles.css`, `assets/`, and `source/`.
3. In the repository, choose **Settings → Pages → Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.
5. Share the Pages URL with students. The PowerPoint download is linked in the site's header.

Alternatively, upload via command line from this folder:

```bash
git init
git add .
git commit -m "Classroom edition: agentic FX agents and governance"
git branch -M main
git remote add origin https://github.com/jimkliew/wall-street-2.0-lecture.git
git push -u origin main
```

Create the repository `wall-street-2.0-lecture` in the GitHub account `jimkliew` before using these commands. Live at https://jimkliew.github.io/wall-street-2.0-lecture/.

## Local use

Open `index.html` in a modern browser. For the independent Python demo:

```bash
python source/agent_fx_demo.py
```

For a local HTTP server (optional):

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Limits and important safety notes

- Simulated agents, prices, services, balances and in-memory ledger; no bank connections,
  payments, live AI model calls, or API keys.
- Simplified demo credentials are **not** production-grade authentication.
- The in-browser simulator and Python demo illustrate shared core policy concepts;
  they are not two implementations of an identical production-grade bank protocol.
- Some newer failure scenarios are conceptual drills; not every one is fully modeled
  by the Python demonstration.
- The CNBC article image on slide 2 and third-party Hyundai/JPMorgan brand marks
  are included as teaching references. Before publishing a **public** repository,
  review rights to redistribute the copyrighted article screenshot and logos;
  where necessary, replace the screenshot with a headline, citation, and link.
- No official affiliation with JPMorgan, Hyundai, or CNBC is implied.

## Suggested classroom sequence

1. Present the slides through the chat-only example.
2. Run **Normal exchange**, then **Chat only** in the interactive website.
3. Ask students to predict failure outcomes, then run the scenarios.
4. Use the Source Code tab to examine `AgentIdentity`, `Policy`, and `execute()`.
5. Assign the exercises and ask which controls must live outside the LLM.

## New: decorators lesson and quiz

- The **uploaded, repaired 26-slide deck** was used as the base. Two slides were inserted after the data-model slide: a decorator walkthrough and a short in-class check.
- The website includes `decorator_quiz.html` with five graded practice questions.
- `data.js` and all slide images were regenerated from this final 28-slide deck.
- This is a public classroom simulation, not an authentication or payment implementation.

## Rights note

The deck includes CNBC article imagery and Hyundai/JPMorgan/Johns Hopkins brand material. Check redistribution permissions before placing the repository on GitHub publicly, and replace copyrighted images if necessary.
