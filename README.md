# 🐔 Peckodoro

**The perfect study hub.** Peckodoro is a Pomodoro timer with integrated **Spotify controls** and **ChatGPT support**, designed to help you focus smarter, not harder.

---

## 🧠 What is Peckodoro?

Peckodoro blends time management, ambient motivation, and AI-assisted productivity into a lightweight, user-friendly web app. Whether you’re studying, coding, or deep in creative work, Peckodoro helps you stay in the zone.

---

## 🚀 Features

- ⏲️ **Customizable Pomodoro Timer**  
  Configure Focus, Short Break, and Long Break durations.

- 🎵 **Spotify Integration**  
  Play, pause, and skip tracks without leaving the app (Spotify Premium required for full control).

- 🤖 **ChatGPT Assistant**  
  Get study help, generate ideas, or chat with AI while you work. Requires login to use.

- 🌗 **Dark Mode Ready**  
  Seamlessly adapts for both day and night productivity.

- 🔓 **No-Login Required**  
  Core features like the timer and music controls are usable without signing in.

---

## 🖥️ Pages Overview

| Page             | Description                                           |
|------------------|-------------------------------------------------------|
| `/` (Home)       | Pomodoro Timer, Spotify Player, and ChatGPT preview  |
| `/login`         | Sign in to access ChatGPT and save preferences       |
| `/settings`      | Customize timer durations and preferences            |
| `/about`         | Learn more about the app and its mission             |
| `/version-history` | See updates and new features as they’re added     |

---

## 📦 Tech Stack

- **Frontend**: React (with Next.js)
- **Backend**: Node.js + Express (for ChatGPT routing)
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4 API
- **Music**: Spotify Web API
- **Auth**: NextAuth.js

---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/chickenjsx/peckodoro.git
cd peckodoro
```
### 2. Install Dependencies
```bash
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```
###4. Run the App
```bash
npm run dev
```
✅ To-Do / Roadmap

✅Basic Pomodoro Timer

 User Authentication
 
 Save user preferences (dark mode, timer lengths)

 Spotify Integration

 ChatGPT Access

 Cross-platform notifications

 Study stats and analytics (future)

📄 License
MIT License. See LICENSE file for details.

