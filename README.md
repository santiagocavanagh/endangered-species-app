# 🌿 EcoGuard — Endangered Species App

A full-stack web application for tracking, managing, and raising awareness about endangered species worldwide. Built with a modern TypeScript stack, JWT authentication, and data sourced from the IUCN Red List API.

---

## 🚀 Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express 5
- **Language:** TypeScript 5
- **ORM:** TypeORM 0.3 + MySQL 2
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Validation:** Zod v4
- **Security:** Helmet, CORS, express-rate-limit

### Frontend
- *(In progress)*

### Database
- MySQL 8

---

## 📁 Project Structure

```
endangered-species-app/
├── backend/
│   └── src/
│       ├── config/          # DB connection, env config
│       ├── constants/       # Conservation statuses, species constants
│       ├── controllers/     # Route handlers
│       ├── DTO/             # Data Transfer Objects
│       ├── entities/        # TypeORM entities
│       ├── errors/          # Custom error classes
│       ├── mappers/         # Entity → DTO mappers
│       ├── middleware/      # Auth, validation, rate limiting, error handling
│       ├── routes/          # Express routers
│       ├── schemas/         # Zod validation schemas
│       ├── services/        # Business logic
│       ├── types/           # TypeScript interfaces
│       └── utils/           # Helper utilities
└── frontend/
    └── *(in progress)*
```

---

## 🔐 Authentication

The API uses JWT Bearer token authentication with the following features:

- Token invalidation on password change via `passwordChangedAt`
- Role-based access control (`admin` / `user`)
- Timing-attack protection on login
- Differentiated rate limiting per endpoint

### Roles

| Role | Permissions |
|------|-------------|
| `user` | Read species, manage own favorites |
| `admin` | Full CRUD on species, regions, taxonomies |

---

## 🗂️ API Endpoints

Base URL: `http://localhost:3000/api`

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and receive JWT |
| PUT | `/auth/update-profile` | Authenticated | Update name or password |

### Species
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/species` | Public | List all species (paginated) |
| GET | `/species/critical` | Public | Species with CR/EN/VU status |
| GET | `/species/rescued` | Public | Species with NT/LC status |
| GET | `/species/:id` | Public | Get species by ID |
| POST | `/species` | Admin | Create new species |
| PATCH | `/species/:id` | Admin | Update species |
| DELETE | `/species/:id` | Admin | Delete species |

### Favorites
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/favorites` | Authenticated | Get user's favorite species |
| POST | `/favorites/:id` | Authenticated | Add species to favorites |
| DELETE | `/favorites/:id` | Authenticated | Remove species from favorites |

### Regions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/regions` | Public | List all regions |
| GET | `/regions/:id` | Public | Get region by ID |

### Taxonomies
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/taxonomies` | Public | List all taxonomies |
| GET | `/taxonomies/:id` | Public | Get taxonomy by ID |

---

## 🧬 IUCN Conservation Statuses

| Code | Status |
|------|--------|
| EX | Extinct |
| EW | Extinct in the Wild |
| CR | Critically Endangered |
| EN | Endangered |
| VU | Vulnerable |
| NT | Near Threatened |
| LC | Least Concern |
| DD | Data Deficient |
| NE | Not Evaluated |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8
- npm

### 1. Clone the repository

```bash
git clone https://github.com/santiagocavanagh/endangered-species-app.git
cd endangered-species-app
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env.development` file in the `backend/` directory:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=endangered_species

JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=12

IUCN_API_TOKEN=your_iucn_token
ADMIN_REGISTER_SECRET=your_admin_secret
```

### 4. Set up the database

Create the MySQL database and run your migration scripts to set up the schema.

### 5. Start the development server

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

---

## 📬 Example Requests

### Register a user

```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

### Register an admin

```json
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "securepassword",
  "name": "Admin",
  "role": "admin",
  "adminSecret": "your_admin_secret"
}
```

### Login

```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Create a species (Admin)

```json
POST /api/species
Authorization: Bearer <token>
{
  "scientificName": "Panthera tigris",
  "commonName": "Tiger",
  "iucnStatus": "EN",
  "taxonomyId": 1,
  "regionIds": [1, 2],
  "description": "The tiger is the largest living cat species.",
  "habitat": "Tropical forests, grasslands",
  "population": 3900,
  "censusDate": "2023-01-01"
}
```

---

## 🛡️ Security Features

- JWT tokens invalidated on password change
- bcrypt password hashing (configurable rounds)
- Helmet HTTP security headers
- CORS restricted to allowed origins
- Rate limiting: 100 req/15min general, 5 req/15min on login, 3 req/hour on register
- Zod schema validation on all inputs
- Admin registration protected by secret key
- `synchronize: false` in TypeORM — no automatic schema changes in production

---

## 📄 License

ISC

---

## 👤 Author

**Santiago Cavanagh**  
[github.com/santiagocavanagh](https://github.com/santiagocavanagh)
