# Task 1: Foundation & Auth - Testing Guide

## Overview
This document provides a step-by-step guide to test the complete authentication flow for JobHuntAI.

## What Was Implemented

### ✅ Completed Components:

1. **API Client Infrastructure** (`src/lib/api.ts`)
   - Axios instance with baseURL configuration
   - Request/response interceptors
   - Token management (localStorage)
   - Auto-refresh tokens on 401 errors
   - Comprehensive error handling

2. **Authentication Service** (`src/services/authService.ts`)
   - `login(credentials)` - User login
   - `register(userData)` - User registration
   - `logout()` - Clear tokens
   - `getCurrentUser()` - Get current user profile
   - `updateProfile()` - Update user profile
   - `refreshToken()` - Refresh access token
   - `isAuthenticated()` - Check auth status

3. **Auth Context** (`src/contexts/AuthContext.tsx`)
   - AuthProvider component wrapping the entire app
   - useAuth hook for accessing auth state
   - Global auth state management
   - Auto-login on app start if token exists

4. **Dashboard Service** (`src/services/dashboardService.ts`)
   - `getDashboardData()` - Get complete dashboard stats
   - `getWeeklyActivity()` - Get weekly application trends
   - `getRecentActivity()` - Get recent user activities
   - `getVisaCountdown()` - Get visa expiry information
   - `getApplicationTrends()` - Get application trends
   - `getApplicationsByStatus()` - Get applications grouped by status

5. **Connected Pages:**
   - **LoginPage** - Fully connected to backend with form validation
   - **SignupPage** - Fully connected to backend with password validation
   - **DashboardPage** - Fetches and displays real user data

6. **Protected Routes** (`src/components/ProtectedRoute.tsx`)
   - Checks authentication before rendering protected pages
   - Redirects to login if not authenticated
   - Shows loading state during auth check

7. **Environment Configuration**
   - Created `.env` file with `VITE_API_URL=http://localhost:5000`

## Prerequisites

Before testing, ensure you have:

1. **MongoDB Running**: The backend requires a MongoDB connection
2. **Backend .env File**: Configured with all required environment variables
3. **Node.js**: Version 16+ installed

## Testing Steps

### Step 1: Start the Backend Server

```bash
cd backend
npm install  # If not already installed
npm run dev
```

**Expected Output:**
```
Server is running on http://localhost:5000
MongoDB Connected: ...
```

### Step 2: Start the Frontend Development Server

In a new terminal:

```bash
cd /home/user/JobHuntAI
npm install  # If not already installed
npm run dev
```

**Expected Output:**
```
VITE v6.3.5  ready in XXX ms

➜  Local:   http://localhost:5173/
```

### Step 3: Test User Registration Flow

1. **Open the App**: Navigate to `http://localhost:5173`
2. **Click "Get Started" or "Sign Up"**
3. **Fill in Registration Form:**
   - First Name: Test
   - Last Name: User
   - Email: testuser@example.com
   - Password: Test123! (must have uppercase, lowercase, number)
   - Visa Type: Optional (e.g., F-1 Student)

4. **Submit the Form**

**Expected Results:**
- ✅ Success toast: "Account created successfully!"
- ✅ Automatic redirect to Dashboard
- ✅ Token stored in localStorage
- ✅ User's first name displayed in dashboard header

**Troubleshooting:**
- If you get "User already exists", use a different email
- If you get "Password validation failed", ensure password meets requirements
- Check browser console (F12) for detailed error messages
- Check backend terminal for server logs

### Step 4: Test Logout

1. **Click User Menu** (top right)
2. **Click "Logout"**

**Expected Results:**
- ✅ Success toast: "Logged out successfully"
- ✅ Redirect to landing page
- ✅ Tokens cleared from localStorage
- ✅ Can verify in browser DevTools: Application → Local Storage

### Step 5: Test Login Flow

1. **Navigate to Login** (Click "Login" button)
2. **Fill in Credentials:**
   - Email: testuser@example.com
   - Password: Test123!

3. **Submit the Form**

**Expected Results:**
- ✅ Success toast: "Login successful!"
- ✅ Redirect to Dashboard
- ✅ New tokens stored in localStorage
- ✅ Dashboard loads with user data

**Troubleshooting:**
- If "Invalid credentials", verify you're using the correct email/password
- If "Network error", verify backend is running on port 5000

### Step 6: Test Protected Routes

1. **While Logged In:**
   - Navigate to Dashboard → Should work ✅
   - Navigate to Jobs → Should work ✅
   - Navigate to Profile → Should work ✅

2. **Test Unauthorized Access:**
   - Logout
   - Try to access: `http://localhost:5173` and navigate to dashboard
   - **Expected:** Automatic redirect to login page ✅

### Step 7: Test Dashboard Real Data

1. **Login to Dashboard**
2. **Verify Dashboard Displays:**
   - ✅ User's first name in welcome message
   - ✅ Stats cards (Saved Jobs, Applications, Interviews, Offers)
   - ✅ Application activity charts (may be empty for new users)
   - ✅ Recent activity list (may show "No activity yet" for new users)

**For New Users:**
- Stats will show 0 values (this is correct!)
- Charts will show "No activity data yet"
- This confirms the dashboard is correctly fetching from the backend

