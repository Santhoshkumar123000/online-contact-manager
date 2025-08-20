# Online Contact Manager (Node.js + MySQL)

A simple CRUD web app to manage contacts. Built with **Node.js, Express, MySQL** and **vanilla HTML/CSS/JS**.

## Features
- Add, list, search, edit, and delete contacts
- Pagination & search (by name/email/phone)
- Backend REST API (`/api/contacts`)
- Minimal, clean frontend

## Prerequisites
- Node.js 18+
- MySQL 8+ (or MariaDB)
- A terminal and a browser

## Setup
1. **Clone / unzip** the project.
2. Create DB and tables:
   ```sql
   SOURCE schema.sql;
   -- (optional) seed demo data
   SOURCE seed.sql;
   ```
3. Copy `.env`:
   ```bash
   cp .env.example .env
   # then edit DB_USER / DB_PASSWORD if needed
   ```
4. Install dependencies & run:
   ```bash
   npm install
   npm run dev   # or: npm start
   ```
5. Open the app:
   - Frontend: http://localhost:3000
   - API health: http://localhost:3000/api/health

## API
- `GET /api/contacts?search=&page=&limit=`
- `GET /api/contacts/:id`
- `POST /api/contacts`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id`

### Example `POST /api/contacts` body
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91-9000000000",
  "company": "Widgets Inc",
  "notes": "Met at conference"
}
```

## Project Structure
```
online-contact-manager/
├─ public/
│  ├─ index.html
│  ├─ style.css
│  └─ app.js
├─ src/
│  └─ db.js
├─ .env.example
├─ schema.sql
├─ seed.sql
├─ package.json
├─ server.js
└─ README.md
```

## Notes
- The server auto-creates the `contacts` table on startup if it doesn't exist.
- If you change the database name in `.env`, update `schema.sql` too.
- For production, consider adding auth, input validation library, and rate limiting.
