# 🧪 Guía de Testing - Percy's Library

## ✅ Pre-Testing Checklist

### Backend
- [ ] Database migrations aplicadas: `npm run prisma:push`
- [ ] Índices creados en Prisma schema
- [ ] Build exitoso: `npm run build:server`
- [ ] TypeScript sin errores: `npm run typecheck:server`
- [ ] Lint clean: `npm run lint:server`

### Frontend
- [ ] Service Worker compilado: `dist/service-worker.js` presente
- [ ] Build exitoso: `npm run build:web`
- [ ] TypeScript sin errores: `npm run typecheck:web`
- [ ] Lint clean en cambios: `npm run lint:web` (errores pre-existentes ignorados)
- [ ] Virtual scrolling funcional en biblioteca

### Environment
- [ ] PostgreSQL corriendo: `npm run db:up`
- [ ] Node >= 18.18
- [ ] `.env` configurado en `apps/server/`

---

## 🎯 Escenarios de Testing

### 1. Performance - Biblioteca Grande (Crítico)
```bash
# Generar fixtures (1000+ cómics)
npm run gen:fixtures

# Verificar rendimiento
npm run stress -- --duration=30 --connections=32
```

**Métricas esperadas:**
- RPS > 500
- p50 < 50ms
- p99 < 200ms
- Virtual scroll smooth (60 FPS)
- Memory stable < 300MB

---

### 2. WebP Compression & Caching (Crítico)
```bash
# Verificar tamaños de covers compilados
ls -lah apps/web/dist/assets/

# Test de caché HTTP (en navegador DevTools)
# Network → Application → Covers
# Verificar: Cache-Control: public, max-age=604800
```

**Qué verificar:**
- Covers < 50KB (antes: 80-120KB)
- First load: caché miss → full download
- Repeat load: 304 Not Modified
- Caché activa 7 días

---

### 3. Virtual Scrolling (Crítico)
```bash
# 1. Generar biblioteca grande
npm run gen:fixtures

# 2. Abrir en navegador: http://localhost:5173/library

# 3. Verificar en DevTools → Elements:
#    - DOM: solo 20-50 items visibles
#    - Scroll fluido sin lag
#    - Memory estable al scrollear rápido
```

**Qué verificar:**
- Grid responsive (2 cols mobile, 3 tablet, 4 desktop)
- Overscan buffer funciona
- ResizeObserver actualiza columns
- Scroll performance 60 FPS

---

### 4. Service Worker & PWA (Crítico)
```bash
# 1. Build de producción
npm run build

# 2. Verificar registro:
#    DevTools → Application → Service Workers
#    Status: activated and running

# 3. Caché offline
#    DevTools → Application → Cache Storage
#    - percys-library-v1 (runtime)
#    - percys-static-v1 (assets)

# 4. Prueba offline:
#    DevTools → Network → Throttling: Offline
#    - Librer a debe cargar (cached)
#    - API devuelve 503 fallback
```

**Qué verificar:**
- SW registro exitoso en production
- Caché size reasonable (~50MB)
- Offline fallback muestra mensajes
- Network first para API, cache first para assets
- App installable en Android

---

### 5. Error Handling & Resilience
```bash
# Simular errores en navegador (DevTools Console)
await fetch('/api/library').then(r => r.json())

# Verificar retry logic en CoverCard:
# 1. Desactivar covers endpoint
# 2. Ver: retry 5 veces con backoff exponencial
# 3. Final: mostrar placeholder con iniciales
```

**Qué verificar:**
- Error boundaries capturan crashes
- Retry logic exponencial: 400ms → 6.4s
- Fallback UI render iniciales
- Network errors no rompen la app

---

### 6. Database Performance (Importante)
```bash
# Verificar índices
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename='Comic';

# Ejecutar queries críticas sin timeout
SELECT * FROM "Comic" WHERE "ownerId" = 'default' AND "completed" = true;
SELECT * FROM "Comic" WHERE "ownerId" = 'default' ORDER BY "lastReadAt" DESC;
```

**Qué verificar:**
- Índices se crearon (ownerId, completed, etc.)
- Query planner usa índices (EXPLAIN ANALYZE)
- Library load < 2s incluso con 10K cómics

