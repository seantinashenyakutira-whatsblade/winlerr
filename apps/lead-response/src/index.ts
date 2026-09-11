"""
@winlerr/lead-response — Lead Response Application

Lead Response is the first commercial product in Winlerr MVP. It provides a focused lead operating system for teams that need every inquiry triaged, answered, and moved toward a next step.

Key Features:
- Lead lifecycle management (new → qualified → responded → closed)
- AI-powered response generation and proposal creation
- Lead qualification scoring and workflow management
- Event tracking for audit and analytics
- Full tenant isolation and security

Architecture:
- Next.js frontend with React
- Supabase backend for database and authentication
- TypeScript for type safety
- Tailwind CSS for styling
- Tenant isolation via organization_id on all records
"""

export * from './app/dashboard/page';
export * from './app/leads/[id]/page';
export * from './app/leads/create/page';
export * from './app/quality/page';