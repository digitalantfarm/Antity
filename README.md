# Antity

[Antity](http://digitalantfarm.github.io/Antity/) is a digital art project by [Japh](https://twitter.com/Japh).

It's an exploration in the simulated organic movement of simple digital entities with basic artificial intelligence and neutral networks.

![Screenshot - Mobile](https://raw.githubusercontent.com/digitalantfarm/Antity/master/IMG_6933.PNG)

In its current infant form, everything is based on randomness and probability. AI is yet to be developed.

## What it is

Antity is a browser-based artificial life simulation, or "digital ant farm". It's a static, client-side HTML/JS project (no build step, no server) rendered with [PixiJS](https://www.pixijs.com/) that spawns simple lifeforms — Antities (ants) and Plantities (plants) — into a 2D world and lets them live out simple behaviours entirely on their own.

## How it works

- **Genomes** are defined as JSON files (`js/antity-type1-genome.json`, `js/antity-type2-genome.json`, `js/plantity-type1-genome.json`). Each genome describes chromosomes and genes for traits like `speed`, `size`, `diet`, `personality`, `maturation`, and `energy`, each with an optional deviation range.
- On load, each entity rolls its own **genotype** from its genome, applying random deviation within the defined ranges, so no two entities are identical even from the same genome.
- **Antities** wander the canvas, searching for the nearest living **Plantity** to eat. When hungry, an Antity hunts its nearest food target; on collision it switches to an `eating` state and drains the plant's energy until it dies.
- **Plantities** exist passively, shrinking as their energy is consumed and disappearing once energy hits zero.
- Colour and size are derived from genotype (e.g. an Antity's tint is hashed from its `diet` + `personality` genes; a Plantity's size scales with its remaining `energy`).
- Clicking anywhere on the page spawns a new Plantity, letting a visitor feed the ecosystem.

## Project layout

- `index.html` — the main entry point, driven by `js/dna.js` (genome-driven Antity/Plantity simulation on a single `requestAnimationFrame` loop).
- `worker.html` / `js/world.js` / `js/worker.js` / `js/antity.js` / `js/byproduct.js` — an alternate, older prototype where each Antity runs inside its own Web Worker, communicating with the main thread via `postMessage`, and can spawn `Byproduct`s that occasionally hatch into new Antities.
- `easel.html`, `pixi.html`, `terra.html`, `old.html`, `test.html` — earlier experiments and scratch pages from the project's development.
- `css/`, `img/` — stylesheets and sprite assets (ant/plant sprites, spritesheets).

This is an ongoing art/experimentation project rather than a finished product — expect prototypes, dead code paths, and rough edges alongside the main simulation.
