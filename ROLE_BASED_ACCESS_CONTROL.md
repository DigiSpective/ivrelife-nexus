# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the complete role-based access control system for the IV ReLife Nexus wholesale distribution platform. The system implements a unified dashboard with granular route-level and data-level access control based on user roles.

---

## 🎭 User Roles

### 1. **Owner** (Distributor Owner)
- **Scope**: Global system access
- **Capabilities**:
  - View global KPIs and analytics
  - Manage all retailers and locations
  - Control user permissions
  - Access financial reports
  - Full system administration

### 2. **Backoffice** (Distributor Backoffice Staff)
- **Scope**: Global operations access
- **Capabilities**:
  - Manage shipments and fulfillment
  - Assign carriers and tracking
  - Handle claims and repairs
  - Onboard retailers and locations
  - View all orders across retailers

### 3. **Retailer** (Retailer Manager)
- **Scope**: All locations under their retailer
- **Capabilities**:
  - Manage staff across locations
  - View reports for all locations
  - Approve and track orders
  - Create orders
  - Submit claims/repairs

### 4. **Location User** (Retailer Staff)
- **Scope**: Assigned location only
- **Capabilities**:
  - Create customer orders
  - Upload ID/Signature documents
  - View orders in assigned location
  - Submit claims/repairs for location

---

## 🛡️ Security Architecture

### Multi-Layer Protection

```
┌─────────────────────────────────────┐
│  1. Route-Level Protection          │
│     (AuthGuard Component)           │
├─────────────────────────────────────┤
│  2. UI-Level Visibility             │
│     (Navigation Menu Filtering)     │
├─────────────────────────────────────┤
│  3. Database-Level Security         │
│     (Row Level Security - RLS)      │
└─────────────────────────────────────┘
```

---

## 📁 Implementation Files

### 1. **Route Permissions Configuration**
**File**: `src/config/route-permissions.ts`

Defines which roles can access which routes:

```typescript
export const routePermissions: RoutePermission[] = [
  {
    path: '/orders/new',
    allowedRoles: ['retailer', 'location_user'],
    description: 'Create new customer orders - retailer staff only'
  },
  {
    path: '/retailers',
    allowedRoles: ['owner', 'backoffice'],
    description: 'Manage retailers - distributor only'
  },
  // ... more routes
];
```

### 2. **AuthGuard Component**
**File**: `src/components/layout/AuthGuard.tsx`

Protects routes and redirects unauthorized users:

```tsx
<Route path="/orders/new" element={
  <AuthGuard allowedRoles={['retailer', 'location_user']}>
    <DashboardLayout>
      <NewOrder />
    </DashboardLayout>
  </AuthGuard>
} />
```

### 3. **Navigation Hook**
**File**: `src/hooks/useNavigation.ts`

Provides role-based navigation menu filtering:

```typescript
const { navigationItems, canAccessRoute } = useNavigation();
// Returns only menu items the user's role can access
```

### 4. **Router Configuration**
**File**: `src/App.tsx`

All routes configured with appropriate role restrictions.

---

## 🔐 Access Control Matrix

