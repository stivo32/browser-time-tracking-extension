# Browser Time Tracking Extension

Browser extension for tracking time spent on websites with detailed analytics.

## Architecture

The project is structured with clear separation between browser extension and cloud backend:

### Browser Extension (Frontend)
- **Location**: `src/` (extension files) + `frontend/` (shared UI components)
- **Technology**: JavaScript ES2023 + React + Vite
- **Purpose**: Local time tracking, UI, data collection

### Cloud Backend (Future)
- **Location**: `backend/`
- **Technology**: Python 3.12 + FastAPI + SQLite/PostgreSQL
- **Purpose**: Cloud sync, premium features, analytics

## Development

### Browser Extension
```bash
npm install
npm run dev      # Development with hot reload
npm run build    # Production build
npm run lint     # Lint code
npm run test     # Run tests
```

### Backend (Future)
```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload
```

## Project Structure

```
├── src/                    # Browser extension core
│   ├── popup/             # Extension popup UI
│   ├── background/        # Background service worker
│   ├── content/           # Content scripts
│   └── options/           # Options page
├── frontend/              # Shared UI components
│   ├── src/               # React components
│   ├── public/            # Static assets
│   └── tests/             # Frontend tests
├── backend/               # Cloud backend (Phase 2)
│   ├── src/               # FastAPI application
│   ├── tests/             # Backend tests
│   └── migrations/        # Database migrations
├── docs/                  # Documentation
│   ├── api/               # API documentation
│   └── deployment/        # Deployment guides
└── icons/                 # Extension icons
```

## Phases

### Phase 1: MVP (Local Storage)
- Browser extension with local storage
- Basic time tracking and analytics
- Export functionality

### Phase 2: Cloud & Premium
- Cloud synchronization
- Premium features
- Advanced analytics
