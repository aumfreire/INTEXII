# INTEXII

Full-stack web application — .NET 10 Web API backend + React TypeScript frontend.

---

## Prerequisites

Make sure these are installed on your machine before starting:

| Tool                                              | Version |
| ------------------------------------------------- | ------- |
| [.NET SDK](https://dotnet.microsoft.com/download) | 10      |
| [Node.js](https://nodejs.org)                     | 18+     |

---

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd INTEXII
```

### 2. Run the backend

```bash
cd backend/INTEXII.API
dotnet run
```

To auto-reload on file changes:

```bash
dotnet watch run
```

### 3. Run the frontend

Open a new terminal tab from the root of the project:

```bash
cd frontend
npm install
npm run dev
```

---

## Google OAuth Setup (Local)

The backend reads Google OAuth credentials from .NET user-secrets in local development.

```bash
cd backend/INTEXII.API
dotnet user-secrets set "Authentication:Google:ClientId" "<your-client-id>"
dotnet user-secrets set "Authentication:Google:ClientSecret" "<your-client-secret>"
```

If these values are not configured, Google sign-in is simply not registered by the API.

---

## Azure Configuration Mapping

When deployed to Azure App Service, set the same keys as environment variables using double-underscore notation:

- `Authentication__Google__ClientId`
- `Authentication__Google__ClientSecret`

You can use the same mapping pattern for other nested ASP.NET configuration keys.

---

## URLs

| Service         | URL                            |
| --------------- | ------------------------------ |
| Frontend        | http://localhost:3000          |
| Backend (HTTPS) | https://localhost:5000         |
| Swagger UI      | https://localhost:5000/swagger |
