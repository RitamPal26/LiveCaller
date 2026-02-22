# LiveCaller

A modern, full-stack real-time messaging application built with Next.js, Convex, and Clerk. LiveCaller provides instant 1-on-1 communication with a native-app feel.

**Live Demo:** [https://live-caller.vercel.app](https://live-caller.vercel.app)


### Key Features

* **Secure, Real-Time Foundation:** Complete user authentication and session protection via Clerk, paired with instant, bidirectional message delivery powered by Convex WebSockets.

* **Privacy-First AI Agent:** A context-aware AI for group chat summaries and Q&A, secured by strict routing gates that completely isolate the bot from user directories and private 1-on-1 messages.

* **Live Presence & Awareness:** A custom "Heartbeat" architecture for accurate online/offline tracking, combined with unified typing indicators.

* **Rich Message Interactions:** A dynamic chat experience featuring real-time emoji reactions and deletion feature(in case you send something stupid !!).

* **Smart & Responsive UX:** A fluid Tailwind UI that flawlessly adapts from split-screen desktop to mobile routing, featuring intelligent auto-scrolling with floating "New Messages" alerts to protect the user's reading position.


## Tech Stack

* **Frontend:** Next.js 15, Tailwind CSS, TypeScript
* **Backend & Database:** Convex
* **Authentication:** Clerk
*  **AI Usage:** OpenRouter
* **Deployment:** Vercel


## Architectural Diagram

```mermaid
graph TD
    %% --- STYLING ---
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;
    classDef frontend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;
    classDef backend fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#bf360c;
    classDef auth fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#4a148c;
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#b71c1c;

    %% --- NODES ---
    subgraph Client_Device ["Client Device"]
        Browser["User Browser"]:::client
    end

    subgraph Vercel_Hosting ["Vercel (Hosting)"]
        NextJS["Next.js"]:::frontend
    end

    subgraph Auth_Service ["Authentication Service"]
        Clerk["Clerk"]:::auth
    end

    subgraph Convex_BaaS ["Convex Backend"]
        direction TB
        ConvexEngine["Convex Engine"]:::backend
        ConvexActions["Convex Actions"]:::backend
        ConvexDB[("Database")]:::backend
        
        ConvexEngine <--> ConvexDB
        ConvexActions <-->|"Reads Context & Writes Reply"| ConvexDB
    end

    subgraph External_APIs ["External Services"]
        OpenRouter["OpenRouter (LLM API)"]:::external
    end

    %% --- DATA FLOWS ---

    %% 1. Initial Load & Auth
    Browser -- "1. Requests App" --> NextJS
    NextJS -- "2. Checks Session" --> Clerk
    Clerk -- "3. Returns Secure Token" --> NextJS
    NextJS -- "4. Serves UI + Token" --> Browser

    %% 2. Server-to-Backend Connection
    NextJS -. "5. Configures Client" .-> ConvexEngine

    %% 3. Real-time Connection
    Browser == "6. Establishes Secure WebSocket" ==> ConvexEngine

    %% 4. User Actions & Real-time Updates
    Browser -- "7. User Mutations (Send, React, Delete)" --> ConvexEngine
    ConvexEngine -- "8. Pushes UI Updates (Subscriptions)" --> Browser

    %% 5. AI Agent Flow
    ConvexEngine -- "9. Triggers Action on @AI Tag" --> ConvexActions
    ConvexDB -- "10. Fetches Chat Context" --> ConvexActions
    ConvexActions -- "11. Sends Context & Query" --> OpenRouter
    OpenRouter -- "12. Returns AI Response" --> ConvexActions
    ConvexActions -- "13. Writes AI Reply" --> ConvexDB
```
