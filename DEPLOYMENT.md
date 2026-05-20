# Deployment & Testing Guide

## Pre-Flight Checklist

### Environment Setup
- [ ] Node.js >= 18.18 installed (`node --version`)
- [ ] PostgreSQL running (or Supabase URL configured)
- [ ] `.env` files configured in `apps/server/` and `apps/web/` (if needed)
- [ ] `npm install` completed successfully

### Database
- [ ] Run `npm run db:push` to apply latest schema (includes 5 new performance indexes)
- [ ] Verify connection: `npm run db:studio` opens Prisma GUI
- [ ] Check table counts: `Comics`, `Users`, `LibraryItems`, `ReadProgress`, `UserAchievements`

### Frontend Build
```bash
npm run build:web
# Verify: apps/web/dist/ created with service-worker.js (1.25 KB)
```

### Backend Build
```bash
npm run build:server
# Verify: apps/server/dist/ created
```

### Type Safety
```bash
npm run typecheck
# Must pass: 0 errors, both web and server
```

## Testing Phases

### Phase 1: Unit & Integration
```bash
# 1. Generate 1000+ test comics
npm run gen:fixtures

# 2. Run performance stress test
npm run stress
# Expected: >500 RPS on /comics endpoint
# Check RAM usage: <500 MB with virtual scrolling active

# 3. TypeScript validation
npm run typecheck
# Expected: 0 errors
```

### Phase 2: Frontend Testing

#### Virtual Scrolling
- Open DevTools (F12) → Application → Service Workers
- Load library with 500+ comics
- Scroll rapidly
  - ✅ Frame rate stays ~60 FPS
  - ✅ Memory doesn't spike (< 150 MB increase)
  - ✅ DOM nodes stay < 50 (check Elements panel)

#### Service Worker
- Open DevTools → Application → Manifest
  - ✅ `manifest.json` loads
  - ✅ SW status: "activated"
  - ✅ Installable badge appears
- Load library page
- Open DevTools → Network tab
  - ✅ CSS/JS cached (Status 304 or "from ServiceWorker")
  - ✅ Images cached on second load
- Go offline (DevTools → Network → Offline)
  - ✅ Library still renders
  - ✅ Reader still works (already loaded pages)
  - ✅ Graceful fallback: new content shows "offline" message

#### WebP Compression
- Open Network tab → Filter: `cover|thumb`
- Reload library page
  - ✅ All covers are `.webp` format
  - ✅ Average cover size < 50 KB (before: ~120 KB)
  - ✅ Total CSS+JS+images < 2 MB on first load
- Check Device Emulation:
  - Mobile (iPhone 12): < 5 sec load time
  - Tablet (iPad): < 3 sec
  - Desktop: < 2 sec

### Phase 3: Achievements Testing

#### Existing Achievements (Original 4)
- [ ] Read 10 comics → "Primer paso" (unlocks)
- [ ] Read 100 comics → "Collector" (unlocks)
- [ ] Get 30-day streak → "El Persistente" (unlocks)
- [ ] Read 1000 pages → "Maratón" (unlocks)

#### New Secret Achievements (4 New)
- [ ] Read 25,000 pages total → 🔥 "Percy's Milestone" (secret, unlocks)
  - *Testing*: Use admin console or data mutation to set pages to 25K and refresh
- [ ] Read 500 pages in 1 day → 🌙 "Nocturno Obsesionado" (secret, unlocks)
  - *Testing*: Manually update `dailyPagesRead` to 500 via DB
- [ ] Add 500 favorites → 💎 "Coleccionista Perfecto" (secret, unlocks)
  - *Testing*: Favorite 500 comics, check after library refresh
- [ ] 365 streak + 50K pages + 100 favorites → ⚡ "Power User Legendario" (secret, unlocks)
  - *Testing*: Combine all three conditions and verify unlock

### Phase 4: Reader Performance

#### Virtual Page Preload
- Open comic with 500+ pages
- Check DevTools → Network → XHR
  - ✅ Only current + next 3 pages load initially
  - ✅ Subsequent pages load on-demand
  - ✅ No lag when flipping pages

#### Reader Modes
- [ ] Scroll vertical (default) — smooth, 60 FPS
- [ ] Paginated horizontal — instant page flip
- [ ] Double page — centered, correct scaling
- [ ] Fullscreen — true fullscreen, no UI flicker
- [ ] Zoom — pinch and Ctrl+scroll work smoothly

