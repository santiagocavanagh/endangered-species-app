# 🔍 ANÁLISIS DE ERRORES LÓGICOS Y VULNERABILIDADES - ENDANGERED SPECIES APP

## Documento de Auditoría de Código

**Fecha de Revisión:** 21 de Enero, 2026

---

## ⚠️ CRÍTICOS (ALTA PRIORIDAD)

### 1. **Contraseña Predeterminada en JWT_SECRET** ❌

**Ubicación:** [backend/src/middleware/auth.middleware.ts](backend/src/middleware/auth.middleware.ts#L3)

```typescript
const JWT_SECRET = process.env.JWT_SECRET || "clave";
```

**Problema:** Si `JWT_SECRET` no está configurado en variables de entorno, usa `"clave"` como fallback.
**Riesgo de Seguridad:** 🔴 CRÍTICO - Cualquiera puede descifrar tokens si se usa el default.
**Solución:** Lanzar error si no está configurado en variables de entorno.

```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET debe estar configurado en variables de entorno");
}
```

---

### 2. **Contraseña Débil Predeterminada en auth.routes.ts** ❌

**Ubicación:** [backend/src/routes/auth.routes.ts](backend/src/routes/auth.routes.ts#L10)

```typescript
const JWT_SECRET = process.env.JWT_SECRET as string;
```

**Problema:** Sin verificación de existencia y duplica la configuración.
**Riesgo:** 🔴 CRÍTICO - Token no valida si JWT_SECRET no existe.
**Solución:** Usar centralizado desde env.config.ts y validar.

---

### 3. **Synchronize=true en Producción** ❌

**Ubicación:** [backend/src/config/data.source.ts](backend/src/config/data.source.ts#L15)

```typescript
synchronize: true,
```

**Problema:** TypeORM sincroniza automáticamente la BD en cada inicio.
**Riesgo:** 🔴 CRÍTICO - Puede borrar/modificar esquemas en producción sin control.
**Solución:**

```typescript
synchronize: process.env.NODE_ENV !== "production",
```

---

### 4. **Logging Habilitado en Producción** ❌

**Ubicación:** [backend/src/config/data.source.ts](backend/src/config/data.source.ts#L16)

```typescript
logging: true,
```

**Problema:** Registra todas las queries en producción.
**Riesgo:** 🔴 CRÍTICO - Impacto en rendimiento, expone queries sensibles en logs.
**Solución:**

```typescript
logging: process.env.NODE_ENV !== "production",
```

---

### 5. **CORS Sin Restricción (Permite Cualquier Origen)** ❌

**Ubicación:** [backend/src/index.ts](backend/src/index.ts#L13)

```typescript
app.use(cors());
```

**Problema:** Sin configurar origen permitido.
**Riesgo:** 🔴 CRÍTICO - Abre el API a ataques CSRF desde cualquier dominio.
**Solución:**

```typescript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

---

### 6. **Inyección SQL Potencial en Region Filters** ⚠️

**Ubicación:** [frontend/src/App.tsx](frontend/src/App.tsx#L84-L90)

```typescript
const speciesRegion = species.region
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");
const filterRegion = filters.region
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");
if (!speciesRegion.includes(filterRegion)) return false;
```

**Problema:** Aunque es frontend, usa `.includes()` sin validación de entrada.
**Riesgo:** 🔴 MEDIO - Aunque es frontend, debería validarse en backend.
**Solución:** Usar enum validado en backend, no strings libres.

---

## 🔴 ALTOS (ALTA PRIORIDAD)

### 7. **Token JWT sin Expiración Validada en Frontend** ❌

**Ubicación:** [frontend/src/context/AuthContext.tsx](frontend/src/context/AuthContext.tsx)

```typescript
const token = localStorage.getItem("token");
// ... sin verificar expiración
if (token && role && email) {
  setUser({ email, role: role as "admin" | "user", name: name || undefined });
}
```

**Problema:** Carga token del localStorage sin validar si expiró.
**Riesgo:** 🟠 ALTO - Token expirado podría continuar siendo usado en requests.
**Solución:** Decodificar y validar expiración:

```typescript
import { jwtDecode } from "jwt-decode";

const token = localStorage.getItem("token");
if (token) {
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.clear();
    }
  } catch (error) {
    localStorage.clear();
  }
}
```

---

### 8. **Manejo de Errores Genérico en Favoritos** ⚠️

**Ubicación:** [backend/src/controllers/favorite.controller.ts](backend/src/controllers/favorite.controller.ts#L49-L51)

```typescript
} catch (error) {
  res.status(500).json({ error: "Error al obtener favoritos" });
}
```

**Problema:** No registra el error real, solo respuesta genérica.
**Riesgo:** 🟠 ALTO - Imposible debuguear problemas reales.
**Solución:**

```typescript
catch (error) {
  console.error("Error en getFavorites:", error);
  res.status(500).json({ error: "Error al obtener favoritos" });
}
```

---

### 9. **No hay Validación de entrada en Create/Update Species** ⚠️

**Ubicación:** [backend/src/controllers/species.controller.ts](backend/src/controllers/species.controller.ts#L40-L47)

```typescript
static create = async (req: Request, res: Response) => {
  try {
    const speciesRepo = AppDataSource.getRepository(Species);
    const newSpecies = speciesRepo.create(req.body); // ❌ SIN VALIDAR
    const result = await speciesRepo.save(newSpecies);
```

**Problema:** Acepta cualquier body sin validación.
**Riesgo:** 🟠 ALTO - Inyección de datos maliciosos, campos inesperados.
**Solución:** Usar validadores (class-validator):

```typescript
import { validate } from 'class-validator';

static create = async (req: Request, res: Response) => {
  const speciesDTO = plainToClass(SpeciesDTO, req.body);
  const errors = await validate(speciesDTO);
  if (errors.length > 0) return res.status(400).json({ errors });
```

---

### 10. **Falta de Rate Limiting en Endpoints** ⚠️

**Ubicación:** [backend/src/routes/](backend/src/routes/)
**Problema:** Ningún endpoint tiene protección contra fuerza bruta.
**Riesgo:** 🟠 ALTO - Login vulnerable a ataques de diccionario.
**Solución:** Agregar express-rate-limit en rutas de auth:

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Demasiados intentos de login, intenta en 15 minutos"
});

router.post("/login", loginLimiter, async (req, res) => { ... });
```

---

### 11. **Password no es Required en Update Profile** ⚠️

**Ubicación:** [backend/src/routes/auth.routes.ts](backend/src/routes/auth.routes.ts#L52)

```typescript
if (password) {
  user.password = await bcrypt.hash(password, 10);
}
```

**Problema:** Permite actualización sin contraseña, pero no distingue entre "no enviar" vs "enviar vacío".
**Riesgo:** 🟠 MEDIO - Validación confusa.
**Solución:** Validar explícitamente si se proporciona y no está vacío:

```typescript
if (password && password.trim().length >= 8) {
  user.password = await bcrypt.hash(password, 10);
} else if (password !== undefined) {
  return res
    .status(400)
    .json({ error: "Contraseña debe tener min 8 caracteres" });
}
```

---

### 12. **Middleware isAdmin no Valida Existencia de req.user** ⚠️

**Ubicación:** [backend/src/middleware/auth.middleware.ts](backend/src/middleware/auth.middleware.ts#L24-L32)

```typescript
export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado..." });
  }
};
```

**Problema:** Si `authenticateToken` no se ejecuta antes, `req.user` es undefined.
**Riesgo:** 🟠 MEDIO - Cadena de middlewares frágil.
**Solución:** Validar explícitamente:

```typescript
if (!req.user) {
  return res.status(401).json({ error: "No autenticado" });
}
if (req.user.role !== "admin") {
  return res.status(403).json({ error: "No autorizado" });
}
next();
```

---

## 🟠 MEDIANOS (PRIORIDAD MEDIA)

### 13. **LocalStorage almacena Datos Sensibles sin Protección** ⚠️

**Ubicación:** [frontend/src/context/AuthContext.tsx](frontend/src/context/AuthContext.tsx#L28-L34)

```typescript
localStorage.setItem("token", token);
localStorage.setItem("userRole", role);
localStorage.setItem("userEmail", email);
```

**Problema:** LocalStorage es vulnerable a XSS.
**Riesgo:** 🟡 MEDIO - Token visible en dev tools, vulnerable a scripts maliciosos.
**Solución:** Usar HttpOnly cookies (requiere cambio en backend):

```typescript
// Backend: Devolver token en cookie
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
});

// Frontend: Usar interceptor axios/fetch automáticamente
```

---

### 14. **Status Values Inconsistentes** ❌

**Ubicación:** Comparar:

- Backend [species.entity.ts](backend/src/entities/species.entity.ts#L17-L21): `"CR" | "EN" | "VU" | "NT" | "LC" | "EX"`
- Frontend [species-card.tsx](frontend/src/app/components/species-card.tsx#L15): `"critico" | "peligro" | "vulnerable"`
- Frontend [species-modal.tsx](frontend/src/app/components/species-modal.tsx#L150): `"vulnerable" | "peligro" | "critico"`

**Problema:** 🔴 Mismatch total entre backend y frontend.
**Riesgo:** 🟡 MEDIO - Datos no se sincronizan correctamente.
**Solución:** Alinear enums en ambos lados:

```typescript
// Backend
status: "CR" | "EN" | "VU" | "NT" | "LC" | "EX";

// Frontend
status: "CR" | "EN" | "VU" | "NT" | "LC" | "EX"; // Mismo que backend
```

---

### 15. **No Hay Validación de URL de Imágenes** ⚠️

**Ubicación:** [frontend/src/app/components/species-card.tsx](frontend/src/app/components/species-card.tsx#L48-L53)

```typescript
<img
  src={species.imageUrl}
  alt={species.name}
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
/>
```

**Problema:** Sin fallback si URL es inválida, sin validación de protocolo.
**Riesgo:** 🟡 MEDIO - Puede cargar imágenes de dominios no autorizados.
**Solución:** Validar URL y usar componente de fallback:

```tsx
import { ImageWithFallback } from "../figma/ImageWithFallback";

<ImageWithFallback
  src={species.imageUrl}
  alt={species.name}
  fallback="/placeholder.png"
/>;
```

**Nota:** Ya existe componente `ImageWithFallback.tsx` pero no se usa.

---

### 16. **Falta de Protección XSS en Nombres Dinámicos** ⚠️

**Ubicación:** [frontend/src/app/components/species-modal.tsx](frontend/src/app/components/species-modal.tsx#L103)

```tsx
<p className="text-sm text-gray-500 capitalize">{formData.category}</p>
```

**Problema:** Aunque React escapa HTML, los datos deberían venir validados del backend.
**Riesgo:** 🟡 BAJO-MEDIO - Riesgo mínimo en React pero mala práctica.
**Solución:** Validar enums en backend y frontend.

---

### 17. **No hay Confirmación en Eliminación de Favoritos** ⚠️

**Ubicación:** [frontend/src/App.tsx](frontend/src/App.tsx#L60-L71)

```typescript
const toggleFavorite = async (id: number) => {
  if (favorites.has(id)) {
    const res = await api.removeFavorite(id);  // ❌ Sin confirmación
```

**Problema:** Elimina favorito sin confirmación al hacer click.
**Riesgo:** 🟡 BAJO - UX pobre, sin impacto crítico.
**Solución:** Agregar confirmación:

```typescript
if (favorites.has(id)) {
  if (!window.confirm("¿Remover de favoritos?")) return;
  const res = await api.removeFavorite(id);
```

---

### 18. **API_URL Hardcodeado en Frontend** ⚠️

**Ubicación:** [frontend/src/services/api.ts](frontend/src/services/api.ts#L1)

```typescript
const API_URL = "http://localhost:3000/api";
```

**Problema:** Hardcodeado para desarrollo, no cambia en producción.
**Riesgo:** 🟡 MEDIO - App apunta a localhost en producción.
**Solución:** Usar variable de entorno:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
```

Crear `.env.local`:

```
VITE_API_URL=http://localhost:3000/api
```

---

### 19. **Web Scraper No Implementado** ⚠️

**Ubicación:** [backend/src/seeds/web-scrapper.ts](backend/src/seeds/web-scrapper.ts)

```typescript
export const obtenerDatosIUCN = async () => {
  // ... código incompleto
  console.log(data); // ❌ Solo imprime, no guarda datos
};
```

**Problema:** Función no inserta datos en BD, no se llama desde index.ts.
**Riesgo:** 🟡 BAJO - Funcionalidad incompleta.
**Solución:** Completar e integrar con seeder.

---

## 🟡 BAJOS (BAJA PRIORIDAD)

### 20. **Falta de Logging Estructurado** ℹ️

**Ubicación:** Todo el proyecto usa `console.log/error`.
**Problema:** Sin logger centralizado.
**Riesgo:** 🟢 BAJO - Impacta debugging y monitoring.
**Solución:** Usar winston o pino:

```typescript
import winston from 'winston';
const logger = winston.createLogger({...});
logger.info('Conexión exitosa');
```

---

### 21. **Tipos "any" en Múltiples Lugares** ⚠️

**Ubicación:**

- [backend/src/middleware/auth.middleware.ts](backend/src/middleware/auth.middleware.ts#L5): `req: any`
- [backend/src/controllers/favorite.controller.ts](backend/src/controllers/favorite.controller.ts#L8): `req: any`

**Problema:** Usa `any` en lugar de tipos específicos.
**Riesgo:** 🟢 BAJO - Pierde type-safety de TypeScript.
**Solución:** Crear interfaz extendida:

```typescript
interface AuthRequest extends Request {
  user: { id: number; role: string };
}
```

---

### 22. **Archivo JSON Diccionario no Documentado** ℹ️

**Ubicación:** [diccionario_especies.json](diccionario_especies.json)
**Problema:** Archivo en raíz sin uso aparente.
**Riesgo:** 🟢 BAJO - Confusión sobre propósito.
**Sugerencia:** Documentar o eliminar si no se usa.

---

### 23. **Falta Validación de Entrada en register** ⚠️

**Ubicación:** [backend/src/routes/auth.routes.ts](backend/src/routes/auth.routes.ts#L13)

```typescript
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;  // ❌ Sin validar
```

**Problema:** Sin validar formato de email, longitud de password, role enum.
**Riesgo:** 🟡 BAJO - Registros con datos inválidos.
**Solución:**

```typescript
if (!email.includes("@") || password.length < 8) {
  return res.status(400).json({ error: "Datos inválidos" });
}
if (role && !["admin", "user"].includes(role)) {
  return res.status(400).json({ error: "Role inválido" });
}
```

---

### 24. **Componente Figma No Reutilizado** ℹ️

**Ubicación:** [frontend/src/app/components/figma/ImageWithFallback.tsx](frontend/src/app/components/figma/ImageWithFallback.tsx)
**Problema:** Existe pero no se importa en species-card.tsx.
**Riesgo:** 🟢 BAJO - Código muerto.
**Solución:** Usar en especies-card para manejar imágenes fallidas.

---

### 25. **Import de componentes ui sin Chequearse** ⚠️

**Ubicación:** [frontend/src/app/components/species-card.tsx](frontend/src/app/components/species-card.tsx#L1)

```tsx
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
```

**Problema:** No se verifica si los componentes ui están correctamente exportados.
**Riesgo:** 🟢 BAJO - Errores en build time.
**Solución:** Verificar que ui/index.ts exporte correctamente.

---

## 📋 RESUMEN EJECUTIVO

### Vulnerabilidades Críticas (Deben corregirse INMEDIATAMENTE):

1. ✅ JWT_SECRET fallback débil
2. ✅ CORS sin restricción
3. ✅ Synchronize=true en BD
4. ✅ Logging habilitado en producción

### Vulnerabilidades Altas (Deben corregirse antes de producción):

1. ⚠️ Status values inconsistentes entre backend/frontend
2. ⚠️ Sin validación de entrada en Create/Update
3. ⚠️ Sin rate limiting en login
4. ⚠️ Token expirado no se valida en frontend
5. ⚠️ LocalStorage expone token a XSS

### Mejoras Recomendadas:

- [ ] Implementar logger estructurado (winston/pino)
- [ ] Agregar pruebas unitarias
- [ ] Documentar API (Swagger/OpenAPI)
- [ ] Implementar middleware de validación global
- [ ] Crear archivo .env.example
- [ ] Agregar autenticación 2FA

---

**Prioridad de Corrección:**

```
🔴 Críticas: INMEDIATO (hoy)
🟠 Altas: ANTES DE PRODUCCIÓN (esta semana)
🟡 Medianas: PRÓXIMAS VERSIONES (próximo sprint)
🟢 Bajas: MEJORAS FUTURAS (backlog)
```

---

_Revisión completada el 21 de Enero, 2026_
