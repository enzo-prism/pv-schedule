# Track & Field Meet Manager

## Overview

A modern web application for managing track and field competition schedules, specifically designed for tracking meets and pole vault performance data. The application features a React frontend with shadcn/ui components and a Node.js/Express backend using PostgreSQL for data persistence. It includes both personal meet tracking and pre-populated FilAm Sports competition data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript for type safety
- **API Design**: RESTful endpoints under `/api/meets` for CRUD operations
- **Database Access**: Direct PostgreSQL queries using a custom query wrapper in `server/db.ts`
- **Schema Management**: Drizzle ORM for schema definition and migrations
- **Data Storage**: Hybrid approach combining user-generated meets with pre-populated FilAm Sports data
- **Error Handling**: Centralized error middleware with structured error responses

### Frontend Architecture  
- **Framework**: React 18 with TypeScript and Vite for fast development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

### Database Design
- **Primary Table**: Single `meets` table with comprehensive fields for meet information and pole vault performance tracking
- **Key Fields**: Standard meet data (name, date, location) plus specialized pole vault metrics (height cleared, pole used, takeoff distance, placement)
- **Data Types**: PostgreSQL-specific types with date handling for timezone consistency
- **Sample Data**: Pre-seeded with realistic meet examples

### Component Architecture
- **Shared Components**: Reusable UI components in `/components/ui/` following shadcn/ui patterns
- **Feature Components**: Meet-specific components like MeetCard, AddMeetForm, EditMeetForm
- **Layout Components**: UserProfile, FilterSection, CountdownTimer for enhanced UX
- **Form Components**: Type-safe forms using React Hook Form with Zod schema validation

### Data Flow Patterns
- **Query Pattern**: TanStack Query for caching, background updates, and optimistic updates
- **Mutation Pattern**: Structured mutations with automatic cache invalidation
- **Error Boundaries**: Toast notifications for user feedback on operations
- **Loading States**: Proper loading indicators and skeleton states

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver optimized for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations and schema management
- **@tanstack/react-query**: Powerful data synchronization for React applications
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Integration layer for form validation libraries

### UI and Styling Dependencies
- **@radix-ui/***: Comprehensive collection of accessible, unstyled UI primitives
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Utility for creating type-safe CSS class variants
- **clsx**: Utility for conditionally constructing className strings
- **lucide-react**: Modern icon library with consistent design

### Development and Build Tools
- **vite**: Fast build tool and development server for modern web projects
- **typescript**: Static type checking for improved developer experience
- **zod**: TypeScript-first schema validation library
- **date-fns**: Modern JavaScript date utility library

### Specialized Features
- **cmdk**: Command palette component for enhanced navigation
- **@replit/vite-plugin-shadcn-theme-json**: Theme configuration integration for Replit environment
- **wouter**: Minimalist routing library for React applications

### Database and Session Management
- **pg**: Node.js PostgreSQL client for database connections
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **drizzle-kit**: CLI companion for Drizzle ORM migrations and introspection