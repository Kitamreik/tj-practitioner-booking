# TJ Practitioner Booking Platform

A practitioner booking management platform built with React, Vite, TypeScript, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: TanStack React Query
- **Authentication**: Clerk
- **Backend API**: Node/Express on Render (`kit-services-bp-be.onrender.com`)

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/             # shadcn/ui primitives
│   ├── BookingCard.tsx  # Booking display card
│   ├── CreateBookingDialog.tsx  # New booking form modal
│   ├── EditBookingDialog.tsx    # Edit/delete booking modal
│   ├── Navbar.tsx       # Navigation bar
│   ├── SearchBar.tsx    # Search input
│   └── PaginationControls.tsx
├── hooks/
│   └── useBookings.ts  # Data fetching hooks (TanStack Query + Clerk auth)
├── lib/
│   ├── api.ts          # Backend API client
│   ├── mockData.ts     # Fallback mock data
│   └── utils.ts        # Utility functions
├── pages/
│   ├── Index.tsx       # Landing page
│   ├── BookingsPage.tsx # Booking list with search/filter/pagination
│   ├── AdminPage.tsx   # Admin dashboard
│   ├── SignInPage.tsx   # Sign in
│   └── SignUpPage.tsx   # Sign up
├── App.tsx             # Root component with ClerkProvider
└── main.tsx            # Entry point
```


## Frontend Highlights

- ✅ Clerk integrated with `ClerkProvider`, `SignIn`, `SignUp`, `UserButton`
- ✅ Admin Dashboard with view, edit, delete bookings using `fetch()`
- ✅ Local timezone conversion using `new Date().toLocaleString()`
- ✅ Role-based UI hiding using a `useRole()` hook
- ✅ Admin badge shown with `AdminBadge` component
- ✅ CORS configured for cross-origin auth with Clerk

---

## Backend API

The backend is a Node/Express server deployed on Render.

Backend source: [github.com/Kitamreik/du-aip-booking-platform-backend](https://github.com/Kitamreik/du-aip-booking-platform-backend)

## Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or bun package manager

### 1. Clone the repository

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Required for Clerk authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

To get your Clerk publishable key:
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Go to **API Keys** in the Clerk dashboard
4. Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)


