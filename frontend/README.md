# Coding Workshop - Frontend Code

## Overview

This folder contains React frontend application with hello world example.

## Implemented Capabilities

- Responsive and adaptive layout for desktop/mobile data operations
- Real-time interaction via async report jobs + live event polling
- Accessibility improvements (`aria-live`, alert/status regions, labeled form fields, table captions)
- State management and feedback (loading/refreshing/error/partial-data/offline states)
- Frontend validation for async job form inputs with inline field-level messages
- Progressive web app support (manifest + service worker shell caching)
- AI-assisted insights panel using heuristic analytics over report data

## Prerequisites

- React - JavaScript library for building user interfaces
- React Router - Client-side routing for React
- Material UI - Comprehensive UI component library

## Structure

```
coding-workshop-participant/
├── frontend/              # React frontend
│   ├── public/              # Public assets
│   ├── src/                 # Source code
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API client
│   │   └── App.jsx            # Main app entry component
│   ├── .env.sample          # React environment variables
│   ├── eslint.config.js     # ESLint JS tool configuration
│   ├── index.html           # Landing page
│   ├── package.json         # App metadata with dependencies
│   ├── README.md            # Frontend guide (YOU ARE HERE)
│   └── vite.config.js       # Vite build tool configuration
├── ...
```

Note: build output (`dist/`) and dependencies (`node_modules/`) are generated artifacts and are not part of source layout.

## Usage

### Local Development

To run your application locally:

```sh
./bin/start-dev.sh
```

To view your application, open the browser and navigate to `http://localhost:3000`.

The dashboard will authenticate using bootstrap environment credentials and then load data from all backend services.

### Real-time Report Job Flow

1. Use "Queue Summary Job" to enqueue async report processing.
2. If using an ADMIN account, click "Process Next Queued Job" to execute a worker cycle.
3. Watch live status/events in the job event feed section.
4. On completion, dashboard summary metrics auto-refresh.

### Cloud Deployment

To deploy your frontend to AWS:

```sh
./bin/deploy-frontend.sh
```

To view your application, open the browser and navigate to CloudFront URL.

## Clean Up

To remove all deployed resources (including frontend):

```sh
./bin/clean-up.sh
```

**Warning**: This removes all infra resources. Cannot be undone.
