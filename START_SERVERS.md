# Starting the Development Servers

## Quick Start

Open **two separate terminal windows** (or PowerShell tabs):

### Terminal 1 - Backend Server (Port 8000)
```powershell
cd backend
npm run dev
```

Wait until you see: `🚀 Server is running at http://localhost:8000`

### Terminal 2 - Frontend Server (Port 3000)
```powershell
cd frontend
npm run dev
```

Wait until you see: `ready - started server on 0.0.0.0:3000`

## Or Use the Root Script (Both Servers)

From the root directory:
```powershell
npm run dev
```

This will start both servers concurrently.

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

**For Backend (8000):**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**For Frontend (3000):**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Missing Dependencies

If servers don't start, install dependencies:

```powershell
# Root directory
npm install

# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### Verify Servers Are Running

Open your browser and check:
- Backend: http://localhost:8000/health
- Frontend: http://localhost:3000

## Test Credentials

Once servers are running, you can register with:

**Username:** `testuser`  
**Email:** `test@example.com`  
**Password:** `Test1234!@#$`