#### Keyboard Shortcuts
- [ ] `←` / `→` — page navigation
- [ ] `Space` — next page
- [ ] `F` — fullscreen toggle
- [ ] `T` — thumbnail strip toggle
- [ ] `G` — go to page dialog
- [ ] `?` — help modal shows all shortcuts
- [ ] `Esc` — exit fullscreen

### Phase 5: Security & Headers

#### Response Headers
```bash
curl -i http://localhost:5000/api/comics | grep -i "x-\|cache\|strict\|csp\|frame"
```
- ✅ `Strict-Transport-Security: max-age=31536000` (HSTS)
- ✅ `X-Frame-Options: DENY` (no clickjacking)
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Content-Security-Policy: default-src 'self'...`
- ✅ `Cache-Control: max-age=3600` (for static assets)

#### Database Security
- [ ] No SQL injection on search: try `'; DROP TABLE comics; --`
  - ✅ Prisma parameterized queries prevent this
- [ ] Auth validation: try accessing `/api/user/other-user-id`
  - ✅ 403 Forbidden (or equivalent auth check)

### Phase 6: Load Testing

```bash
# Optional: install artillery globally
npm install -g artillery

# Run load test (adjust duration/rps as needed)
artillery run apps/server/loadtest.yml
# or manually:
npm run stress
```

Expected results:
- ✅ RPS > 500 sustained (3+ sec test)
- ✅ P95 latency < 200 ms
- ✅ Error rate < 1%
- ✅ No connection pool exhaustion
- ✅ Memory footprint stable (< 600 MB)

## Production Checklist

### Environment
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` points to production DB
- [ ] `CORS_ORIGINS` configured correctly (not `*`)
- [ ] `LOG_LEVEL=info` or `warn`
- [ ] All secrets in `.env` or vault (never in code)

### Build
```bash
npm run build  # builds both web and server
npm run build:web -- --mode production  # explicit prod build
```

### Deployment
```bash
# Test production build locally
cd apps/web && npm run preview  # serves dist/ on :4173
cd apps/server && npm run start  # runs dist/index.js

# Verify health
curl http://localhost:5000/health
# Expected: { "status": "ok" }
```

### Monitoring
- Set up error tracking (Sentry, DataDog, etc.)
- Monitor:
  - Error rate (aim for < 0.1%)
  - Response time (P95 < 500 ms)
  - DB connection pool
  - Cache hit rates
  - Service worker registration rate

## Rollback Plan

If issues found post-deployment:

1. **Quick Rollback**: Revert to previous commit
   ```bash
   git revert HEAD
   git push
   # Redeploy with previous version
   ```

2. **Feature Flag**: If only one feature is broken, disable it in `.env`
   ```bash
   FEATURE_VIRTUAL_SCROLL=false  # disables new grid
   FEATURE_SW=false              # disables service worker
   ```

3. **Database**: If schema broke
   ```bash
   npm run db:reset  # DESTRUCTIVE: clears all data
   npm run db:push   # or just push schema again
   ```

## Monitoring & Observability

### Log Levels (apps/server/.env)
```
LOG_LEVEL=info    # Production default
LOG_LEVEL=debug   # Development
LOG_LEVEL=error   # Minimal
```

### Key Metrics to Track

| Metric | Target | Tool |
|--------|--------|------|
| Response time (P95) | < 500 ms | Load test, DevTools |
| Error rate | < 0.1% | Server logs, Sentry |
| Cache hit ratio | > 80% | DevTools Network |
| Virtual scroll FPS | > 55 | DevTools Performance |
| Service worker activation | > 90% | Analytics, DevTools |
| Memory (process) | < 600 MB | `ps aux` or PM2 monitor |
| DB connection pool | < 20/max | Prisma logs |

## FAQ

### Q: Virtual scrolling is choppy on older devices
A: Reduce overscan buffer in `VirtualGrid.tsx` line 24: `const OVERSCAN = 1` (was 2)

### Q: Service worker not updating
A: Check `CACHE_NAME` in `service-worker.ts`. Increment version: `v1` → `v2`

### Q: WebP not serving on iOS
A: Verify `Accept` header includes `image/webp`. Fallback to JPEG in middleware if needed.

### Q: Database slow after 10K+ comics
A: Ensure indexes are created: `npm run db:push`, then verify in Prisma Studio

### Q: Can't install PWA
A: Check HTTPS is enabled in production, manifest icons are 192×192 and 512×512 PNG

---

**Ready to test?** Start with Phase 1 and work through sequentially. Document any failures in GitHub Issues for triage.
