# Quick Start Guide 🚀

Get SlotSwapper running in under 5 minutes!

## Prerequisites Check

```powershell
# Check Node.js version (should be v18+)
node --version

# Check Git
git --version
```

**No need to install PostgreSQL locally!** We're using Supabase (cloud PostgreSQL).

## Step-by-Step Setup

### 1. Clone the Repository

```powershell
# Clone the repository
git clone https://github.com/Aaryan-Sharma-5/slot-swapper.git

# Navigate to the project directory
cd slot-swapper
```

### 2. Install Dependencies

```powershell
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
cd ..
```

### 3. Setup Supabase Database

1. **Go to Supabase**: https://supabase.com
2. **Sign up/Login** with GitHub or email
3. **Create New Project**:
   - Project Name: `slotswapper`
   - Database Password: (choose a strong password - save it!)
   - Region: Choose closest to you
   - Wait ~2 minutes for database to provision

4. **Get Connection String**:
   - Go to Project Settings → Database
   - Scroll to "Connection string" section
   - Copy the **Connection pooling** URI (mode: Transaction)
   - It looks like: `postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

### 4. Configure Backend

Update the `.env` file with your Supabase connection string:
```env
PORT=3000
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

**Important**: Replace `[YOUR-PASSWORD]` with the database password you set when creating the Supabase project.

### 5. Run Database Migrations

```powershell
# Make sure you're in the backend directory
npm run db:migrate
```

You should see: Database tables created successfully!

**Note**: This creates the `users`, `events`, and `swap_requests` tables in your Supabase database.

### 6. Start the Application

Open **TWO** terminals:

**Terminal 1 (Backend):**
```powershell
cd backend
npm run dev
```

You should see:
```
Server is running on http://localhost:3000
Database connected successfully
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 7. Open in Browser

Navigate to: `http://localhost:5173`

You should see the SlotSwapper login page! 🎉

## Testing the Application

### Create Test Users

1. **Sign Up as User A**:
   - Name: Alice Johnson
   - Email: alice@test.com
   - Password: password123

2. **Sign Up as User B** (use incognito/private window):
   - Name: Bob Smith
   - Email: bob@test.com
   - Password: password123

### Test Swap Flow

1. **Alice** creates an event:
   - Title: "Team Standup"
   - Date/Time: Tomorrow at 9:00 AM

2. **Alice** marks it as "Swappable"

3. **Bob** creates an event:
   - Title: "Client Call"
   - Date/Time: Tomorrow at 2:00 PM

4. **Bob** marks it as "Swappable"

5. **Alice** navigates to "Marketplace"
   - Should see Bob's "Client Call"
   - Clicks "Request Swap"
   - Selects "Team Standup"
   - Confirms

6. **Bob** navigates to "Requests"
   - Should see incoming request from Alice
   - Clicks "Accept"

7. **Both users** check their calendars
   - Alice now has "Client Call" at 2:00 PM
   - Bob now has "Team Standup" at 9:00 AM

**Success!** The swap worked perfectly! ✨

## Troubleshooting

### Backend won't start

**Error**: `Error: connect ECONNREFUSED` or connection timeout

**Solution**: Check your Supabase connection string in `backend/.env`:
- Make sure you copied the **Connection pooling** URI (not Direct connection)
- Verify the password is correct (no special characters need encoding)
- Check that your Supabase project is active (not paused)

---

**Error**: `password authentication failed`

**Solution**: 
1. Go to Supabase Dashboard → Project Settings → Database
2. Reset database password if needed
3. Update `DATABASE_URL` in `backend/.env` with the new password

### Frontend won't start

**Error**: `Cannot find module`

**Solution**: Install dependencies:
```powershell
npm install
```

---

**Error**: API calls fail with 404

**Solution**: Backend is not running. Start it in a separate terminal.

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**: Kill the process or change port in `backend/.env`

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Import Postman collection files for API testing
- View your database tables in Supabase Dashboard → Table Editor
- Explore the codebase and customize it

## Project Structure

```
slot-swapper/
├── backend/
│   ├── src/
│   │   ├── controllers/        # Business logic (auth, events, swaps)
│   │   ├── middleware/         # Authentication middleware
│   │   ├── routes/             # API route definitions
│   │   ├── db/                 # Database connection & migrations
│   │   ├── utils/              # Validation schemas (Zod)
│   │   └── server.ts           # Express application entry
│   └── .env                    # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API client
│   │   ├── components/         # React components (Navbar, etc.)
│   │   ├── context/            # Auth context & state management
│   │   ├── pages/              # Page components (Dashboard, etc.)
│   │   ├── types/              # TypeScript type definitions
│   │   ├── App.tsx             # Main app & routing
│   │   └── main.tsx            # React entry point
│   └── .env                    # Frontend environment variables
│
├── SlotSwapper_API.postman_collection.json
├── SlotSwapper.postman_environment.json
├── README.md                   # Complete documentation
└── QUICKSTART.md               # This file
```

## Viewing Your Data

You can view and manage your data directly in Supabase:
1. Go to your Supabase Dashboard
2. Click on "Table Editor" in the left sidebar
3. You'll see `users`, `events`, and `swap_requests` tables
4. Click any table to view/edit data

Happy swapping! 🔄
