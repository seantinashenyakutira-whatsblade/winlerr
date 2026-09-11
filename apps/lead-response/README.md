# Lead Response Application

The Lead Response application is the first commercial product in the Winlerr MVP. It provides a focused lead operating system for teams that need every enquiry triaged, answered, and moved toward a next step.

## Overview

Lead Response is a complete lead management system with:
- Lead lifecycle management (new → qualified → responded → closed)
- AI-powered response generation and proposal creation
- Lead qualification scoring and workflow management
- Event tracking for audit and analytics
- Full tenant isolation and security

## Key Features

### Core Capabilities
- Create and manage leads with full tenant isolation
- AI-powered response generation and proposal creation
- Lead qualification scoring and workflow management
- Event tracking for audit and analytics
- Role-based access control within organizations
- Complete audit trail of all changes

### Customer Workflow
1. **Create Lead** - Manually create or import leads
2. **View Lead** - Access lead details and history
3. **Qualify Lead** - Assess lead value and potential
4. **Generate AI Response Proposal** - Create personalized responses
5. **Review Proposal** - Evaluate and refine responses
6. **Approve or Reject** - Final decision and action
7. **Record Event** - Log all interactions and decisions

## Architecture

### Domain Structure
- **leads** - Core lead records with tenant isolation
- **lead_events** - Timeline of all lead interactions
- **lead_responses** - Generated and approved responses

### Security Model
- All tables are tenant-scoped with organization_id
- Row-level security enforced by Supabase policies
- Users can only access their own organization's data
- Admins have broader access for management

## API Layer

The application exposes REST APIs through the services/api layer with proper authentication and validation.

## Technology Stack
- Next.js with React
- Supabase for database and authentication
- AI integration for response generation
- TypeScript for type safety
- Tailwind CSS for styling

## Deployment

The application is deployed as a Next.js app on Vercel with Supabase as the backend.

## Future Enhancements

Planned features for later iterations:
- Multi-channel lead capture (WhatsApp, Instagram, etc.)
- Advanced lead scoring algorithms
- Automated follow-up workflows
- Analytics and reporting dashboard
- Integration with other Winlerr systems