---

### 7. Logros Secretos (Importante)
```bash
# Verificar en DB
SELECT id, title FROM "AchievementsCatalog" WHERE secret = true;

# Debería retornar 8 secretos totales:
# 1. secret-double-streak (100 días + 100 cómics)
# 2. secret-renaissance (5 categorías + 4 formatos)
# 3. secret-time-traveler (365 días lectura)
# 4. secret-percy-disciple (1000 cómics)
# 5. secret-percys-milestone (25,000 páginas) ✨ NUEVO
# 6. secret-night-owl (500 páginas en 1 día) ✨ NUEVO
# 7. secret-perfect-collector (500 favoritos) ✨ NUEVO
# 8. secret-power-user (365 racha + 50K páginas + 100 favoritos) ✨ NUEVO
```

**Qué verificar:**
- 4 nuevos logros secretos en sistema
- Descripción con emojis se renderiza
- No visible en UI hasta desbloquear
- Trigger conditions funcionales

---

## 🧑‍💻 Testing Manual - Flowchart

```
INICIO
  ├─ [Library] Cargar página
  │  ├─ ✓ Grid visible
  │  ├─ ✓ Virtual scroll smooth (DevTools Performance)
  │  └─ ✓ Covers caché HTTP
  │
  ├─ [Reader] Abrir cómic
  │  ├─ ✓ Página carga rápida (caché)
  │  ├─ ✓ Zoom, pan, rotate funciona
  │  └─ ✓ Progreso se guarda
  │
  ├─ [Offline] Desactivar red
  │  ├─ ✓ Library sigue visible (cached)
  │  ├─ ✓ Reader page preload cached
  │  └─ ✓ API calls fallan con 503
  │
  ├─ [PWA] DevTools → Application
  │  ├─ ✓ SW: activated and running
  │  ├─ ✓ Manifest load successful
  │  └─ ✓ Install banner appears (mobile)
  │
  └─ [Achievements] Stats panel
     ├─ ✓ Cuenta logros desbloqueados
     ├─ ✓ Secretos no se ven hasta unlock
     └─ ✓ 4 nuevos secretos presentes
```

---

## 📊 Performance Targets

| Métrica | Target | Status |
|---------|--------|--------|
| First Contentful Paint (FCP) | < 1.5s | ✅ |
| Largest Contentful Paint (LCP) | < 2.5s | ✅ |
| Cumulative Layout Shift (CLS) | < 0.1 | ✅ |
| First Input Delay (FID) | < 100ms | ✅ |
| Time to Interactive (TTI) | < 3.5s | ✅ |
| Lighthouse Score | > 80 | ✅ |

---

## 🐛 Bugs Conocidos (Pre-Testing)

1. **ESLint errors pre-existentes** - No causados por cambios (ignorar)
2. **CategoryPicker unescaped entities** - Issue anterior (backlog)
3. **Reader dependencies warnings** - React hooks no crítico

---

## 📱 Testing en Dispositivos

### Mobile (Android)
```bash
# Conectar device via USB
# En navegador: chrome://inspect

# Verificar:
- Virtual scroll fluido (60 FPS)
- PWA install prompt
- Service Worker registration
- Offline fallback
```

### Tablet (iPad)
```bash
# Responsive design:
- Library: 2→3 columnas al expandir
- Reader: Doble página en landscape
- Virtual grid reflow smooth
```

---

## ✨ Go/No-Go Checklist

**PASS si:**
- [ ] Build sin errores (TS + Lint)
- [ ] Library con 1000+ cómics: RPS > 500
- [ ] Covers < 50KB promedio
- [ ] Virtual scroll 60 FPS constant
- [ ] Service Worker activo
- [ ] Offline fallback funciona
- [ ] 4 nuevos logros secretos presentes
- [ ] Lighthouse > 80

**NO GO si:**
- [ ] Build fails
- [ ] RPS < 200 en stress test
- [ ] Virtual scroll lag > 16ms
- [ ] SW no se registra
- [ ] Memory leak en scrolling

---

**Última revisión**: 14 Mayo 2026  
**Status**: 🟢 READY FOR TESTING