### Step 8: Test Token Refresh

1. **Open Browser DevTools** (F12)
2. **Go to Application → Local Storage**
3. **Copy the accessToken value**
4. **Manually delete the accessToken** (leave refreshToken)
5. **Refresh the page**

**Expected Results:**
- ✅ App automatically gets a new access token using refresh token
- ✅ You remain logged in
- ✅ Dashboard loads successfully

### Step 9: Test Auto-Login on Page Refresh

1. **While Logged In:**
   - Refresh the page (F5 or Ctrl+R)

**Expected Results:**
- ✅ Brief loading indicator
- ✅ User remains logged in
- ✅ Dashboard loads with user data
- ✅ No redirect to login page

## API Endpoints Being Used

### Auth Endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Dashboard Endpoints:
- `GET /api/dashboard/stats` - Get complete dashboard statistics
- `GET /api/dashboard/trends?range=week` - Get weekly application trends
- `GET /api/dashboard/activity?limit=20` - Get recent activity
- `GET /api/dashboard/visa-countdown` - Get visa countdown info
- `GET /api/dashboard/applications-by-status` - Get applications by status

## Testing Checklist

Use this checklist to verify all functionality:

- [ ] Backend server starts successfully
- [ ] Frontend dev server starts successfully
- [ ] Can access landing page
- [ ] Can navigate to signup page
- [ ] Can register new user with valid data
- [ ] Registration validation works (password requirements)
- [ ] Success toast appears after registration
- [ ] Automatic redirect to dashboard after registration
- [ ] Dashboard displays user's first name
- [ ] Dashboard stats are displayed (0 for new users is OK)
- [ ] Can logout successfully
- [ ] Logout clears tokens from localStorage
- [ ] Can login with registered credentials
- [ ] Login validation works (email format, required fields)
- [ ] Success toast appears after login
- [ ] Dashboard loads after login
- [ ] Protected routes work (dashboard, jobs, profile)
- [ ] Unauthorized users are redirected to login
- [ ] Token refresh works automatically
- [ ] Page refresh maintains login state
- [ ] Can access different protected pages while logged in

## Common Issues and Solutions

### Issue: "Network Error"
**Solution:**
- Verify backend is running on port 5000
- Check `.env` file has correct `VITE_API_URL=http://localhost:5000`
- Ensure MongoDB is running

### Issue: "MongoDB Connection Failed"
**Solution:**
- Check MongoDB is running
- Verify `MONGODB_URI` in backend `.env` file
- Check MongoDB connection string format

### Issue: "Token expired" or "Unauthorized"
**Solution:**
- Logout and login again
- Clear localStorage and try again
- Check backend JWT configuration

### Issue: Dashboard shows "No activity yet"
**Solution:**
- This is normal for new users!
- The dashboard is correctly fetching data from backend
- Stats show 0 because you haven't created any applications yet

### Issue: Charts not displaying
**Solution:**
- For new users, charts will show "No activity data yet"
- This is expected behavior
- Start creating job applications to see data

## Browser DevTools Tips

### View Stored Tokens:
1. Open DevTools (F12)
2. Go to Application → Local Storage → http://localhost:5173
3. Look for: `accessToken` and `refreshToken`

### View Network Requests:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Watch requests to `/api/auth/*` and `/api/dashboard/*`

### View Console Logs:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for success/error messages from API calls

## Next Steps

After successful testing of Task 1:

1. **Task 2: Jobs & Applications**
   - Job search functionality
   - Save jobs
   - Application tracking
   - Job details page

2. **Task 3: Resume & Cover Letter**
   - Resume upload/generation
   - Resume tailoring with AI
   - Cover letter generation
   - Document management

3. **Task 4: Premium & Payments**
   - Stripe integration
   - Subscription management
   - Usage limits
   - Premium features

## Success Criteria ✅

Task 1 is complete when:
- ✅ Users can successfully register
- ✅ Users can successfully login
- ✅ Users can access protected pages
- ✅ Dashboard displays real user data
- ✅ Token refresh works automatically
- ✅ Logout works correctly
- ✅ Auth state persists on page refresh

## Technical Details

### Token Flow:
1. User logs in → Backend returns `accessToken` + `refreshToken`
2. Frontend stores both tokens in localStorage
3. Every API request includes `Authorization: Bearer {accessToken}` header
4. If accessToken expires (15 min), interceptor catches 401 error
5. Automatically calls `/api/auth/refresh-token` with refreshToken
6. Gets new tokens and retries original request
7. User never sees the token refresh happening

### Protected Routes Flow:
1. User tries to access protected page
2. ProtectedRoute component checks `isAuthenticated`
3. If not authenticated → redirect to login
4. If authenticated → render requested page
5. Shows loading spinner during auth check

## Documentation Links

- API Client: `src/lib/api.ts`
- Auth Service: `src/services/authService.ts`
- Auth Context: `src/contexts/AuthContext.tsx`
- Dashboard Service: `src/services/dashboardService.ts`
- Protected Route: `src/components/ProtectedRoute.tsx`

---

**Created:** 2025-10-31
**Task:** Foundation & Auth Setup
**Status:** ✅ Complete and Ready for Testing
