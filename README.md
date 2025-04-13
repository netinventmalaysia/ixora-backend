
# 🏗️ MBMB Basic Template

  

A fully featured **NestJS boilerplate** with Docker support, JWT authentication, role-based access control, MySQL (TypeORM), and built-in Swagger documentation. Designed to help you build backend APIs efficiently and securely.

  

---

  

## 🚀 Tech Stack

  

-  **NestJS** – Modular Node.js backend framework

-  **TypeORM** – ORM for MySQL database

-  **MySQL 8** – Relational database

-  **Docker Compose** – Local containerized environment

-  **JWT** – Authentication & Authorization

-  **Swagger** – API documentation

-  **date-fns** – Date utilities

-  **class-validator** – Input validation

  

---

  

## 📦 Features

  

- ✅ JWT Authentication

- ✅ Role-Based Access Control (RBAC)

- ✅ Structured API Responses via Interceptor

- ✅ Global Exception Filter

- ✅ MySQL DB with TypeORM

- ✅ Migration Support (`typeorm`)

- ✅ Swagger UI (`/api`)

- ✅ Dockerized for Development

  

---

  

## 🛠️ Getting Started

  

### 🔨 Development (with Docker)

  

```bash

# clone the repo

git  clone  https://github.com/netinventmalaysia/mbmb-basic-template.git

cd  mbmb-basic-template

  

# copy environment variables

cp  .env.example  .env

  

# start dev environment

docker-compose  up  --build

```

  

Then open: [http://localhost:3000/api](http://localhost:3000/api) for Swagger UI.

  

---

  

### 💾 Local Development (without Docker)

  

Make sure MySQL is running locally and update `.env`.

  

```bash

npm  install

npm  run  start:dev

```

  

---

  

## 🧪 Database Migrations

  

Generate a migration:

  

```bash

npm  run  migration:generate  --  src/migrations/Init

```

  

Run the migration:

  

```bash

npm  run  migration:run

```

  

Revert the last migration:

  

```bash

npm  run  migration:revert

```

  

---

  

## 🔐 Authentication

  

-  `POST /auth/login`

Requires:

```json

{

"username": "admin",

"password": "pass"

}

```

  

Returns a JWT token:

  

```json

{

"access_token": "xxx.yyy.zzz"

}

```

  

Use in headers for protected routes:

  

```

Authorization: Bearer <token>

```

  

---

  

## 📁 Folder Structure

  

```

src/

├── auth/ # Auth logic, JWT strategy

├── users/ # User entity, service

├── common/ # Filters, guards, decorators, utils

├── migrations/ # TypeORM migrations

├── app.module.ts # Root module

├── main.ts # App entry point

```

  

---

  

## 🤝 Contribution

  

Feel free to fork this repo and contribute by submitting a pull request. Issues and ideas are welcome.

  

---

  

## 🧠 Author & Maintainer

  

Developed by [Net Invent Malaysia](https://github.com/netinventmalaysia)
With collaboration of Majlis Bandaraya Melaka Bersejarah (MBMB)

  

  

---

  

