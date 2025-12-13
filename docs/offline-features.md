# Offline Features

This app now includes comprehensive offline support with the following capabilities:

## Features Implemented

### 1. **Network Status Indicator**
- **Amber banner** appears at top when you go offline
- Shows count of pending changes waiting to sync
- **Green banner** appears when reconnected with sync progress
- Automatically disappears after syncing completes

### 2. **Offline Operation Queue**
- All create, update, and delete operations are queued when offline
- Queue is stored in localStorage and persists across app restarts
- Automatic sync when connection is restored
- Optimistic UI updates for instant feedback

### 3. **Background Sync**
- Operations automatically sync when coming back online
- Failed operations are retried
- Queue is cleared only when all operations succeed
- Visual feedback during sync process

## How It Works

### When Offline:
1. Make changes to gifts, people, or lists
2. Changes are saved locally and queued
3. UI updates immediately (optimistic updates)
4. Banner shows how many changes are pending

### When Back Online:
1. Green banner appears showing "Syncing..."
2. All queued operations are processed in order
3. Success message when complete
4. Banner disappears after 4 seconds

## Technical Details

### Queue Management
- Operations stored in `localStorage` as JSON
- Each operation includes: type (insert/update/delete), table, data, timestamp
- Queue processes automatically on reconnect
- Failed operations remain in queue for retry

### Optimistic Updates
- UI updates immediately before server confirmation
- Provides responsive feel even offline
- Reverts changes if sync fails (when online)

### Supported Operations
- ✅ Create/update/delete gifts
- ✅ Create/update/delete people
- ✅ Mark gifts as purchased/wrapped
- ✅ Update person budgets
- ✅ Mark people as completed

### Not Queued (Requires Connection)
- Creating/updating/deleting lists
- Household operations (invites, members)
- Authentication operations

## Testing Offline Mode

### On Desktop:
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Make changes in the app
5. Uncheck "Offline" to see sync

### On Mobile:
1. Enable Airplane Mode
2. Make changes in the PWA
3. Disable Airplane Mode
4. Watch changes sync automatically

## User Experience

The app feels fast and responsive even without internet:
- No waiting for server responses
- Instant feedback on actions
- Clear indicators of sync status
- Automatic background synchronization
- No data loss when offline

## Technical Architecture

```
User Action → Offline Check
              ↓
              ├─ Online: Direct Supabase call
              └─ Offline: Queue + Optimistic Update
                          ↓
                      localStorage
                          ↓
                  Network Restored
                          ↓
                  Process Queue
                          ↓
                  Sync to Supabase
```
