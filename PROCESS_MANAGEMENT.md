# Node.js Process Management Guide

## Quick Debug Steps for Port/Process Issues

1. **In Git Bash**:
```bash
# Find all Node processes
wmic process where "name='node.exe'" get processid

# Kill specific process (replace XXXX with PID)
taskkill //F //PID XXXX

# Or kill all Node processes at once
wmic process where "name='node.exe'" delete
```

2. **After killing processes**:
```bash
npm run dev
```

3. **If port is still in use**:
- Repeat process-killing steps
- Wait a few seconds (processes need time to fully terminate)
- Try starting server again

## Check Running Processes

1. **Find processes using port 3000**:
```cmd
netstat -ano | findstr :3000
```
This will show something like:
```
TCP    127.0.0.1:3000    0.0.0.0:0    LISTENING    12345
```
The last number (12345) is the Process ID (PID)

2. **Find Node.js processes**:
```cmd
tasklist | findstr "node.exe"
```

## Kill Processes

1. **Kill by PID** (replace 12345 with actual PID):
```cmd
taskkill /PID 12345 /F
```

2. **Kill all Node processes** (use with caution):
```cmd
taskkill /IM "node.exe" /F
```

## Alternative Methods

1. **Using PowerShell to find and kill process on port 3000**:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

2. **Check what's using the port and kill it in one command**:
```cmd
for /f "tokens=5" %a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %a
```

## Best Practices
1. Always check running processes first before killing
2. Use PID-specific kill commands when possible
3. Use force kill (/F) only when necessary
4. Keep track of your Node.js processes

## Preventive Measures
1. Always use Ctrl+C to properly stop Node servers
2. Consider adding error handling for port in use:
```javascript
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('Port 3000 is already in use! Please free up the port and try again.');
    process.exit(1);
  }
});
```
