# Customers Feature Implementation

This document describes the implementation of the customers feature for the IV RELIFE Internal System.

## Overview

The customers feature provides a comprehensive system for managing customer information, including:
- Customer profiles with contact information and addresses
- Document management (ID photos, signatures, contracts)
- Activity logging and audit trails
- Duplicate detection and merging
- CSV import/export functionality

## Database Schema

The feature uses the following tables:

1. `customers` - Core customer information
2. `customer_contacts` - Multiple contact methods per customer
3. `customer_addresses` - Multiple addresses per customer
4. `customer_documents` - Document storage metadata
5. `customer_activity` - Immutable activity log
6. `customer_merge_requests` - Merge request tracking

## Row Level Security (RLS) Policies

The schema implements RLS policies for different user roles:
- **Owners**: Full access to all customer data
- **Backoffice**: Access to customers within their retailer
- **Retailers**: Access to customers within their retailer
- **Location users**: Access to customers at their location

## API Endpoints

The feature provides the following API endpoints:

### Customer Management
- `GET /api/customers` - List customers with filters
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Document Management
- `POST /api/customers/:id/upload` - Upload customer document
- `POST /api/customers/:id/signature` - Upload customer signature

### Import/Export
- `POST /api/customers/import` - Import customers from CSV
- `GET /api/customers/export` - Export customers to CSV

### Merge Operations
- `GET /api/customers/duplicates` - Find potential duplicates
- `POST /api/customers/merge` - Merge customer records

## Frontend Components

### Pages
1. `Customers.tsx` - Main customers list page
2. `CustomerDetail.tsx` - Customer detail view

### Components
1. `CustomerForm.tsx` - Create/edit customer form with validation
2. `IDUploadWidget.tsx` - ID photo upload component
3. `SignaturePad.tsx` - Signature capture component
4. `MergeTool.tsx` - Duplicate detection and merging tool
5. `ImportExport.tsx` - CSV import/export functionality

## React Hooks

Custom hooks for data fetching and mutations:
- `useCustomers` - Fetch customer list
- `useCustomer` - Fetch single customer
- `useCustomerContacts` - Fetch customer contacts
- `useCustomerAddresses` - Fetch customer addresses
- `useCustomerDocuments` - Fetch customer documents
- `useCustomerActivity` - Fetch customer activity log
- `useCustomerMergeRequests` - Fetch merge requests

## Supabase Integration

The feature integrates with Supabase for:
- Data storage and retrieval
- Authentication and authorization
- Row Level Security enforcement
- Realtime subscriptions (for activity feed)

## Security Considerations

1. All sensitive operations use service role keys server-side
2. Document uploads use signed URLs with short TTL
3. RLS policies enforce data access controls
4. Activity logs are immutable for audit purposes

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

## Storage Buckets

The feature uses the following Supabase Storage buckets:
- `id_photos` - Private storage for ID photos
- `signatures` - Private storage for signatures
- `customer_documents` - Private storage for other documents
- `import_jobs` - Temporary storage for CSV imports

## Testing

The implementation includes:
- Unit tests for form validation
- Integration tests for API endpoints
- Security tests for RLS enforcement
- Performance tests for large datasets

## Future Enhancements

Planned improvements:
- Real-time activity feed using Supabase Realtime
- Advanced duplicate detection algorithms
- Background job processing for imports
- Enhanced search and filtering capabilities