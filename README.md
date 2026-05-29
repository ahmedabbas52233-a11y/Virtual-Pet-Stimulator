<div align="center">

# 🐾 Virtual Pet Simulator

**Adopt · Raise · Evolve · Battle**

A browser-based virtual pet game — zero dependencies, zero install.

[▶ Play Live Demo](https://your-app.vercel.app) · [Report a Bug](https://github.com/YOUR_USERNAME/virtual-pet-simulator/issues)

![HTML](https://img.shields.io/badge/built%20with-HTML%2FCSS%2FJS-orange)
![No deps](https://img.shields.io/badge/dependencies-zero-brightgreen)
![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## 📁 Project Structure

```
virtual-pet-simulator/
├── index.html   — Semantic HTML shell (109 lines)
├── style.css    — 3D responsive design system (1009 lines)
├── game.js      — Full game engine + unit tests (1100 lines)
├── .gitignore
└── README.md
```

No `node_modules`. No `package.json`. No `requirements.txt`. No `vercel.json`.

---

## ✨ Features

| System | Detail |
|--------|--------|
| **5 pet types** | Dog, Cat, Fish, Dragon, Bunny — unique decay rates, battle stats, mood emojis |
| **Evolution** | Pets evolve at Level 5 → Wolf, Lynx, Leviathan, Elder, Hare |
| **Stat engine** | Cascading interdependencies — crises compound without being punishing |
| **Battles** | Turn-based ATK/DEF/SPD combat with crit chance and speed chains |
| **Weather** | 6 types firing every 8–14 ticks with type-specific effects |
| **3 traits** | Playful, Lazy, Gluttonous — real gameplay differences, not cosmetic |
| **XP & leveling** | Every action earns XP; level-ups grant stat boosts + coin rewards |
| **Shop & economy** | Passive coin income from thriving pets; 4 purchasable items |
| **11 achievements** | Tracked across all users and sessions |
| **Live sparklines** | SVG history charts per pet for HP, Happiness, Energy |
| **Delta indicators** | ▲▼ arrows on stat bars after every action and tick |
| **Toast system** | Contextual notifications for every action |
| **Critical alerts** | Auto-surfaces sick/starving/exhausted pets with one-click nav |
| **3 save slots** | Named slots with timestamps, via localStorage |
| **4 simultaneous users** | Alice, Bob, Charlie, Diana — each owns up to 3 pets |
| **Pet rename** | Inline edit with Enter key support |
| **Unit tests** | 20 tests runnable in browser console: `runTests()` |

---

## 🎨 3D Design System

The CSS is built around real 3D depth — not flat cards with shadow hacks:

- **Perspective engine** — `perspective: 1200px` on every interactive element
- **3D button press** — buttons lift `translateZ(6px)` on hover, press `translateZ(-2px)` on click
- **Pet chip tilt** — selected chip rotates `rotateY(-4deg)` with depth lift
- **Glass panels** — `backdrop-filter: blur(12px)` with gradient borders and top-edge highlights
- **Animated background** — perspective grid drifts upward, three ambient glow orbs float
- **Stat bar depth** — inset shadows for the track, gloss highlight on the fill bar
- **3D modal** — save slot modal opens with `rotateX` entry animation
- **Evolution glow** — evolved pets pulse with `box-shadow` colour matching their type

---

## 🚀 Run It

```bash
# Option 1 — double-click index.html (everything works except Save/Load)

# Option 2 — serve locally so Save/Load works
python -m http.server 8080
# Open: http://localhost:8080

# VS Code — right-click index.html → Open with Live Server
```

---

## 🎮 How to Play

1. Pick a **user tab** (Alice, Bob, Charlie, Diana)
2. Click a **pet chip** in the strip to select it
3. Use the **action buttons** — watch the ▲▼ delta arrows to see exactly what changed
4. On mobile — use the **bottom navigation** to switch between panels

### Action reference

| Action | Effect | Blocked when |
|--------|--------|-------------|
| Feed | −40 hunger, +6 happiness | Hunger < 8 (overfeed penalty) |
| Play | +20 happiness, −14 energy | Sick · Tired = 60% · Exhausted = −10 HP |
| Rest | +30 energy, +4 HP (or +10 HP if HP < 50) | — |
| Special | Type-unique bonus (halved when Sick) | — |

### Items

| Item | Effect | Cost |
|------|--------|------|
| Medicine | +20 HP · **+50 HP when Sick** | 25c |
| Prime Feast | −55 hunger, +10 happiness | 15c |
| Energy Drink | +45 energy | 18c |
| Fun Toy | +32 happiness, −12 energy | 12c |

### Earning coins
- Thriving pets (happiness > 65 AND health > 60 AND energy > 30) earn **+1 coin/tick**
- Win battles → **+20–50 coins + 30 XP**
- Level-up → **+25 coins** · Evolution → **+50 coins**

---

## ⚙️ What Was Fixed (Stability)

| Problem | Old | Fixed |
|---------|-----|-------|
| Decay too fast | Hunger +6/tick, feed −28 | Hunger +2/tick, feed −40 |
| Events too frequent | 22% per tick, ±15 magnitude | 10% per tick, ±10 magnitude |
| Weather too punishing | −14 happiness, every 5 ticks | −8 happiness, every 8–14 ticks |
| HP draining passively | −1 HP/tick always | 0 base — HP only from crises |
| Invisible sadness drain | Chronic sadness silently drained HP | Removed |
| Stale delta arrows | Only updated on tick | Updated on every user action too |

---

## 📱 Responsive Layout

| Screen | Layout |
|--------|--------|
| ≥ 1025px | Two-column grid — pet detail left, panels right |
| 741–1024px | Two-column, right panel 280px |
| ≤ 740px | Single column, sticky bottom nav for panel switching |
| ≤ 360px | Compact action grid, smaller tabs |

---

## 🧪 Unit Tests

Open the browser console and run:

```js
runTests()
```

Covers: `CL()` clamp edge cases · `xpNeed()` formula · `gst()` all 6 states · `mkPet()` structure · battle ATK formula.

---

## 💾 Save Slots

- **3 named slots** with timestamps
- Click **Save** → pick a slot → stored to `localStorage`
- Click **Load** → pick a slot → full state restored
- Saves: pets, pool, inventory, coins, achievements, evolution state, tick count
- Requires HTTP (not `file://`) — use Live Server or Vercel

---

## 🌐 Deploy to Vercel

```
1. Push to GitHub (repo must be Public)
2. vercel.com → Add New Project → Import from GitHub
3. Framework Preset: Other
4. Build Command: (leave empty)
5. Output Directory: (leave empty)
6. Deploy → live in ~30 seconds
```

No `vercel.json` needed. Vercel detects `index.html` automatically.

---

## 🔧 Git Quick Reference

```bash
# First time
git init
git add .
git commit -m "Initial commit: Virtual Pet Simulator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/virtual-pet-simulator.git
git push -u origin main

# Every update
git add .
git commit -m "what you changed"
git push
# Vercel auto-redeploys from every push
```

---

## 📊 vs Original Java Version

| Feature | Java Console | Browser v4 |
|---------|-------------|-----------|
| Files | 1 × 400-line file | 3 files, separated concerns |
| Pet types | 3 | 5 + evolved forms |
| Architecture | No separation of concerns | HTML / CSS / JS + state machine |
| Stat system | Independent | Cascading interdependencies |
| Multiple users | No | 4 users, 3 pets each |
| Traits | No | 3 with real gameplay effects |
| Weather | No | 6 types, type-specific |
| Evolution | No | Level 5 unlock |
| Battles | No | Turn-based ATK/DEF/SPD |
| XP & leveling | No | Full curve + coin rewards |
| Achievements | No | 11 achievements |
| Visualization | No | Sparklines + delta arrows |
| Save system | No | 3 named slots with timestamps |
| Unit tests | No | 20 browser-console tests |
| Mobile layout | No | Fully responsive, bottom nav |

---

## 📄 License

MIT — free to use, fork, and deploy.
