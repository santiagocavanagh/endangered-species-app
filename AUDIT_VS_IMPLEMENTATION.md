# 🔄 AUDIT FINDINGS vs IMPLEMENTATION STATUS
## Cross-Reference Analysis for Endangered Species App

**Date:** January 30, 2026  
**Purpose:** Map audit vulnerabilities to specific code changes required

---

## 📊 VULNERABILITY STATUS MATRIX

| # | Vulnerability | Severity | Files Affected | Implementation Status | Verification Method |
|---|---------------|----------|----------------|----------------------|---------------------|
| 1 | Status values inconsistent | 🔴 CRITICAL | species.entity.ts, species-modal.tsx, species-card.tsx, species.dto.ts | ❓ UNKNOWN | Check enum values match |
| 2 | No validation in Create/Update | 🔴 CRITICAL | species.controller.ts, species.dto.ts, validation.middleware.ts, species.routes.ts | ❓ UNKNOWN | Test invalid POST request |
| 3 | API_URL hardcoded | 🔴 CRITICAL | api.ts, .env files | ❓ UNKNOWN | Check import.meta.env usage |
| 4 | Token expiration not checked | 🟠 HIGH | AuthContext.tsx | ❓ UNKNOWN | Check for jwtDecode usage |
| 5 | No species validation in favorites | 🟠 HIGH | favorite.controller.ts | ❓ UNKNOWN | Test adding favorite with invalid ID |
| 6 | No rate limiting on species | 🟠 HIGH | species.routes.ts | ❓ UNKNOWN | Check for express-rate-limit |
| 7 | updateProfile URL duplicated | 🟠 HIGH | api.ts | ❓ UNKNOWN | Search for hardcoded localhost |
| 8 | localStorage vulnerable to XSS | 🟡 MEDIUM | AuthContext.tsx | ❌ NOT FIXABLE (requires backend) | Document as known limitation |
| 9 | 'any' types used | 🟡 MEDIUM | Multiple files | ❓ UNKNOWN | TypeScript strict mode check |
| 10 | No specific error handling | 🟡 MEDIUM | All controllers | ❓ UNKNOWN | Check error instanceof Error |
| 11 | No imageUrl validation | 🟡 MEDIUM | species-card.tsx | ❓ UNKNOWN | Check for fallback image |
| 12 | No global error handler | 🟡 MEDIUM | index.ts | ❓ UNKNOWN | Check for error middleware |
| 13 | No request body size limit | 🟡 MEDIUM | index.ts | ❓ UNKNOWN | Check express.json options |
| 14 | No database indexes | 🟡 MEDIUM | favorite.entity.ts | ❓ UNKNOWN | Check @Index decorators |
| 15 | No pagination in favorites | 🟢 LOW | favorite.controller.ts | ❓ UNKNOWN | Check for limit/skip params |
| 16 | Inconsistent API responses | 🟢 LOW | All controllers | ❓ UNKNOWN | Check response format |
| 17 | No XSS protection in inputs | 🟡 MEDIUM | species-modal.tsx | ❌ ACCEPTABLE (React escapes) | Document as handled |
| 18 | No modal state reset | 🟢 LOW | species-modal.tsx | ❓ UNKNOWN | Test opening modal twice |
| 19 | No network error handling | 🟡 MEDIUM | App.tsx | ❓ UNKNOWN | Check catch blocks |

---

## 🎯 IMPLEMENTATION PRIORITY MATRIX

### WEEK 1 - CRITICAL FIXES (Must Complete)

#### Fix #1: Align Status Values

**Backend Changes Required:**

```typescript
// ✅ backend/src/entities/species.entity.ts
export enum ConservationStatus {
  EXTINCT = "EX",
  CRITICALLY_ENDANGERED = "CR",
  ENDANGERED = "EN",
  VULNERABLE = "VU",
  NEAR_THREATENED = "NT",
  LEAST_CONCERN = "LC"
}

@Column({ type: "enum", enum: ConservationStatus })
status!: ConservationStatus;
```

**Frontend Changes Required:**

