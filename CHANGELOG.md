# Changelog

All notable changes to the Browser Time Tracking Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Phase 2: Backend API
- Backend API with FastAPI (Python 3.12)
- Session-based authentication system
- User registration and login endpoints (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`)
- User profile management (`GET /api/v1/users/me`, `PATCH /api/v1/users/me`, `DELETE /api/v1/users/me`)
- REST API for time tracking sessions (`GET /api/v1/sessions`, `POST /api/v1/sessions`, etc.)
- REST API for domains (`GET /api/v1/domains`, `GET /api/v1/domains/stats`, etc.)
- Database models (User, AuthSession, Session, Domain, Page)
- Pydantic schemas for API validation
- Docker support for development
- Comprehensive test suite (unit and integration tests)
- Alembic migrations support

### Added - Phase 1: Browser Extension
- Initial project structure with browser extension and cloud backend separation
- Chrome Extension Manifest v3 configuration
- Vite build system with React support
- ESLint and Prettier configuration
- Basic popup interface with time tracking display
- Background service worker for time tracking
- Content script for page metadata collection
- Options page for settings management
- Test setup with Vitest and Testing Library
- Data export functionality (CSV/JSON)
- Local storage management with data retention
- Category-based site organization

### Technical Details
- **Frontend**: JavaScript ES2023 + React + Vite
- **Backend**: Python 3.12 + FastAPI (prepared for Phase 2)
- **Testing**: Vitest + @testing-library/react for frontend, pytest for backend
- **Linting**: ESLint + Prettier for frontend, Black + Ruff for backend
- **Architecture**: Clear separation between browser extension and cloud domains

### Files Added
- `manifest.json` - Chrome Extension manifest v3
- `package.json` - Frontend dependencies and scripts
- `vite.config.js` - Vite configuration for Chrome Extension
- `src/popup/` - Extension popup interface
- `src/background/` - Background service worker
- `src/content/` - Content script for page metadata
- `src/options/` - Settings and configuration page
- `src/test/` - Test files and setup
- `frontend/` - Shared UI components (prepared for Phase 2)
- `backend/` - Cloud backend structure (prepared for Phase 2)
- `docs/` - Documentation structure

### Configuration
- ESLint rules for browser extensions and React
- Prettier formatting configuration
- TypeScript configuration for JSDoc support
- Test setup with Chrome API mocking
- Git ignore for common files and directories
