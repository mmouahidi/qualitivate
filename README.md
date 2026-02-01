# Qualitivate.io

Multi-tenant survey management platform enabling companies to conduct NPS and custom surveys across their organizational hierarchy (Company → Sites → Departments → Users).

## Features

- **Multi-tenant Architecture**: Manage multiple companies, sites, departments, and users
- **Survey Types**: NPS (Net Promoter Score) and Custom surveys
- **Multi-language Support**: Create surveys in multiple languages
- **Role-based Access Control**: Super Admin, Company Admin, Site Admin, Department Admin, User
- **Survey Distribution**: Email, shareable links, QR codes, and embeddable widgets
- **Analytics & Reporting**: Response tracking, NPS calculation, trend analysis, and exports
- **Anonymous Responses**: Support for anonymous survey submissions

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL with Knex.js
- JWT Authentication
- Nodemailer for emails
- QR code generation
- Excel/PDF exports

### Frontend
- React 19 + TypeScript
- Vite build tool
- Tailwind CSS for styling
- React Router for navigation
- TanStack Query for data fetching
- React Hook Form + Zod for form validation
- Recharts for analytics
- DnD Kit for drag-and-drop
- i18next for internationalization

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Qualitivate.io
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for both client and server using npm workspaces.

### 3. Set up PostgreSQL database

Create a PostgreSQL database:

```bash
createdb qualitivate
```

Or using psql:

```sql
CREATE DATABASE qualitivate;
```

### 4. Configure environment variables

#### Server Configuration

Copy the example env file:

```bash
cp server/env.example server/.env
```

Edit `server/.env` with your configuration:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=qualitivate
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

JWT_SECRET=your-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@qualitivate.io

FRONTEND_URL=http://localhost:5173
```

#### Client Configuration

Copy the example env file:

```bash
cp client/env.example client/.env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Run database migrations

```bash
cd server
npm run migrate
```

### 6. Start the development servers

From the root directory:

```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 5173) concurrently.

Or start them separately:

```bash
npm run dev:server
npm run dev:client
```

### 7. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## Project Structure

```
Qualitivate.io/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components (Login, Dashboard, etc.)
│   │   ├── contexts/            # React contexts (AuthContext, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service layer
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── server/                      # Node.js Backend
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── models/              # Database models
│   │   ├── routes/              # API routes
│   │   ├── middlewares/         # Express middlewares
│   │   ├── services/            # Business logic services
│   │   ├── utils/               # Utility functions
│   │   └── config/              # Configuration files
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── migrations/              # Database migration files
└── package.json                 # Root package.json with workspaces
```

## Database Schema

The application uses the following main tables:

- **companies**: Organization/company records
- **sites**: Physical locations within companies
- **departments**: Departments within sites
- **users**: User accounts with role-based access
- **surveys**: Survey definitions (NPS/Custom)
- **questions**: Questions within surveys
- **question_translations**: Multi-language question content
- **survey_translations**: Multi-language survey metadata
- **survey_distributions**: Distribution channels (email, link, QR, embed)
- **responses**: Survey response records
- **answers**: Individual question answers
- **refresh_tokens**: JWT refresh tokens

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/companies/:id` - Get company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Sites
- `GET /api/sites` - List sites
- `POST /api/sites` - Create site
- `GET /api/sites/:id` - Get site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

### Departments
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `GET /api/departments/:id` - Get department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Surveys
- `GET /api/surveys` - List surveys
- `POST /api/surveys` - Create survey
- `GET /api/surveys/:id` - Get survey
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey

### Responses & Analytics
- `GET /api/responses` - List responses
- `POST /api/responses` - Submit response
- `GET /api/analytics` - Get analytics data

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **super_admin** | Platform administrator | Full access to all companies and features |
| **company_admin** | Company administrator | Manage own company, sites, departments, users, and surveys |
| **site_admin** | Site administrator | Manage own site, departments, users, and surveys |
| **department_admin** | Department administrator | Manage own department, users, and surveys |
| **user** | Regular user | Respond to surveys and view assigned analytics |

## Development

### Running migrations

Create a new migration:

```bash
cd server
npm run migrate:make migration_name
```

Run migrations:

```bash
npm run migrate
```

Rollback last migration:

```bash
npm run migrate:rollback
```

### Building for production

Build both client and server:

```bash
npm run build
```

Or build separately:

```bash
npm run build:server
npm run build:client
```

### Starting production server

```bash
cd server
npm start
```

The production client build should be served by a web server like Nginx.

## Troubleshooting

### Database connection issues

1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Check database credentials in `server/.env`

3. Ensure the database exists:
   ```bash
   psql -l | grep qualitivate
   ```

### Port already in use

If port 5000 or 5173 is already in use, update the port in:
- Backend: `server/.env` (PORT variable)
- Frontend: `client/vite.config.ts`

### JWT token errors

Regenerate JWT secrets in `server/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Security Features

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **Password requirements**: Minimum 8 characters
- **Role-based access control** (RBAC) with 5 user roles
- **Token rotation**: Limited to 5 active refresh tokens per user
- **Secure registration**: Public registration creates regular users only; admin roles require privileged invitation
- **Input validation**: All endpoints validate input using Joi schemas
- **Token expiry synchronization**: Database token expiry matches JWT configuration

### Multi-tenancy Security
- **Strict data isolation**: All queries scoped by company/site/department
- **Access control middleware**: Validates user permissions against organizational hierarchy
- **No privilege escalation**: Users cannot self-assign admin roles or access other organizations

### Best Practices
- **Passwords**: Hashed with bcrypt (10 rounds)
- **Secrets management**: All secrets stored in environment variables
- **Error handling**: Generic error messages to prevent information disclosure
- **CORS**: Configured for specific frontend origin
- **SQL injection protection**: Using parameterized queries via Knex

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For issues and questions, please create an issue in the GitHub repository.
