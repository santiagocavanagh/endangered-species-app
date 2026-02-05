# 🔍 VERIFICATION CHECKLIST - ENDANGERED SPECIES APP
## Comprehensive Code Review for Implemented Changes

**Date:** January 30, 2026  
**Repository:** endangered-species-app  
**Purpose:** Verify implemented security and validation corrections

---

## 📋 TABLE OF CONTENTS

1. [Backend Verification](#backend-verification)
   - Species Entity
   - Species DTO
   - Validation Middleware
   - Species Controller
   - Species Routes
2. [Frontend Verification](#frontend-verification)
   - Species Modal
   - API Service
   - Type Definitions
3. [Database Schema Verification](#database-schema-verification)
4. [Remaining Issues](#remaining-issues)
5. [Testing Checklist](#testing-checklist)

---

## 🔧 BACKEND VERIFICATION

### 1. Species Entity (`backend/src/entities/species.entity.ts`)

**✅ REQUIRED CHANGES:**

```typescript
// ✅ Verify enum definition exists
export enum ConservationStatus {
  EXTINCT = "EX",
  CRITICALLY_ENDANGERED = "CR",
  ENDANGERED = "EN",
  VULNERABLE = "VU",
  NEAR_THREATENED = "NT",
  LEAST_CONCERN = "LC"
}

export enum SpeciesCategory {
  ANIMAL = "animal",
  PLANT = "planta",
  FUNGUS = "hongo"
}

export enum SpeciesRegion {
  AMERICA = "America",
  EUROPE = "Europa",
  AFRICA = "Africa",
  ASIA = "Asia",
  OCEANIA = "Oceania",
  GLOBAL = "Global"
}

@Entity('species')
export class Species {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 150 })
  scientificName!: string;

  // ✅ CHECK: Status should use enum type
  @Column({ 
    type: 'enum', 
    enum: ConservationStatus 
  })
  status!: ConservationStatus;

  @Column({ type: 'varchar', length: 100 })
  habitat!: string;

  // ✅ CHECK: Region should use enum type
  @Column({ 
    type: 'enum', 
    enum: SpeciesRegion 
  })
  region!: SpeciesRegion;

  @Column({ type: 'varchar', length: 200 })
  population!: string;

  @Column({ type: 'varchar', length: 500 })
  imageUrl!: string;

  // ✅ CHECK: Category should use enum type
  @Column({ 
    type: 'enum', 
    enum: SpeciesCategory 
  })
  category!: SpeciesCategory;

  // Additional fields if present
  @Column({ type: 'varchar', length: 50, nullable: true })
  scope?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currentTrend?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

**VERIFICATION CHECKLIST:**
- [ ] Enums are defined ABOVE the entity class
- [ ] `status` column uses `enum: ConservationStatus`
- [ ] `region` column uses `enum: SpeciesRegion`
- [ ] `category` column uses `enum: SpeciesCategory`
- [ ] String columns have appropriate length constraints
- [ ] No old union types like `"CR" | "EN" | "VU"` remain
- [ ] Timestamps (createdAt, updatedAt) are present

---

### 2. Species DTO (`backend/src/dtos/species.dto.ts`)

**✅ REQUIRED CHANGES:**

```typescript
import { 
  IsString, 
  IsEnum, 
  IsNotEmpty, 
  MinLength, 
  MaxLength, 
  IsUrl,
  IsOptional 
} from 'class-validator';

// ✅ CHECK: Enums should match entity exactly
export enum ConservationStatus {
  EXTINCT = "EX",
  CRITICALLY_ENDANGERED = "CR",
  ENDANGERED = "EN",
  VULNERABLE = "VU",
  NEAR_THREATENED = "NT",
  LEAST_CONCERN = "LC"
}

export enum SpeciesCategory {
  ANIMAL = "animal",
  PLANT = "planta",
  FUNGUS = "hongo"
}

export enum SpeciesRegion {
  AMERICA = "America",
  EUROPE = "Europa",
  AFRICA = "Africa",
  ASIA = "Asia",
  OCEANIA = "Oceania",
  GLOBAL = "Global"
}

// ✅ CHECK: CreateSpeciesDTO with all validations
export class CreateSpeciesDTO {
  @IsString({ message: "Name must be a string" })
  @IsNotEmpty({ message: "Name is required" })
  @MinLength(3, { message: "Name must be at least 3 characters" })
  @MaxLength(100, { message: "Name cannot exceed 100 characters" })
  name!: string;

  @IsString({ message: "Scientific name must be a string" })
  @IsNotEmpty({ message: "Scientific name is required" })
  @MinLength(3, { message: "Scientific name must be at least 3 characters" })
  @MaxLength(150, { message: "Scientific name cannot exceed 150 characters" })
  scientificName!: string;

  @IsEnum(ConservationStatus, { message: "Invalid conservation status. Must be one of: EX, CR, EN, VU, NT, LC" })
  @IsNotEmpty({ message: "Status is required" })
  status!: ConservationStatus;

  @IsString({ message: "Habitat must be a string" })
  @IsNotEmpty({ message: "Habitat is required" })
  @MinLength(3, { message: "Habitat must be at least 3 characters" })
  @MaxLength(100, { message: "Habitat cannot exceed 100 characters" })
  habitat!: string;

  @IsEnum(SpeciesRegion, { message: "Invalid region. Must be one of: America, Europa, Africa, Asia, Oceania, Global" })
  @IsNotEmpty({ message: "Region is required" })
  region!: SpeciesRegion;

  @IsString({ message: "Population must be a string" })
  @IsNotEmpty({ message: "Population is required" })
  @MaxLength(200, { message: "Population cannot exceed 200 characters" })
  population!: string;

  @IsUrl({}, { message: "Invalid image URL format" })
  @IsNotEmpty({ message: "Image URL is required" })
  imageUrl!: string;

  @IsEnum(SpeciesCategory, { message: "Invalid category. Must be one of: animal, planta, hongo" })
  @IsNotEmpty({ message: "Category is required" })
  category!: SpeciesCategory;

  // Optional fields
  @IsOptional()
  @IsString()
  @MaxLength(50)
  scope?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  currentTrend?: string;
}

// ✅ CHECK: UpdateSpeciesDTO with optional validations
export class UpdateSpeciesDTO {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  scientificName?: string;

  @IsOptional()
  @IsEnum(ConservationStatus, { message: "Invalid conservation status" })
  status?: ConservationStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  habitat?: string;

  @IsOptional()
  @IsEnum(SpeciesRegion, { message: "Invalid region" })
  region?: SpeciesRegion;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  population?: string;

  @IsOptional()
  @IsUrl({}, { message: "Invalid image URL format" })
  imageUrl?: string;

  @IsOptional()
  @IsEnum(SpeciesCategory, { message: "Invalid category" })
  category?: SpeciesCategory;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  scope?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  currentTrend?: string;
}
```

**VERIFICATION CHECKLIST:**
- [ ] File exists at `backend/src/dtos/species.dto.ts`
- [ ] Enums match entity definitions exactly
- [ ] All decorators from `class-validator` are imported
- [ ] CreateSpeciesDTO has `@IsNotEmpty()` on all required fields
- [ ] UpdateSpeciesDTO has `@IsOptional()` on all fields
- [ ] String length validations match entity column definitions
- [ ] Enum validation messages are descriptive
- [ ] URL validation uses `@IsUrl()`

---

### 3. Validation Middleware (`backend/src/middleware/validation.middleware.ts` or `species-validation.middleware.ts`)

**✅ REQUIRED CHANGES:**

```typescript
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

// ✅ CHECK: Generic validation middleware
export function validationMiddleware<T extends object>(dtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert plain object to DTO instance
      const dtoInstance = plainToClass(dtoClass, req.body);
      
      // Validate with options
      const errors: ValidationError[] = await validate(dtoInstance, {
        whitelist: true,              // Strip properties not in DTO
        forbidNonWhitelisted: true,   // Reject extra properties
        validationError: { target: false, value: false }
      });

      if (errors.length > 0) {
        // Format errors for response
        const formattedErrors = errors.map(error => ({
          property: error.property,
          constraints: error.constraints,
          receivedValue: error.value
        }));

        return res.status(400).json({
          error: "Validation failed",
          details: formattedErrors
        });
      }

      // Replace req.body with validated DTO instance
      req.body = dtoInstance;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({ 
        error: "Internal validation error" 
      });
    }
  };
}
```

**VERIFICATION CHECKLIST:**
- [ ] File exists (check both possible locations)
- [ ] Uses `plainToClass` from `class-transformer`
- [ ] Uses `validate` from `class-validator`
- [ ] `whitelist: true` option is set
- [ ] `forbidNonWhitelisted: true` option is set
- [ ] Returns 400 status code on validation errors
- [ ] Formats errors with property and constraints
- [ ] Replaces `req.body` with validated instance
- [ ] Has try-catch for error handling

---

### 4. Species Controller (`backend/src/controllers/species.controller.ts`)

**✅ REQUIRED CHANGES:**

```typescript
// ✅ CHECK: create method
static create = async (req: AuthRequest, res: Response) => {
  try {
    // At this point, req.body is validated CreateSpeciesDTO
    const newSpecies = SpeciesController.speciesRepo.create(req.body);
    const result = await SpeciesController.speciesRepo.save(newSpecies);

    return res.status(201).json({
      message: 'Species created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating species:', error);
    
    // ✅ CHECK: Specific error handling
    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to create species',
        details: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Failed to create species',
      details: 'Unknown error occurred'
    });
  }
};

// ✅ CHECK: update method
static update = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // ✅ CHECK: ID validation
    const numericId = parseInt(id as string, 10);
    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Invalid species ID format' });
    }

    // ✅ CHECK: Existence verification
    const species = await SpeciesController.speciesRepo.findOneBy({ 
      id: numericId 
    });

    if (!species) {
      return res.status(404).json({ error: 'Species not found' });
    }

    // At this point, req.body is validated UpdateSpeciesDTO
    SpeciesController.speciesRepo.merge(species, req.body);
    const result = await SpeciesController.speciesRepo.save(species);

    return res.json({
      message: 'Species updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating species:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to update species',
        details: error.message
      });
    }
    
    return res.status(500).json({
      error: 'Failed to update species',
      details: 'Unknown error occurred'
    });
  }
};
```

**VERIFICATION CHECKLIST:**
- [ ] `create` method no longer has `TODO: Implementar validación`
- [ ] `create` method doesn't manually validate `req.body`
- [ ] `update` method validates ID is numeric
- [ ] `update` method checks species existence before updating
- [ ] Error responses include specific messages
- [ ] Success responses use consistent format
- [ ] No generic "Error al crear" messages remain
- [ ] Uses `instanceof Error` for type checking

---

### 5. Species Routes (`backend/src/routes/species.routes.ts`)

**✅ REQUIRED CHANGES:**

```typescript
import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
// OR
// import { validationMiddleware } from '../middleware/species-validation.middleware';
import { CreateSpeciesDTO, UpdateSpeciesDTO } from '../dtos/species.dto';
import SpeciesController from '../controllers/species.controller';

