# PS4+++

Discord.js bot + Express web UI for sending payloads to a homebrew PS4 (GoldHEN) — and more tools coming soon.

![PS4Plus screenshot](https://github.com/user-attachments/assets/d25cd131-b713-4447-9701-49b3be0eb2a6)

## Overview

PS4Plus provides two ways to deliver payloads to a PS4 on your local network:

- **Express web app** (runs on `http://localhost:3000`) — includes a payload loader UI and other tools (more features coming soon).
- **Discord bot** with a `/postbin` command — send `.bin` payloads directly from Discord if you prefer the bot interface.

This project is built with **Node.js**, **discord.js**, **Express**, **EJS**, and a few helper Node modules.

## Features

- Upload `.bin` payloads via the web UI and POST them to `http://<PS4_IP>:9090/upload`.
- Send `.bin` payloads from Discord using the `/postbin` command (attachment → POST to target).
- Simple, responsive UI styled with Tailwind (via CDN).
- Clean error handling and status responses.
- More tools planned — contributions welcome!

## Tech Stack

- Node.js
- discord.js
- Express
- EJS
- Multer (file uploads)
- Tailwind (via CDN)
- Built-in `http` / `https` modules for posting payloads

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ScrachStack/ps4plus.git
   cd ps4plus
```
npm install --save

node .

```

### Credits

- ScratchStack Application Development
- oysters (rfoodxmodz) payloads (GTAV + RDR2)


> Licensed under the MIT License
