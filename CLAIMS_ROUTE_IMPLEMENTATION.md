# Claims Route Implementation

This document describes the implementation of the claims route for the IV RELIFE Internal System dashboard.

## Overview

The claims system allows retailers to manage customer claims for products. It includes functionality for creating, reviewing, approving, and resolving claims, with full audit logging and notification capabilities.

## Features Implemented

1. **Claims Management**
   - Create new claims with order and product associations
   - View and filter claims by status
   - Update claim status through the lifecycle (submitted → in_review → approved/rejected → resolved)
   - Delete claims

2. **Audit Logging**
   - Automatic logging of all claim-related activities
   - Detailed audit trail showing who performed what action and when
   - Integration with the existing audit_logs table

3. **Notification System**
   - Outbox pattern for reliable event processing
   - Email and SMS notifications via Resend and Twilio
   - Automatic notifications for claim creation and status updates

4. **Reporting**
   - PDF generation for claim reports via Edge Functions
   - Detailed claim information including order and product details

5. **Security**
   - Row Level Security (RLS) policies to ensure data isolation
   - Role-based access control (RBAC)
   - Service role key usage for secure operations

## Technical Implementation

### Database Schema

The claims system uses the following tables:
- `claims` - Main claims table with references to orders, products, retailers, and locations
- `audit_logs` - Immutable audit trail of all claim activities
- `outbox` - Event queue for reliable notification processing

### API Layer

Supabase functions implemented:
- `getClaims()` - Retrieve all claims with associated data
- `getClaimById(id)` - Retrieve a specific claim with full details
- `createClaim(claim)` - Create a new claim
- `updateClaim(id, claim)` - Update an existing claim
- `deleteClaim(id)` - Delete a claim
- `getAuditLogs(entity, entityId)` - Retrieve audit logs for a claim
- `createAuditLog(log)` - Create a new audit log entry
- `createOutboxEvent(event)` - Create a new outbox event

### Frontend Components

React components created:
- `ClaimList` - Displays a table of claims with filtering capabilities
- `ClaimDetail` - Shows detailed information about a specific claim
- `ClaimForm` - Form for creating new claims
- `ClaimStatusBadge` - Visual indicator of claim status

### Hooks

React Query hooks for data management:
- `useClaims()` - Fetch claims data
- `useClaim(id)` - Fetch a specific claim
- `useCreateClaim()` - Create a new claim
- `useUpdateClaim()` - Update an existing claim
- `useDeleteClaim()` - Delete a claim
- `useAuditLogs(entity, entityId)` - Fetch audit logs
- `useCreateAuditLog()` - Create audit log entries
- `useCreateOutboxEvent()` - Create outbox events

### Edge Functions

Deno-based Edge Functions:
- `generate-claim-pdf` - Generates PDF reports for claims
- `process-claim-event` - Processes outbox events for notifications

### Notification Service

Integration with external services:
- Resend for email notifications
- Twilio for SMS notifications

## Security Considerations

1. **Row Level Security (RLS)**
   - Claims are isolated by retailer
   - Users can only access claims from their own retailer
   - Service role key used for secure operations that bypass RLS

2. **Authentication**
   - JWT-based authentication with role claims
   - Role-based access control for different user types

3. **Data Validation**
   - Zod schema validation for form inputs
   - Database constraints for data integrity

## Testing

Integration tests included for:
- Claim creation, retrieval, update, and deletion
- Audit logging functionality
- Notification system
- PDF report generation

## Deployment

The claims system is designed to work with:
- Supabase Postgres database
- Supabase Auth for authentication
- Supabase Edge Functions for server-side processing
- Vercel for frontend deployment

## Future Enhancements

1. **Advanced Filtering**
   - Date range filtering
   - Multi-status filtering
   - Search by customer name or order ID

2. **Bulk Operations**
   - Bulk status updates
   - Bulk claim creation from CSV

3. **Enhanced Reporting**
   - Claim statistics and analytics
   - Export to CSV/PDF
   - Custom report builder

4. **Integration Features**
   - Third-party shipping provider integration
   - Payment processing integration
   - CRM system integration

## API Endpoints

The claims system exposes the following API endpoints:

### Claims
- `GET /claims` - Retrieve all claims
- `GET /claims/:id` - Retrieve a specific claim
- `POST /claims` - Create a new claim
- `PUT /claims/:id` - Update a claim
- `DELETE /claims/:id` - Delete a claim

### Audit Logs
- `GET /audit-logs?entity=claim&entity_id=:id` - Retrieve audit logs for a claim

### Reports
- `POST /generate-claim-pdf` - Generate PDF report for a claim

### Events
- `POST /process-claim-event` - Process claim-related events from outbox

## Environment Variables

The following environment variables are required:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```