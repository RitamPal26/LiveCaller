# LiveCaller

A modern, full-stack real-time messaging application built with Next.js, Convex, and Clerk. LiveCaller provides instant 1-on-1 communication with a native-app feel, featuring typing indicators, read receipts, and a robust presence system.

**Live Demo:** [https://live-caller.vercel.app](https://live-caller.vercel.app)

## Key Features

* **Real-Time WebSockets:** Instant, bidirectional message delivery powered by Convex.
* **Robust Presence System:** A custom "Heartbeat" architecture to accurately track online/offline status, even handling abrupt browser exits.
* **Typing Indicators:** Real-time animated typing states with debounced backend updates for optimized performance.
* **Read Receipts & Unread Badges:** Automatically tracks when users view conversations and displays accurate unread message counts.
* **Smart Auto-Scroll:** Automatically snaps to new messages, with a floating "New Messages" alert if the user is reading chat history.
* **Global Search:** Debounced user discovery system for starting new conversations.
* **Fully Responsive:** Fluid UI built with Tailwind CSS, seamlessly adapting from split-screen desktop views to full-screen mobile routing.
* **Secure Authentication:** Complete user management and session protection via Clerk.

## Tech Stack

* **Frontend:** Next.js 15, Tailwind CSS, TypeScript
* **Backend & Database:** Convex
* **Authentication:** Clerk
* **Deployment:** Vercel
