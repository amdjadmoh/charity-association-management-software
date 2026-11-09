# Charity association management software

Backend for a charity association. It tracks donors and donations, manages stock, and decides how food, products and medical equipment are allocated to the patients it supports. Built as a team project.

## Stack

- Node.js, Express 5
- PostgreSQL with Drizzle ORM and migrations
- Multer for patient file uploads
- Pre-built frontend served from `src/dist`

## Features

- **Donors and donations:** donors, donations and receipts, plus money tracking for financial transactions
- **Stock:** products, stock levels and product movement history
- **Distribution:** "sacks" (aid packages) assigned to patients, and distributors and partners
- **Medical equipment:** material types, material donations and loans to patients
- **Patients:** patient records, diseases, cities and attached patient files
- **Supply requests:** requests for products and materials
- **Users:** user accounts

The data model has 24 tables, defined in [`src/db/schema.js`](src/db/schema.js).

## Run locally

```bash
npm install
# create .env with DB_CONNECTION_STRING and PORT
npx drizzle-kit migrate
npm run dev
```
