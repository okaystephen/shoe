# 👟 Find That Shoe!

A tap-based browser game built with React — a remake of a C terminal game [originally written for CCPROG1 (December 2018)](https://github.com/okaystephen/find-that-shoe.git).

You're somewhere in a two-storey house and one of your shoes is missing. Navigate room by room, pet your dog, pick up toys, and find that shoe before you run out of patience.

---

## Gameplay

- **Search** each room for the shoe. You get up to 5 tries per room (+2s per attempt).
- **Pet your dog** (Bailey or Kahlua) when they show up for a ♡, which deducts 2s from your final time.
- **Pick up dog toys** scattered around the house and drop them in a bin for another ♡ each.
- **Hands full?** If you're carrying 2 toys and walk into a room with another one on the floor, you'll step on it (+3s penalty).
- The game ends when you find the shoe **with empty hands** — drop any toys in a bin first.

### Time scoring

| Event | Effect |
|---|---|
| Each search attempt | +2s |
| Stepping on a toy | +3s |
| Each heart collected | −2s |

**Final time** = real elapsed time + penalties − (hearts × 2)

---

## House layout

### Ground floor

| Room | Adjacent to |
|---|---|
| Garage | Foyer |
| Covered Entry | Foyer, Garden |
| Foyer _(stairs)_ | Garage, Covered Entry, Living Room, Hallway |
| Powder Room | Living Room |
| Living Room | Covered Terrace, Dining Room, Kitchen, Powder Room, Foyer |
| Dining Room | Covered Terrace, Kitchen, Living Room |
| Kitchen | Dining Room, Living Room |
| Covered Terrace 🟢 | Garden, Dining Room, Living Room |
| Garden | Covered Entry, Covered Terrace |

### Second floor

| Room | Adjacent to |
|---|---|
| Hallway _(stairs)_ | Master Bedroom, Your Bedroom, Guest Suite, Bathroom #2, Laundry Room, Linen Closet, Foyer |
| Master Bedroom | Hallway, WIC (Master) |
| WIC (Master) | Master Bedroom, Bath (Master) |
| Bath (Master) | WIC (Master) |
| Your Bedroom 🟢 | Hallway, Your WIC |
| Your WIC | Your Bedroom |
| Guest Suite | Hallway |
| Bathroom #2 | Hallway |
| Laundry Room | Hallway |
| Linen Closet | Hallway |

🟢 = toy bin location (also in Garage)

---

## Try it out

```bash
https://okaystephen.github.io/shoe
```

---

## Tech

- React 18 (hooks only — `useState`, `useEffect`, `useRef`, `useCallback`)
- Tailwind CSS (utility classes, no custom config needed)
- No external game libraries or state managers

---

## Origin

Originally written in C as a machine project for **CCPROG1 (X22)** at De La Salle University, December 3, 2018. The original used `scanf`/`printf` for all I/O, `goto` for flow control, and `time.h` for the game clock. This version preserves the exact room graph, adjacency rules, toy bin locations, scoring logic, and dog name assignments from the original source.
