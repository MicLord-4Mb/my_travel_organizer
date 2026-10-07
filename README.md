# Travel Organizer

A modern travel planning and itinerary management application built with React, Vite, Redux Toolkit, and Feature-Sliced Design (FSD).

> [!WARNING]
> **Docker and Production Status:**
> The Docker configuration (`docker-compose.yml`) and production deployment pipelines are **currently unverified and not tested**. Please run the application using the local development setup described below.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (v9+ recommended)

---

## Development Setup

The application frontend currently interacts with a local mock API (`json-server`) running on port `3001`. Running the app requires two terminal processes.

### 1. Install Dependencies

Navigate to the `client` directory and install project dependencies:

```bash
cd client
npm install
```

### 2. Start the Mock API (Backend)

In the first terminal window, start the mock server:

```bash
cd client
npm run mock-api
```

- Mock server will be available at: `http://localhost:3001`
- Mock database file: `client/db.json`

### 3. Start the Development Server (Frontend)

In a second terminal window, launch the Vite development server:

```bash
cd client
npm run dev
```

- Vite dev server will start (default: `http://localhost:5173`)
- Open the printed URL in your browser to access the application.

---

## Additional Scripts

All scripts should be executed from within the `client` directory:

| Script | Description |
| :--- | :--- |
| `npm run dev` | Runs the Vite dev server with hot reload |
| `npm run mock-api` | Starts `json-server` for mock backend REST API |
| `npm run lint` | Runs `oxlint` for fast static code analysis |
| `npm run test` | Runs unit & integration tests using Vitest |
| `npm run build` | Compiles TypeScript and creates a production bundle |