| Route | Owner | Backoffice | Retailer | Location User |
|-------|-------|------------|----------|---------------|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/orders` | ✅ | ✅ | ✅ | ✅ |
| `/orders/new` | ❌ | ❌ | ✅ | ✅ |
| `/customers` | ✅ | ✅ | ✅ | ✅ |
| `/products` | ✅ | ✅ | ✅ | ✅ |
| `/claims` | ✅ | ✅ | ✅ | ✅ |
| `/claims/new` | ❌ | ❌ | ✅ | ✅ |
| `/shipping` | ✅ | ✅ | ❌ | ❌ |
| `/retailers` | ✅ | ✅ | ❌ | ❌ |
| `/admin/*` | ✅ | ✅ | ❌ | ❌ |
| `/settings` | ✅ | ✅ | ✅ | ✅ |

**Note**: Even when users can access a route, data is filtered by Row Level Security (RLS) policies in the database based on their `retailer_id` and `location_id`.

---

## 🗂️ Data-Level Access Control

### Database RLS Policies

The database enforces multi-tenant access control through PostgreSQL Row Level Security:

#### Owner & Backoffice
```sql
-- Can access ALL data across all retailers
SELECT * FROM orders; -- No filtering
```

#### Retailer Manager
```sql
-- Can access all locations under their retailer
SELECT * FROM orders
WHERE retailer_id = current_user.retailer_id;
```

#### Location User
```sql
-- Can ONLY access their assigned location
SELECT * FROM orders
WHERE retailer_id = current_user.retailer_id
AND location_id = current_user.location_id;
```

### Helper Functions

```sql
-- Get accessible retailer IDs for a user
get_user_retailer_ids(user_id UUID) RETURNS UUID[]

-- Check if user can access specific retailer
can_access_retailer(user_id UUID, retailer_id UUID) RETURNS BOOLEAN
```

---

## 🎨 UI Visibility Control

### Navigation Menu Filtering

The navigation menu automatically shows/hides items based on role:

**Owner/Backoffice sees:**
- Dashboard
- Orders
- Customers
- Products
- Claims
- Shipping
- Retailers
- Admin
- Reports

**Retailer sees:**
- Dashboard
- Orders
- New Order
- Customers
- Products
- Claims
- Reports (retailer-scoped)

**Location User sees:**
- Dashboard
- Orders
- New Order
- Customers
- Products
- Claims

### Usage Example

```tsx
import { useNavigation } from '@/hooks/useNavigation';

function Sidebar() {
  const { navigationItems } = useNavigation();

  return (
    <nav>
      {navigationItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

---

## 🚀 Usage Guide

### For Developers

#### 1. Adding a New Protected Route

```tsx
// In src/App.tsx
<Route path="/new-feature" element={
  <AuthGuard allowedRoles={['owner', 'backoffice']}>
    <DashboardLayout>
      <NewFeature />
    </DashboardLayout>
  </AuthGuard>
} />
```

#### 2. Adding Route to Navigation

```typescript
// In src/config/route-permissions.ts
export const routePermissions: RoutePermission[] = [
  // ... existing routes
  {
    path: '/new-feature',
    allowedRoles: ['owner', 'backoffice'],
    description: 'New feature description'
  }
];

// In src/config/route-permissions.ts (roleNavigationAccess)
export const roleNavigationAccess = {
  owner: {
    // ... existing flags
    canSeeNewFeature: true
  },
  backoffice: {
    // ... existing flags
    canSeeNewFeature: true
  },
  retailer: {
    // ... existing flags
    canSeeNewFeature: false
  },
  location_user: {
    // ... existing flags
    canSeeNewFeature: false
  }
};
```

#### 3. Checking Access in Components

```tsx
import { useRole } from '@/hooks/useAuth';

function MyComponent() {
  const { hasRole, canAccessRetailer, canAccessLocation } = useRole();

  if (hasRole('owner')) {
    // Owner-only UI
  }

  if (canAccessRetailer(retailerId)) {
    // Show retailer data
  }

  if (canAccessLocation(locationId)) {
    // Show location data
  }
}
```

---

## 🧪 Testing Role Access

### Test Scenarios

#### 1. Test Owner Access
```bash
# Login as: admin@iv-relife.com
# Expected: Can access all routes
✅ /dashboard
✅ /orders
✅ /retailers
✅ /admin
✅ /shipping
```

#### 2. Test Retailer Manager Access
```bash
# Login as retailer user with retailer_id set
# Expected: Can access retailer routes, NOT admin/distributor routes
✅ /dashboard
✅ /orders
✅ /orders/new
❌ /retailers (redirects to /dashboard)
❌ /admin (redirects to /dashboard)
❌ /shipping (redirects to /dashboard)
```

#### 3. Test Location User Access
```bash
# Login as location staff with location_id set
# Expected: Can access basic routes, NOT management routes
✅ /dashboard
✅ /orders (only sees location orders due to RLS)
✅ /orders/new
❌ /retailers (redirects to /dashboard)
❌ /admin (redirects to /dashboard)
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'backoffice', 'retailer', 'location_user')),
    retailer_id UUID REFERENCES retailers(id),
    location_id UUID REFERENCES locations(id),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Fields for Access Control
- `role`: Determines route access and capabilities
- `retailer_id`: Used for filtering data to specific retailer
- `location_id`: Used for filtering data to specific location

---

## 🔄 Authentication Flow

```
1. User enters credentials
   ↓
2. AuthProvider validates with Supabase
   ↓
3. User object loaded (includes role, retailer_id, location_id)
   ↓
4. User redirected to /dashboard
   ↓
5. AuthGuard checks role on each route navigation
   ↓
6. Navigation menu filtered by role
   ↓
7. RLS policies filter data queries
```

---

## ⚠️ Important Notes

### 1. **Owner Always Has Access**
The `owner` role bypasses most restrictions and has full system access.

### 2. **RLS is Primary Security**
Route-level protection is for UX. The database RLS policies are the primary security boundary.

### 3. **Multi-Tenancy**
All data queries are automatically filtered by `retailer_id` and `location_id` through RLS policies.

### 4. **No Enum Types**
All status fields use `TEXT` with `CHECK` constraints to avoid PostgREST caching issues.

---

## 🐛 Troubleshooting

### User Can't Access Expected Route
1. Check user's role: `SELECT role FROM users WHERE id = 'user-id'`
2. Verify route permissions in `route-permissions.ts`
3. Check `AuthGuard` in `App.tsx` for the route
4. Ensure user has correct `retailer_id` and `location_id` if applicable

### User Sees No Data
1. Check RLS policies are enabled: `SELECT * FROM pg_policies WHERE tablename = 'orders'`
2. Verify user has correct `retailer_id`: `SELECT retailer_id FROM users WHERE id = 'user-id'`
3. Test RLS: `SET ROLE authenticated; SELECT * FROM orders;`

### Navigation Menu Missing Items
1. Check `roleNavigationAccess` in `route-permissions.ts`
2. Verify `useNavigation` hook is being used
3. Check user's role is correctly set

---

## 📚 Related Documentation

- [Database Schema Guide](./SCHEMA_IMPLEMENTATION_GUIDE.md)
- [Implementation Steps](./IMPLEMENTATION_STEPS.md)
- [PRD - User Roles](./PRD.xml)

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0