const router = Router();

// ✅ CHECK: GET routes (no validation needed)
router.get('/', SpeciesController.getAll);
router.get('/success-stories', SpeciesController.getSuccessStories);
router.get('/endangered', SpeciesController.getEndangered);
router.get('/:id', SpeciesController.getOne);

// ✅ CHECK: POST route with validation middleware
router.post(
  '/',
  authenticateToken,                      // Auth check
  isAdmin,                                 // Admin check
  validationMiddleware(CreateSpeciesDTO),  // Validation
  SpeciesController.create                 // Controller
);

// ✅ CHECK: PUT route with validation middleware
router.put(
  '/:id',
  authenticateToken,                      // Auth check
  isAdmin,                                 // Admin check
  validationMiddleware(UpdateSpeciesDTO),  // Validation
  SpeciesController.update                 // Controller
);

// ✅ CHECK: DELETE route
router.delete(
  '/:id',
  authenticateToken,
  isAdmin,
  SpeciesController.delete
);

export default router;
```

**VERIFICATION CHECKLIST:**
- [ ] Validation middleware is imported
- [ ] DTOs are imported from `../dtos/species.dto`
- [ ] POST route uses `validationMiddleware(CreateSpeciesDTO)`
- [ ] PUT route uses `validationMiddleware(UpdateSpeciesDTO)`
- [ ] Middleware order: auth → admin → validation → controller
- [ ] GET and DELETE routes don't have validation (correct)

---

### 6. Dependencies (`backend/package.json`)

**✅ REQUIRED DEPENDENCIES:**

```json
{
  "dependencies": {
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13"
  }
}
```

**VERIFICATION CHECKLIST:**
- [ ] `class-validator` is installed
- [ ] `class-transformer` is installed
- [ ] `reflect-metadata` is installed
- [ ] Run `npm list class-validator class-transformer` to verify

---

## 🎨 FRONTEND VERIFICATION

### 7. Species Modal (`frontend/src/app/components/species-modal.tsx`)

**✅ REQUIRED CHANGES:**

```typescript
// ✅ CHECK: Import status mappings
import { CONSERVATION_STATUS, STATUS_LABELS } from '../../utils/status-mappings';
// OR inline definitions:
const CONSERVATION_STATUS = {
  EX: "EX",
  CR: "CR",
  EN: "EN",
  VU: "VU",
  NT: "NT",
  LC: "LC"
} as const;