```typescript
// ✅ frontend/src/utils/status-mappings.ts (NEW FILE)
export const STATUS_LABELS = {
  EX: "Extinto",
  CR: "En Peligro Crítico",
  EN: "En Peligro",
  VU: "Vulnerable",
  NT: "Casi Amenazado",
  LC: "Preocupación Menor"
};

// ✅ frontend/src/app/components/species-modal.tsx
// Replace old values
<select value={formData.status}>
  {Object.entries(STATUS_LABELS).map(([code, label]) => (
    <option key={code} value={code}>{label}</option>
  ))}
</select>

// ✅ frontend/src/app/components/species-card.tsx
interface SpeciesCardProps {
  species: {
    status: "EX" | "CR" | "EN" | "VU" | "NT" | "LC";  // Updated
  };
}
```

**Verification Command:**

```bash
# Backend
grep -r '"critico"\|"peligro"\|"vulnerable"' backend/src/
# Expected: No matches

# Frontend
grep -r '"critico"\|"peligro"\|"vulnerable"' frontend/src/
# Expected: No matches

# Database
mysql -u user -p -e "DESCRIBE species;" your_database
# Expected: status enum('EX','CR','EN','VU','NT','LC')
```

---

#### Fix #2: Implement DTO Validation

**Files to Create/Modify:**

**1. Create DTO File**
```bash
touch backend/src/dtos/species.dto.ts
```

**2. Install Dependencies**
```bash
cd backend
npm install class-validator class-transformer reflect-metadata
```

**3. Create Validation Middleware**
```bash
touch backend/src/middleware/validation.middleware.ts
```

**4. Modify Controller**
```typescript
// backend/src/controllers/species.controller.ts
// REMOVE: TODO comments
// REMOVE: Manual validation
// ADD: Trust validated req.body
```

**5. Modify Routes**
```typescript
// backend/src/routes/species.routes.ts
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateSpeciesDTO, UpdateSpeciesDTO } from '../dtos/species.dto';

router.post('/', authenticateToken, isAdmin, validationMiddleware(CreateSpeciesDTO), SpeciesController.create);
router.put('/:id', authenticateToken, isAdmin, validationMiddleware(UpdateSpeciesDTO), SpeciesController.update);
```

**Verification Test:**

```bash
# Test invalid data
curl -X POST http://localhost:3000/api/species \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "X", "status": "INVALID"}'

# Expected Response:
# {
#   "error": "Validation failed",
#   "details": [
#     {
#       "property": "name",
#       "constraints": { "minLength": "Name must be at least 3 characters" }
#     },
#     {
#       "property": "status",
#       "constraints": { "isEnum": "Invalid conservation status" }
#     }
#   ]
# }
```

---

#### Fix #3: Environment-Based API URL

**Files to Create/Modify:**

**1. Create Environment Files**
```bash
cd frontend

# Development
cat > .env.development << EOF
VITE_API_URL=http://localhost:3000/api
EOF

# Production
cat > .env.production << EOF
VITE_API_URL=https://your-production-api.com/api
EOF

# Example (add to .gitignore)
cat > .env.example << EOF
VITE_API_URL=http://localhost:3000/api
EOF
```

**2. Modify api.ts**
```typescript
// frontend/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Add validation warning
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.error('⚠️ CRITICAL: VITE_API_URL not configured for production!');
}

// Fix updateProfile method
updateProfile: async (data: { name?: string; password?: string }) => {
  const response = await fetch(
    `${API_URL}/auth/update-profile`,  // ✅ Use constant
    // ...
  );
}
```

**3. Add TypeScript Types**
```typescript
// frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Verification Commands:**

```bash
# Development
cd frontend
npm run dev
# Check console - should use localhost:3000

