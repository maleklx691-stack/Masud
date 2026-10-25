# Custom Avatar Picture Integration

Integrate the newly uploaded portrait image (`/assets/aistudio/images_45dab4cd.jpeg`) into the player profile system, navbar header, and profile avatar selector.

### User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were skipped by default. We are adopting the recommended defaults:
> - Assigning the uploaded picture as the active avatar for the current player (`player1`) and `admin`.
> - Adding an interactive avatar selection gallery in the User Profile modal so players can toggle between the custom uploaded portrait and classic avatars.
> - Showing the avatar picture directly in the top Navbar alongside the balance counter and profile action button.

- **Confirmed Decision 1**: Set `/assets/aistudio/images_45dab4cd.jpeg` as the user profile avatar and admin avatar.
- **Confirmed Decision 2**: Provide an Avatar Gallery in `ProfileModal` enabling users to select/switch avatars or reset to letter initials.

---

### 1. Overview & Core Concept

- **What It Does**: Enhances user personalization in Aviator Pro NextGen by integrating the uploaded anime-style portrait image directly into the user account, header bar, and profile modal.
- **Target Audience / Persona**: Players and administrators who want their custom image identity displayed across game sessions, leaderboards, and navigation.
- **Key Value**: Provides personal visual identity and high-contrast avatar display matching the sleek dark neon casino theme.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Top Navbar**: The user avatar button displays the circular cropped image with a neon glow border (`border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]`).
  2. **Profile Modal**: The header card prominently displays the high-resolution avatar next to the username, "Verified Player" badge, and phone number.
  3. **Avatar Switcher**: Inside the profile modal, an "Avatar Gallery / অবতার পরিবর্তন" section allows switching between the uploaded portrait, preset casino avatars, or initials.
  4. **Admin Panel**: The admin control overview also displays the administrator avatar badge.

- **Visual Identity & Theme**:
  - *Color Palette & Mood*: Deep obsidian (`#0c1017`, `slate-950`), glowing rose/crimson accents (`rose-500`), and emerald win glows (`emerald-400`).
  - *Avatar Frame*: Rounded-2xl and circular squircle with subtle neon ring border and hover micro-interaction scale.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct File Path Reference vs Blob Storage**
  - *Chosen Approach*: Directly reference `/assets/aistudio/images_45dab4cd.jpeg` as instructed in prompt metadata, stored in the user profile state in `storage.ts`.
  - *Why*: Eliminates extra network calls, ensures instant loading, and preserves image fidelity.
  - *Alternatives Considered*: Base64 string encoding (avoided to prevent bloating `localStorage`).

- **Decision 2: Support for Multiple Avatar Options**
  - *Chosen Approach*: Add the uploaded picture as the primary custom avatar while keeping preset avatars selectable.
  - *Why*: Gives players flexible customization if they want to toggle back and forth.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Storage Layer                        │
│  - User.avatar: string ('/assets/aistudio/...')       │
│  - storage.updateUser(updated)                         │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌────────────────────────┐
│     Navbar.tsx        │       │   ProfileModal.tsx     │
│ - Live Avatar Button  │       │ - Large Avatar Display │
│ - Mobile bottom bar   │       │ - Avatar Selector Grid │
└───────────────────────┘       └────────────────────────┘
```

- **Data Model Update**:
  - Extend `User` interface in `src/types.ts` with optional `avatar?: string`.
  - Seed `player1` and `admin` with `avatar: '/assets/aistudio/images_45dab4cd.jpeg'`.
  - Ensure existing stored profiles without an avatar fall back gracefully or migrate automatically.
