# RealWorldClaw — Community Launch Posts Draft

> Status: DRAFT — For review before posting.
> Last updated: 2026-03-17

---

## 1. Reddit

### r/opensource

**Title:** RealWorldClaw – open-source platform for AI agents to control physical devices (ESP32 starter kit ~$10)

**Body:**

Hey r/opensource,

I've been working on [RealWorldClaw](https://github.com/brianzhibo-design/RealWorldClaw), a project that gives AI agents a standardized way to interact with the physical world.

The core idea: most AI agent frameworks are great at reasoning and tool-calling, but "tools" are almost always software APIs. What if your agent could also flip a relay, read a temperature sensor, or trigger a motor — without you writing custom glue code each time?

**What it is:**

- A lightweight protocol (v0.1, now frozen) that any AI agent can speak to control hardware modules
- Python & TypeScript SDKs
- A module registry with reusable device drivers
- 5 working scenario examples (smart thermostat, light control, etc.)
- Docker one-command local setup
- Apache 2.0 licensed

**Getting started is cheap:** An ESP32 + DHT22 sensor + relay module costs around ¥71 (~$10 USD). There's a real hardware demo in the repo.

v0.2.0 just shipped, and we just merged our first external PR — so the project is young but moving.

Happy to answer questions or take feedback. Especially interested in hearing from folks who've tried to bridge AI agents with hardware before.

Repo: https://github.com/brianzhibo-design/RealWorldClaw

---

### r/homeautomation

**Title:** I built an open protocol so AI agents can directly control ESP32/relay hardware — looking for feedback

**Body:**

Long-time lurker, first time posting something I built here.

Home automation is great at scheduled rules and scenes, but I wanted AI agents (LLM-based) to be able to reason about and control physical devices on the fly — without a dedicated home automation hub in the middle.

So I built **RealWorldClaw**: a protocol + SDK layer that lets any AI agent send structured commands to physical hardware modules over a standard interface.

Current hardware support: ESP32 + DHT22 (temperature/humidity) + relay. Starter kit is under ¥71 (~$10). Working demos are in the repo.

It's not a replacement for Home Assistant or similar — it's more of a low-level protocol layer that could sit underneath, or run standalone for simpler setups.

**v0.2.0 is out.** Protocol v0.1 is frozen so existing integrations won't break.

Source: https://github.com/brianzhibo-design/RealWorldClaw (Apache 2.0)

Would love to hear if this scratches an itch anyone else has felt, or if there are hardware modules you'd want supported.

---

### r/selfhosted

**Title:** RealWorldClaw – self-hosted, open-source bridge between AI agents and physical devices (ESP32, Docker, Apache 2.0)

**Body:**

Built something that might interest this community: a self-hosted platform for connecting AI agents to physical hardware.

**The problem it solves:** AI agents are good at reasoning but usually only touch software. Getting them to reliably control real hardware (sensors, relays, motors) means writing custom integration code every time. RealWorldClaw standardizes that with a protocol both the agent and hardware device speak.

**Self-hosted angle:**

- Runs entirely locally via Docker (`docker compose up`)
- No cloud dependency, no vendor lock-in
- You own the protocol and the data
- Apache 2.0

**Hardware side:** ESP32 + DHT22 + relay, ~$10 to get started. Full demo in the repo.

**Current state:** v0.2.0, protocol v0.1 frozen, Python + TS SDKs, 5 scenario examples, first external contributor PR just merged.

Repo: https://github.com/brianzhibo-design/RealWorldClaw

Feedback very welcome — especially on the self-hosting UX and Docker setup.

---

## 2. Hacker News (Show HN)

**Title:** Show HN: RealWorldClaw – Open-source platform for AI agents to control physical devices

**Body:**

RealWorldClaw is an attempt to give AI agents a standardized interface to the physical world.

Most agent frameworks treat "tools" as software APIs. This project adds a protocol layer — RWC Protocol v0.1 (now frozen) — so agents can call physical device operations (read sensor, toggle relay, etc.) the same way they call any other tool.

**Technical overview:**

- **Protocol**: JSON-based, transport-agnostic, versioned. v0.1 spec is stable.
- **SDKs**: Python and TypeScript. Wrap the protocol so agent frameworks (LangChain, custom loops, etc.) can integrate in a few lines.
- **Module registry**: Device drivers for ESP32 + DHT22, relay modules. Community-extensible.
- **Runtime**: Docker Compose for local deployment. No cloud required.
- **Examples**: 5 working scenarios — smart thermostat, light control, and others.

**Hardware entry point:** ESP32 + DHT22 + relay, ¥71 (~$10 USD). There's a real working demo.

v0.2.0 released this week. First external PR just merged.

Apache 2.0. GitHub: https://github.com/brianzhibo-design/RealWorldClaw

Open questions I'm still thinking about: security model for untrusted agents commanding hardware, and whether the protocol should be more RPC-like or event-driven. Thoughts welcome.

---

## 3. Product Hunt

**Tagline:**
> The open protocol for AI agents to control the physical world

---

**Description (≤260 chars for the short field):**
> RealWorldClaw lets any AI agent control real hardware — sensors, relays, motors — through a standard protocol. ESP32 starter kit ~$10. Python/TS SDKs. Docker, self-hosted, Apache 2.0.

---

**Full Description:**

Most AI agents live entirely in software. RealWorldClaw is built around a simple question: what if your agent could also flip a switch, read a temperature, or trigger an actuator — reliably, and without custom glue code for every device?

**What makes it different from existing IoT platforms:**
RWC isn't another IoT dashboard or cloud broker. It's an AI-native protocol layer. The abstraction is designed for agents — structured tool calls, versioned commands, predictable responses — not for dashboards or mobile apps.

**What's included:**
- Protocol v0.1 (frozen, stable) — the hardware/agent contract
- Python & TypeScript SDKs
- Module registry (ESP32 + DHT22, relay, more coming)
- 5 scenario examples (thermostat, lighting, etc.)
- Docker one-command local setup
- Apache 2.0

**Getting started costs ~$10:** ESP32 + DHT22 sensor + relay module.

v0.2.0 is live. First external contributor PR just merged.

---

**Maker Comment:**

Hey Product Hunt! 👋

I started RealWorldClaw because I kept hitting the same wall: I'd build an AI agent that was great at reasoning, but the moment I wanted it to interact with something physical, I was writing custom serial/MQTT/HTTP glue from scratch every single time.

The goal here is protocol-first: define a stable contract between agents and devices, then let hardware drivers and SDKs build on top of it. Similar in spirit to how HTTP decoupled clients from servers.

We just hit v0.2.0 — protocol v0.1 is frozen, the Python and TS SDKs are usable, and we have a working ESP32 demo you can replicate for under $10.

If you're into home automation, robotics, AI agents, or just the idea of grounding LLMs in the physical world, I'd love your feedback. Especially interested in: what hardware you'd want supported, and whether the protocol design makes sense to you.

GitHub: https://github.com/brianzhibo-design/RealWorldClaw

---

*Draft complete. Review all posts before publishing. Pay attention to each subreddit's self-promotion rules — consider posting in weekly threads (e.g., r/selfhosted's "Share your weekend project" thread) to avoid removal.*