# Production build
npm run build
grep -r "localhost:3000" dist/assets/*.js
# Expected: No matches (only in source maps)

# Check all hardcoded URLs removed
grep -r "http://localhost:3000" src/ --exclude="*.md"
# Expected: Only in fallback value
```

---

### WEEK 2 - HIGH PRIORITY FIXES

#### Fix #4: Token Expiration Validation

**Files to Modify:**

**1. Install Dependency**
```bash
cd frontend
npm install jwt-decode
```

**2. Create Token Utility**
```typescript
// frontend/src/utils/token.ts (NEW FILE)
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Token decode error:', error);
    return true;
  }
}

export function getTokenPayload(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}
```

**3. Modify AuthContext**
```typescript
// frontend/src/context/AuthContext.tsx
import { isTokenExpired } from '../utils/token';

useEffect(() => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  const email = localStorage.getItem('userEmail');

  if (token && role && email) {
    if (isTokenExpired(token)) {
      // Clear expired session
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      setUser(null);
      
      // Optional: Show notification to user
      console.warn('Session expired. Please login again.');
      // Or use toast notification if available
    } else {
      setUser({ 
        email, 
        role: role as 'admin' | 'user', 
        name: localStorage.getItem('userName') || undefined 
      });
    }
  }
}, []);
```

**Verification Test:**

```bash
# 1. Login and get token
# 2. In browser console:
localStorage.setItem('token', 'expired.jwt.token')
# 3. Refresh page
# Expected: Token should be cleared, user logged out
```

---

#### Fix #5: Species Validation in Favorites

**Files to Modify:**

```typescript
// backend/src/controllers/favorite.controller.ts

import { Species } from '../entities/species.entity';
import { AppDataSource } from '../data.source';

static addFavorite = async (req: AuthRequest, res: Response) => {
  const { speciesId } = req.params;
  const userId = req.userId;

  try {
    // ✅ Validate ID format
    const numericSpeciesId = parseInt(speciesId, 10);
    if (isNaN(numericSpeciesId)) {
      return res.status(400).json({ 
        error: 'Invalid species ID format',
        details: 'Species ID must be a valid number'
      });
    }

    // ✅ Verify species exists
    const speciesRepo = AppDataSource.getRepository(Species);
    const species = await speciesRepo.findOneBy({ id: numericSpeciesId });

    if (!species) {
      return res.status(404).json({ 
        error: 'Species not found',
        details: `No species found with ID ${numericSpeciesId}`
      });
    }

    // ✅ Check for duplicate
    const existingFavorite = await favoriteRepo.findOne({
      where: {
        user: { id: userId },
        species: { id: numericSpeciesId }
      }
    });

    if (existingFavorite) {
      return res.status(409).json({ 
        error: 'Duplicate favorite',
        details: 'This species is already in your favorites'
      });
    }

    // ✅ Create favorite
    const newFavorite = favoriteRepo.create({
      user: { id: userId } as User,
      species: { id: numericSpeciesId } as Species
    });

    await favoriteRepo.save(newFavorite);

    return res.status(201).json({ 
      message: 'Species added to favorites successfully',
      data: newFavorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return res.status(500).json({ 
      error: 'Failed to add favorite',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
```

**Verification Test:**

```bash
# Test with invalid ID
curl -X POST http://localhost:3000/api/favorites/abc \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 400 Invalid species ID format

# Test with non-existent ID
curl -X POST http://localhost:3000/api/favorites/999999 \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 404 Species not found

# Test duplicate
curl -X POST http://localhost:3000/api/favorites/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
curl -X POST http://localhost:3000/api/favorites/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 409 Duplicate favorite
```

---

#### Fix #6: Rate Limiting on Species Routes

**Files to Modify:**

**1. Install Dependency**
```bash
cd backend
npm install express-rate-limit
```

**2. Create Rate Limiters**
```typescript
// backend/src/middleware/rate-limit.middleware.ts (NEW FILE)
import rateLimit from 'express-rate-limit';

export const speciesCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 species creations per hour
  message: {
    error: 'Too many species creation requests',
    details: 'Please try again in an hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const speciesUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 updates per 15 minutes
  message: {
    error: 'Too many update requests',
    details: 'Please try again in 15 minutes'
  }
});

export const speciesDeletionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 deletions per hour
  message: {
    error: 'Too many deletion requests',
    details: 'Please try again in an hour'
  }
});
```

**3. Apply to Routes**
```typescript
// backend/src/routes/species.routes.ts
import { 
  speciesCreationLimiter, 
  speciesUpdateLimiter, 
  speciesDeletionLimiter 
} from '../middleware/rate-limit.middleware';

router.post(
  '/',
  authenticateToken,
  isAdmin,
  speciesCreationLimiter,  // ✅ Add rate limiting
  validationMiddleware(CreateSpeciesDTO),
  SpeciesController.create
);

router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  speciesUpdateLimiter,  // ✅ Add rate limiting
  validationMiddleware(UpdateSpeciesDTO),
  SpeciesController.update
);

router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  speciesDeletionLimiter,  // ✅ Add rate limiting
  SpeciesController.delete
);
```

**Verification Test:**

```bash
# Test rate limiting (create 11 species rapidly)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/species \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test$i\", ...}"
  sleep 1
done

# Expected: First 10 succeed, 11th returns 429 Too Many Requests
```

---

### WEEK 3 - MEDIUM PRIORITY FIXES

#### Fix #7: Global Error Handler

**Files to Create:**

```typescript
// backend/src/middleware/error-handler.middleware.ts (NEW FILE)
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Global error handler:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Authentication failed',
      details: 'Invalid or expired token'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: err.message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid token',
      details: 'Token signature is invalid'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expired',
      details: 'Please login again'
    });
  }

  // Default 500 error
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

**Apply to App:**

```typescript
// backend/src/index.ts
import { errorHandler } from './middleware/error-handler.middleware';

// ... all routes ...

// ✅ MUST BE LAST MIDDLEWARE
app.use(errorHandler);
```

---

#### Fix #8: Request Body Size Limit

**Files to Modify:**

```typescript
// backend/src/index.ts

// ✅ Add size limits
app.use(express.json({ 
  limit: '1mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb'
}));

// ✅ Add error handler for oversized payloads
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: 'Payload too large',
      details: 'Request body exceeds 1MB limit'
    });
  }
  next(err);
});
```

---

#### Fix #9: Database Indexes

**Files to Modify:**

```typescript
// backend/src/entities/favorite.entity.ts
import { Entity, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

@Entity('favorites')
@Index(['user', 'species'], { unique: true })  // ✅ Composite unique index
export class Favorite {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  @Index()  // ✅ Index for user lookups
  user!: User;

  @ManyToOne(() => Species)
  @JoinColumn({ name: 'speciesId' })
  @Index()  // ✅ Index for species lookups
  species!: Species;

  @CreateDateColumn()
  @Index()  // ✅ Index for sorting by creation date
  createdAt!: Date;
}

// backend/src/entities/species.entity.ts
@Entity('species')
export class Species {
  // ...

  @Column({ type: 'enum', enum: ConservationStatus })
  @Index()  // ✅ Index for status filtering
  status!: ConservationStatus;

  @Column({ type: 'enum', enum: SpeciesRegion })
  @Index()  // ✅ Index for region filtering
  region!: SpeciesRegion;

  @Column({ type: 'enum', enum: SpeciesCategory })
  @Index()  // ✅ Index for category filtering
  category!: SpeciesCategory;
}
```

**Verification:**

```sql
-- Check indexes were created
SHOW INDEX FROM favorites;
SHOW INDEX FROM species;

-- Expected indexes:
-- favorites: user_id, species_id, (user_id, species_id) unique
-- species: status, region, category
```

---

#### Fix #10: Favorites Pagination

**Files to Modify:**

```typescript
// backend/src/controllers/favorite.controller.ts

static getFavorites = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  
  // ✅ Parse pagination parameters
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  try {
    // ✅ Use findAndCount for total
    const [favorites, total] = await favoriteRepo.findAndCount({
      where: { user: { id: userId } },
      relations: ['species'],
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC' }
    });

    // ✅ Return paginated response
    return res.json({
      data: favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch favorites',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
```

**Frontend Modification:**

```typescript
// frontend/src/services/api.ts

fetchFavorites: async (page: number = 1, limit: number = 10): Promise<any> => {
  try {
    const res = await fetch(
      `${API_URL}/favorites?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

---

## 📋 FILES REQUIRING CHANGES - COMPLETE LIST

### Backend Files

**Existing Files to Modify:**
1. `backend/src/entities/species.entity.ts` - Add enums, fix column types
2. `backend/src/controllers/species.controller.ts` - Remove TODO, trust validation
3. `backend/src/controllers/favorite.controller.ts` - Add species validation, pagination
4. `backend/src/routes/species.routes.ts` - Add validation middleware, rate limiting
5. `backend/src/index.ts` - Add body size limits, global error handler
6. `backend/package.json` - Add dependencies

**New Files to Create:**
7. `backend/src/dtos/species.dto.ts` - DTOs with validation decorators
8. `backend/src/middleware/validation.middleware.ts` - Generic validation middleware
9. `backend/src/middleware/rate-limit.middleware.ts` - Rate limiters
10. `backend/src/middleware/error-handler.middleware.ts` - Global error handler

### Frontend Files

**Existing Files to Modify:**
11. `frontend/src/app/components/species-modal.tsx` - Fix status values, add reset
12. `frontend/src/app/components/species-card.tsx` - Fix status types, add fallback
13. `frontend/src/services/api.ts` - Environment API URL, fix updateProfile
14. `frontend/src/context/AuthContext.tsx` - Token expiration check
15. `frontend/src/App.tsx` - Better error handling
16. `frontend/package.json` - Add jwt-decode

**New Files to Create:**
17. `frontend/src/utils/status-mappings.ts` - Status translation constants
18. `frontend/src/utils/token.ts` - Token validation utilities
19. `frontend/src/vite-env.d.ts` - Environment variable types
20. `frontend/.env.development` - Development environment
21. `frontend/.env.production` - Production environment
22. `frontend/.env.example` - Environment template

### Database

**Schema Changes Required:**
23. Migration or synchronize to update enum values

---

## 🧪 FINAL TESTING SCRIPT

```bash
#!/bin/bash
# save as: test-all-fixes.sh

echo "🧪 ENDANGERED SPECIES APP - COMPREHENSIVE TEST"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Test 1: Status enum values
echo -e "\n📝 Test 1: Status enum validation..."
if grep -r '"critico"\|"peligro"\|"vulnerable"' backend/src/ frontend/src/ > /dev/null 2>&1; then
  echo -e "${RED}❌ FAILED: Old Spanish status values still exist${NC}"
else
  echo -e "${GREEN}✅ PASSED: No old status values found${NC}"
fi

# Test 2: Validation dependencies
echo -e "\n📝 Test 2: Validation dependencies..."
cd backend
if npm list class-validator class-transformer > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASSED: Validation packages installed${NC}"
else
  echo -e "${RED}❌ FAILED: Validation packages missing${NC}"
fi
cd ..

# Test 3: Environment variables
echo -e "\n📝 Test 3: Environment configuration..."
if [ -f "frontend/.env.development" ] && [ -f "frontend/.env.production" ]; then
  echo -e "${GREEN}✅ PASSED: Environment files exist${NC}"
else
  echo -e "${RED}❌ FAILED: Missing environment files${NC}"
fi

# Test 4: Hardcoded URLs
echo -e "\n📝 Test 4: No hardcoded localhost (except fallback)..."
HARDCODED=$(grep -r "localhost:3000" frontend/src/ --exclude="*.md" | grep -v "fallback\|default" | wc -l)
if [ "$HARDCODED" -eq 0 ]; then
  echo -e "${GREEN}✅ PASSED: No hardcoded URLs found${NC}"
else
  echo -e "${RED}❌ FAILED: Found $HARDCODED hardcoded URLs${NC}"
fi

# Test 5: Required files exist
echo -e "\n📝 Test 5: Required new files..."
FILES=(
  "backend/src/dtos/species.dto.ts"
  "backend/src/middleware/validation.middleware.ts"
  "frontend/src/utils/token.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $file${NC}"
  else
    echo -e "${RED}❌ Missing: $file${NC}"
  fi
done

echo -e "\n=============================================="
echo "Testing complete! Review results above."
```

---

**End of Cross-Reference Analysis**

*Last Updated: January 30, 2026*