const STATUS_LABELS = {
  EX: "Extinto",
  CR: "En Peligro Crítico",
  EN: "En Peligro",
  VU: "Vulnerable",
  NT: "Casi Amenazado",
  LC: "Preocupación Menor"
};

// ✅ CHECK: Status field in form
<div className="form-group">
  <label>Estado de Conservación:</label>
  <select
    value={formData.status}
    onChange={(e) => setFormData({ 
      ...formData, 
      status: e.target.value 
    })}
    required
  >
    <option value="">Seleccione un estado</option>
    {Object.entries(STATUS_LABELS).map(([code, label]) => (
      <option key={code} value={code}>
        {label}
      </option>
    ))}
  </select>
</div>

// ✅ CHECK: Region field
const REGION_OPTIONS = [
  { value: "America", label: "América" },
  { value: "Europa", label: "Europa" },
  { value: "Africa", label: "África" },
  { value: "Asia", label: "Asia" },
  { value: "Oceania", label: "Oceanía" },
  { value: "Global", label: "Global" }
];

<select
  value={formData.region}
  onChange={(e) => setFormData({ 
    ...formData, 
    region: e.target.value 
  })}
  required
>
  <option value="">Seleccione una región</option>
  {REGION_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>

// ✅ CHECK: Category field
const CATEGORY_OPTIONS = [
  { value: "animal", label: "Animal" },
  { value: "planta", label: "Planta" },
  { value: "hongo", label: "Hongo" }
];

<select
  value={formData.category}
  onChange={(e) => setFormData({ 
    ...formData, 
    category: e.target.value 
  })}
  required
>
  <option value="">Seleccione una categoría</option>
  {CATEGORY_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

**VERIFICATION CHECKLIST:**
- [ ] NO old values like `"critico"`, `"peligro"`, `"vulnerable"`
- [ ] Status dropdown uses IUCN codes: `EX`, `CR`, `EN`, `VU`, `NT`, `LC`
- [ ] Status labels are in Spanish for UI display
- [ ] Region values match backend enum exactly
- [ ] Category values match backend enum exactly
- [ ] Form state resets after successful submit
- [ ] Error handling displays validation messages from backend

---

### 8. Species Card (`frontend/src/app/components/species-card.tsx`)

**✅ REQUIRED CHANGES:**

```typescript
// ✅ CHECK: Import status mappings
import { STATUS_LABELS } from '../../utils/status-mappings';

interface SpeciesCardProps {
  species: {
    id: number;
    name: string;
    scientificName: string;
    status: "EX" | "CR" | "EN" | "VU" | "NT" | "LC";  // ✅ IUCN codes
    habitat: string;
    region: string;
    population: string;
    imageUrl: string;
    category: "animal" | "planta" | "hongo";
  };
  // ...
}

// ✅ CHECK: Display status with translation
<div className="status-badge">
  {STATUS_LABELS[species.status]}
</div>

// OR if not using mapping:
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    EX: "Extinto",
    CR: "En Peligro Crítico",
    EN: "En Peligro",
    VU: "Vulnerable",
    NT: "Casi Amenazado",
    LC: "Preocupación Menor"
  };
  return labels[status] || status;
};

<div className="status-badge">
  {getStatusLabel(species.status)}
</div>
```

**VERIFICATION CHECKLIST:**
- [ ] Species interface uses IUCN codes for status type
- [ ] NO old types like `"critico" | "peligro" | "vulnerable"`
- [ ] Display uses translation/mapping to Spanish
- [ ] Image URL has fallback handling
- [ ] Type definitions match backend response

---

### 9. API Service (`frontend/src/services/api.ts`)

**✅ REQUIRED CHANGES:**

```typescript
// ✅ CHECK: Environment-based API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Validation warning
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn('⚠️ VITE_API_URL not configured for production');
}

// ✅ CHECK: Type definitions
interface Species {
  id: number;
  name: string;
  scientificName: string;
  status: "EX" | "CR" | "EN" | "VU" | "NT" | "LC";  // IUCN codes
  habitat: string;
  region: "America" | "Europa" | "Africa" | "Asia" | "Oceania" | "Global";
  population: string;
  imageUrl: string;
  category: "animal" | "planta" | "hongo";
}

// ✅ CHECK: createSpecies uses Species type
createSpecies: async (data: Omit<Species, 'id'>): Promise<any> => {
  try {
    const res = await fetch(`${API_URL}/species`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.details || error.error || 'Failed to create species');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Create species error:', error);
    throw error;
  }
},

// ✅ CHECK: updateProfile uses centralized API_URL
updateProfile: async (data: { name?: string; password?: string }) => {
  const response = await fetch(
    `${API_URL}/auth/update-profile`,  // ✅ Not hardcoded
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }
  );
  return await response.json();
}
```

**VERIFICATION CHECKLIST:**
- [ ] `API_URL` uses `import.meta.env.VITE_API_URL`
- [ ] Has fallback to localhost for development
- [ ] NO hardcoded `http://localhost:3000/api` anywhere except fallback
- [ ] `updateProfile` method uses `${API_URL}` not hardcoded URL
- [ ] Type definitions match backend DTOs
- [ ] Error handling properly catches validation errors

---

### 10. Environment Files (`frontend/.env.*`)

**✅ REQUIRED FILES:**

```bash
# frontend/.env.development
VITE_API_URL=http://localhost:3000/api

# frontend/.env.production
VITE_API_URL=https://your-production-domain.com/api
```

**VERIFICATION CHECKLIST:**
- [ ] `.env.development` file exists
- [ ] `.env.production` file exists (or template)
- [ ] Both files define `VITE_API_URL`
- [ ] `.env` files are in `.gitignore`
- [ ] `.env.example` exists with template

---

### 11. TypeScript Environment Types (`frontend/src/vite-env.d.ts`)

**✅ REQUIRED CHANGES:**

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**VERIFICATION CHECKLIST:**
- [ ] File exists at `frontend/src/vite-env.d.ts`
- [ ] Defines `ImportMetaEnv` interface
- [ ] Includes `VITE_API_URL: string`
- [ ] TypeScript recognizes `import.meta.env.VITE_API_URL`

---

### 12. Status Mappings Utility (Optional but Recommended)

**✅ RECOMMENDED FILE:**

```typescript
// frontend/src/utils/status-mappings.ts

export const CONSERVATION_STATUS = {
  EX: "EX",
  CR: "CR",
  EN: "EN",
  VU: "VU",
  NT: "NT",
  LC: "LC"
} as const;

export const STATUS_LABELS: Record<string, string> = {
  EX: "Extinto",
  CR: "En Peligro Crítico",
  EN: "En Peligro",
  VU: "Vulnerable",
  NT: "Casi Amenazado",
  LC: "Preocupación Menor"
};

export const STATUS_COLORS: Record<string, string> = {
  EX: "#000000",
  CR: "#d32f2f",
  EN: "#f57c00",
  VU: "#fbc02d",
  NT: "#7cb342",
  LC: "#388e3c"
};

export const REGION_OPTIONS = [
  { value: "America", label: "América" },
  { value: "Europa", label: "Europa" },
  { value: "Africa", label: "África" },
  { value: "Asia", label: "Asia" },
  { value: "Oceania", label: "Oceanía" },
  { value: "Global", label: "Global" }
];

export const CATEGORY_OPTIONS = [
  { value: "animal", label: "Animal" },
  { value: "planta", label: "Planta" },
  { value: "hongo", label: "Hongo" }
];

export type ConservationStatus = keyof typeof CONSERVATION_STATUS;
export type Region = typeof REGION_OPTIONS[number]['value'];
export type Category = typeof CATEGORY_OPTIONS[number]['value'];
```

**VERIFICATION CHECKLIST:**
- [ ] File created (or constants defined inline)
- [ ] Used in species-modal.tsx
- [ ] Used in species-card.tsx
- [ ] Exported types used in interfaces

---

## 🗄️ DATABASE SCHEMA VERIFICATION

### 13. MySQL Schema Alignment

**✅ VERIFY WITH DATABASE QUERY:**

```sql
-- Check species table structure
DESCRIBE species;

-- Expected output should include:
-- status: enum('EX','CR','EN','VU','NT','LC')
-- region: enum('America','Europa','Africa','Asia','Oceania','Global')
-- category: enum('animal','planta','hongo')
```

**MANUAL VERIFICATION:**

```bash
# Connect to MySQL
mysql -u your_username -p your_database

# Check table structure
SHOW CREATE TABLE species;
```

**VERIFICATION CHECKLIST:**
- [ ] `status` column is ENUM with correct values
- [ ] `region` column is ENUM with correct values
- [ ] `category` column is ENUM with correct values
- [ ] Column types match TypeORM entity definitions
- [ ] If schema doesn't match, consider migration

**IF SCHEMA IS OUTDATED:**

```typescript
// Option 1: Drop and recreate (DEVELOPMENT ONLY)
// Set synchronize: true temporarily in data.source.ts

// Option 2: Create migration (RECOMMENDED)
import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSpeciesEnums1706630000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE species 
      MODIFY COLUMN status ENUM('EX','CR','EN','VU','NT','LC') NOT NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE species 
      MODIFY COLUMN region ENUM('America','Europa','Africa','Asia','Oceania','Global') NOT NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE species 
      MODIFY COLUMN category ENUM('animal','planta','hongo') NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes if needed
  }
}
```

---

## 🔴 REMAINING CRITICAL ISSUES

Based on the audit documents, here are issues that may NOT yet be resolved:

### 14. Token Expiration Validation (Frontend)

**STATUS:** ❓ LIKELY NOT IMPLEMENTED

**LOCATION:** `frontend/src/context/AuthContext.tsx`

**CHECK IF IMPLEMENTED:**

```typescript
// Look for this pattern:
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  exp: number;
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

useEffect(() => {
  const token = localStorage.getItem('token');
  // ... checks if token is expired
}, []);
```

**VERIFICATION CHECKLIST:**
- [ ] `jwt-decode` package is installed
- [ ] Token expiration is checked on app load
- [ ] Expired tokens are cleared from localStorage
- [ ] User is notified when session expires

**IF NOT IMPLEMENTED, ADD:**

```bash
cd frontend
npm install jwt-decode
```

---

### 15. Species Existence Validation in Favorites

**STATUS:** ❓ LIKELY NOT IMPLEMENTED

**LOCATION:** `backend/src/controllers/favorite.controller.ts`

**CHECK IF IMPLEMENTED:**

```typescript
static addFavorite = async (req: AuthRequest, res: Response) => {
  const { speciesId } = req.params;
  
  // ✅ LOOK FOR THESE VALIDATIONS:
  
  // 1. ID format validation
  const numericSpeciesId = parseInt(speciesId, 10);
  if (isNaN(numericSpeciesId)) {
    return res.status(400).json({ error: 'Invalid species ID format' });
  }

  // 2. Species existence check
  const species = await AppDataSource.getRepository(Species).findOneBy({ 
    id: numericSpeciesId 
  });
  
  if (!species) {
    return res.status(404).json({ error: 'Species not found' });
  }

  // 3. Duplicate check
  const existingFavorite = await favoriteRepo.findOne({
    where: {
      user: { id: userId },
      species: { id: numericSpeciesId }
    }
  });

  if (existingFavorite) {
    return res.status(409).json({ error: 'Already in favorites' });
  }
  
  // Continue with creation...
};
```

**VERIFICATION CHECKLIST:**
- [ ] Validates speciesId is numeric
- [ ] Checks species exists before adding favorite
- [ ] Prevents duplicate favorites
- [ ] Returns appropriate error codes (400, 404, 409)

---

### 16. Rate Limiting on Species Routes

**STATUS:** ❓ LIKELY NOT IMPLEMENTED

**LOCATION:** `backend/src/routes/species.routes.ts`

**CHECK IF IMPLEMENTED:**

```typescript
import rateLimit from 'express-rate-limit';

// ✅ LOOK FOR rate limiters:
const speciesCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many species creation requests'
});

const speciesUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many update requests'
});

router.post('/', authenticateToken, isAdmin, speciesCreationLimiter, validationMiddleware(CreateSpeciesDTO), SpeciesController.create);
router.put('/:id', authenticateToken, isAdmin, speciesUpdateLimiter, validationMiddleware(UpdateSpeciesDTO), SpeciesController.update);
```

**VERIFICATION CHECKLIST:**
- [ ] `express-rate-limit` package is installed
- [ ] Rate limiter applied to POST /species
- [ ] Rate limiter applied to PUT /species/:id
- [ ] Rate limiter applied to DELETE /species/:id

---

### 17. Global Error Handler Middleware

**STATUS:** ❓ LIKELY NOT IMPLEMENTED

**LOCATION:** `backend/src/index.ts` or `backend/src/app.ts`

**CHECK IF IMPLEMENTED:**

```typescript
// ✅ LOOK FOR this at the END of middleware chain:
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }

  return res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

**VERIFICATION CHECKLIST:**
- [ ] Global error middleware exists
- [ ] Positioned AFTER all routes
- [ ] Handles different error types
- [ ] Logs errors properly
- [ ] Doesn't expose sensitive info in production

---

### 18. Request Body Size Limit

**STATUS:** ❓ POSSIBLY NOT CONFIGURED

**LOCATION:** `backend/src/index.ts`

**CHECK IF IMPLEMENTED:**

```typescript
// ✅ LOOK FOR size limit configuration:
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

**VERIFICATION CHECKLIST:**
- [ ] `express.json()` has size limit
- [ ] `express.urlencoded()` has size limit
- [ ] Limit is reasonable (1mb - 10mb)

---

### 19. Database Indexes

**STATUS:** ❓ LIKELY NOT IMPLEMENTED

**LOCATION:** Entity files

**CHECK IF IMPLEMENTED:**

```typescript
// backend/src/entities/favorite.entity.ts
import { Entity, Index, ManyToOne, JoinColumn } from 'typeorm';

@Entity('favorites')
@Index(['user', 'species'], { unique: true })  // ✅ Composite index
export class Favorite {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  @Index()  // ✅ Individual index
  user!: User;

  @ManyToOne(() => Species)
  @JoinColumn({ name: 'speciesId' })
  @Index()  // ✅ Individual index
  species!: Species;
}
```

**VERIFICATION CHECKLIST:**
- [ ] Favorites table has index on userId
- [ ] Favorites table has index on speciesId
- [ ] Composite index on (userId, speciesId) for uniqueness
- [ ] Species table has index on status (if filtering frequently)

---

### 20. Favorites Pagination

**STATUS:** ❓ LIKELY NOT IMPLEMENTED

**LOCATION:** `backend/src/controllers/favorite.controller.ts`

**CHECK IF IMPLEMENTED:**

```typescript
static getFavorites = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  
  // ✅ LOOK FOR pagination parameters:
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const [favorites, total] = await favoriteRepo.findAndCount({
      where: { user: { id: userId } },
      relations: ['species'],
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC' }
    });

    return res.json({
      data: favorites,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    // ...
  }
};
```

**VERIFICATION CHECKLIST:**
- [ ] Accepts `page` query parameter
- [ ] Accepts `limit` query parameter
- [ ] Uses `findAndCount()` for total count
- [ ] Returns pagination metadata
- [ ] Frontend handles pagination

---

## 🧪 TESTING CHECKLIST

### Manual Testing Steps

**1. Backend Validation Testing:**

```bash
# Test with invalid data
curl -X POST http://localhost:3000/api/species \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T",
    "status": "INVALID",
    "region": "Antarctica"
  }'

# Expected: 400 with validation errors
```

**2. Status Enum Testing:**

```bash
# Test with old Spanish values (should fail)
curl -X POST http://localhost:3000/api/species \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Species",
    "scientificName": "Testus species",
    "status": "critico",
    "habitat": "Forest",
    "region": "America",
    "population": "1000",
    "imageUrl": "https://example.com/image.jpg",
    "category": "animal"
  }'

# Expected: 400 validation error for status

# Test with IUCN code (should succeed)
curl -X POST http://localhost:3000/api/species \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Species",
    "scientificName": "Testus species",
    "status": "CR",
    "habitat": "Forest",
    "region": "America",
    "population": "1000",
    "imageUrl": "https://example.com/image.jpg",
    "category": "animal"
  }'

# Expected: 201 success
```

**3. Frontend API URL Testing:**

```bash
# Build production
cd frontend
npm run build

# Check if API_URL is properly replaced
grep -r "localhost:3000" dist/

# Expected: Should only appear in source maps, not in main bundles
```

**4. Database Schema Testing:**

```sql
-- Verify enum constraints
INSERT INTO species (name, scientificName, status, habitat, region, population, imageUrl, category)
VALUES ('Test', 'Test species', 'INVALID', 'Forest', 'America', '1000', 'http://test.com', 'animal');

-- Expected: Error 1265 (Data truncated for column 'status')
```

---

## 📝 SUMMARY VERIFICATION FORM

### Critical Issues (Must be ✅)

- [ ] **Status values aligned**: Backend uses IUCN codes, frontend translates
- [ ] **DTO validation implemented**: CreateSpeciesDTO and UpdateSpeciesDTO exist
- [ ] **Validation middleware applied**: species.routes.ts uses validationMiddleware
- [ ] **API_URL uses environment variable**: No hardcoded localhost in production build
- [ ] **updateProfile URL fixed**: Uses centralized API_URL constant

### High Priority (Should be ✅)

- [ ] **Token expiration validation**: Frontend checks JWT exp claim
- [ ] **Species existence check**: Favorites controller validates species exists
- [ ] **Database indexes**: Created on frequently queried columns
- [ ] **Rate limiting on species**: Applied to POST, PUT, DELETE routes

### Medium Priority (Nice to have ✅)

- [ ] **Global error handler**: Catches unhandled errors
- [ ] **Request body size limit**: Configured on express.json()
- [ ] **Favorites pagination**: Implemented with limit/offset
- [ ] **Type safety**: No 'any' types in critical paths

### Code Quality

- [ ] **Error messages**: Specific, not generic "Error al crear"
- [ ] **Consistent responses**: Standard { message, data } or { error, details } format
- [ ] **Comments removed**: No TODO comments in production code
- [ ] **TypeScript strict**: No type errors when building

---

## 🎯 QUICK VERIFICATION COMMANDS

```bash
# Backend checks
cd backend
grep -r "TODO" src/                           # Should find no TODOs
grep -r '"critico"\|"peligro"\|"vulnerable"' src/  # Should find none
npm list class-validator class-transformer   # Should show installed

# Frontend checks
cd frontend
grep -r "localhost:3000" src/ --exclude="*.md"  # Should only be in fallback
grep -r '"critico"\|"peligro"\|"vulnerable"' src/  # Should find none
npm run build                                  # Should succeed without errors

# Database check
mysql -u user -p database -e "DESCRIBE species;"

# Full test
npm run dev   # Backend
npm run dev   # Frontend (separate terminal)
# Try creating species with invalid data - should get validation errors
# Try creating species with valid IUCN codes - should succeed
```

---

## 📊 COMPLETION SCORING

**Total Checks:** 100+

**Your Score:** _____ / 100

**Grade:**
- 90-100: ✅ Excellent - Ready for production
- 70-89: ⚠️ Good - Minor issues remain
- 50-69: 🔶 Fair - Several critical issues
- < 50: 🔴 Poor - Major refactoring needed

---

**End of Verification Checklist**

*Last Updated: January 30, 2026*
