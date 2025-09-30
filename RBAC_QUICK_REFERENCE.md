# RBAC Quick Reference Card

## 🎯 Quick Access Matrix

### Routes by Role

| What | Owner | Backoffice | Retailer | Staff |
|------|-------|------------|----------|-------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Orders | ✅ | ✅ | ✅ | ✅ |
| Create Orders | ❌ | ❌ | ✅ | ✅ |
| Manage Shipping | ✅ | ✅ | ❌ | ❌ |
| Manage Retailers | ✅ | ✅ | ❌ | ❌ |
| Admin Access | ✅ | ✅ | ❌ | ❌ |
| View All Data | ✅ | ✅ | Retailer Only | Location Only |

---

## 🔧 Common Code Patterns

### Check User Role
```tsx
import { useRole } from '@/hooks/useAuth';

const { user, hasRole, hasAnyRole } = useRole();

if (hasRole('owner')) {
  // Owner only
}

if (hasAnyRole(['owner', 'backoffice'])) {
  // Admin users
}
```

### Check Access to Retailer/Location
```tsx
const { canAccessRetailer, canAccessLocation } = useRole();

if (canAccessRetailer(retailerId)) {
  // User can see this retailer's data
}

if (canAccessLocation(locationId)) {
  // User can see this location's data
}
```

### Use Navigation Menu
```tsx
import { useNavigation } from '@/hooks/useNavigation';

const { navigationItems } = useNavigation();

return (
  <nav>
    {navigationItems.map(item => (
      <Link to={item.path}>{item.label}</Link>
    ))}
  </nav>
);
```

### Protect a Route
```tsx
// In App.tsx
<Route path="/new-route" element={
  <AuthGuard allowedRoles={['owner', 'backoffice']}>
    <DashboardLayout>
      <YourComponent />
    </DashboardLayout>
  </AuthGuard>
} />
```

### Conditional UI Rendering
```tsx
const { user } = useRole();

return (
  <div>
    <h1>Dashboard</h1>

    {user.role === 'owner' && (
      <AdminPanel />
    )}

    {['retailer', 'location_user'].includes(user.role) && (
      <OrderCreateButton />
    )}
  </div>
);
```

---

## 📊 Data Filtering (Automatic via RLS)

```typescript
// No manual filtering needed!
// RLS automatically filters based on user context

const orders = await supabase
  .from('orders')
  .select('*');
  // ✅ Owner/Backoffice: Gets ALL orders
  // ✅ Retailer: Gets orders for their retailer_id
  // ✅ Location User: Gets orders for their location_id
```

---

## 🗂️ File Locations

- **Route Permissions**: `src/config/route-permissions.ts`
- **Auth Guard**: `src/components/layout/AuthGuard.tsx`
- **Auth Hooks**: `src/hooks/useAuth.ts`
- **Navigation Hook**: `src/hooks/useNavigation.ts`
- **Router Config**: `src/App.tsx`
- **Full Documentation**: `ROLE_BASED_ACCESS_CONTROL.md`

---

## 🚨 Security Checklist

When adding new features:

- [ ] Add route permission to `route-permissions.ts`
- [ ] Protect route with `<AuthGuard allowedRoles={[...]}>`
- [ ] Update `roleNavigationAccess` if adding to menu
- [ ] Test with each role (owner, backoffice, retailer, location_user)
- [ ] Verify RLS policies filter data correctly
- [ ] Check unauthorized users get redirected to `/dashboard`

---

## 🧪 Test Users

```sql
-- Owner (Global Access)
SELECT * FROM users WHERE role = 'owner';
-- admin@iv-relife.com

-- Create test users for other roles
INSERT INTO users (email, role, retailer_id, location_id, name)
VALUES
  ('backoffice@test.com', 'backoffice', NULL, NULL, 'Test Backoffice'),
  ('retailer@test.com', 'retailer', '550e8400-...', NULL, 'Test Retailer'),
  ('staff@test.com', 'location_user', '550e8400-...', '660e8400-...', 'Test Staff');
```

---

## 📞 Quick Debugging

### User Can't Access Route
```typescript
// Check in browser console:
console.log('User:', user);
console.log('Role:', user?.role);
console.log('Retailer ID:', user?.retailer_id);
console.log('Location ID:', user?.location_id);
```

### Check Route Protection
```typescript
// In src/config/route-permissions.ts
import { getAllowedRoles } from '@/config/route-permissions';

console.log('Allowed roles for /orders/new:',
  getAllowedRoles('/orders/new'));
// Output: ['retailer', 'location_user']
```

### Verify RLS
```sql
-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub":"user-id","role":"retailer","retailer_id":"xxx"}';
SELECT * FROM orders;
```

---

## 🎓 Role Descriptions

**Owner**: Distributor owner - full system access, manages contracts, sees global KPIs

**Backoffice**: Distributor operations - handles shipments, claims, onboards retailers

**Retailer**: Retailer manager - manages multiple locations, creates orders, views reports

**Location User**: Retailer staff - restricted to assigned location, creates orders
