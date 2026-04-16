# CareerPrep Frontend

This directory contains the React frontend for the CareerPrep application, built with [Vite](https://vitejs.dev/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/).

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

Navigate to the `frontend` directory and install the necessary dependencies:

```bash
cd frontend
npm install
```

### Running Locally

To start the local development server, run:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`. Any API requests to `/api` are proxy-forwarded to your local backend server running on `http://127.0.0.1:8000`.

### Building for Production

To create an optimized production build, run:

```bash
npm run build
```

This will generate the built output inside the `dist` folder. You can preview it locally by running:

```bash
npm run preview
```

## Structure

- `src/` - Contains the React source files, components, and styling.
- `public/` - Contains static assets that will be served as-is.
- `package.json` - Defines NPM dependencies and development scripts.
- `vite.config.ts` - Configuration file for Vite, including the backend API proxy.
