# Railway Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Spring Boot backend and PostgreSQL database to Railway so the API is reachable from any network, then point the web frontend at the Railway URL.

**Architecture:** Update `application.properties` to read database credentials from Railway's environment variables; open CORS to all origins; push backend to GitHub so Railway can deploy it; update `api.ts` in the web frontend to the Railway URL.

**Tech Stack:** Spring Boot 3.3.0, Railway (PaaS), PostgreSQL (Railway managed add-on)

---

## Files

| Action | File |
|---|---|
| Modify | `work-life-balance-backend/src/main/resources/application.properties` |
| Modify | `work-life-balance-backend/src/main/java/com/worklifebalance/config/CorsConfig.java` |
| Modify | `work-life-balance-frontend/src/services/api.ts` |

---

### Task 1: Update application.properties for Railway

Railway injects `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, and `PORT` as environment variables. Spring Boot's `${}` syntax reads them with a fallback for local development.

**Files:**
- Modify: `src/main/resources/application.properties`

- [ ] **Step 1: Replace the datasource and port config**

Open `src/main/resources/application.properties` and replace the full file contents with:

```properties
spring.datasource.url=jdbc:postgresql://${PGHOST:localhost}:${PGPORT:5432}/${PGDATABASE:worklifebalance}
spring.datasource.username=${PGUSER:wlb}
spring.datasource.password=${PGPASSWORD:wlb}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
server.port=${PORT:8080}
server.error.include-message=always
```

- [ ] **Step 2: Verify local dev still starts**

Run the Spring Boot app locally and confirm it starts on port 8080 (Railway env vars are absent locally so the fallback values are used):

```bash
cd work-life-balance-backend
./mvnw spring-boot:run
```

Expected: `Started WorkLifeBalanceApplication ... on port 8080`

Stop the app (Ctrl+C).

---

### Task 2: Open CORS to all origins

Currently `CorsConfig.java` only allows `http://localhost:5173`. Once the backend is on Railway the web app and mobile app need to reach it from any origin.

**Files:**
- Modify: `src/main/java/com/worklifebalance/config/CorsConfig.java`

- [ ] **Step 1: Update allowedOrigins to wildcard**

Replace the contents of `CorsConfig.java` with:

```java
package com.worklifebalance.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

- [ ] **Step 2: Verify the app still compiles**

```bash
cd work-life-balance-backend
./mvnw compile
```

Expected: `BUILD SUCCESS`

---

### Task 3: Commit and push backend

- [ ] **Step 1: Commit both changes**

```bash
cd work-life-balance-backend
git add src/main/resources/application.properties src/main/java/com/worklifebalance/config/CorsConfig.java
git commit -m "feat: configure Railway deployment (env vars, open CORS)"
git push
```

Expected: Push succeeds to `https://github.com/AstridOttmann/work-life-balance-backend`.

---

### Task 4: Create Railway project and deploy (manual steps)

These steps are done in the Railway web dashboard at https://railway.app.

- [ ] **Step 1: Sign up / log in to Railway**

Go to https://railway.app and sign in with GitHub.

- [ ] **Step 2: Create a new project**

Click **New Project → Deploy from GitHub repo → work-life-balance-backend**.

Railway auto-detects it's a Maven project and starts the first build. Wait for it to complete (green checkmark).

- [ ] **Step 3: Add PostgreSQL**

In the project view, click **+ Add Service → Database → PostgreSQL**.

Railway creates a PostgreSQL instance and injects `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` automatically into the backend service — no extra config needed.

- [ ] **Step 4: Get the public URL**

Click on the backend service → **Settings → Networking → Generate Domain**.

Railway assigns a URL like `https://work-life-balance-backend-production-xxxx.up.railway.app`.

Copy this URL — it is needed in Task 5.

- [ ] **Step 5: Verify the backend is live**

Open a browser and navigate to:
```
https://<your-railway-url>/api/entries
```

Expected: `[]` (empty JSON array — database is empty but the API responds).

---

### Task 5: Update web frontend API URL

**Files:**
- Modify: `work-life-balance-frontend/src/services/api.ts`

- [ ] **Step 1: Replace the hardcoded localhost URL**

Open `src/services/api.ts` and change line 4:

```ts
// Before
export const api = axios.create({ baseURL: 'http://localhost:8080/api' });

// After
export const api = axios.create({ baseURL: 'https://<your-railway-url>/api' });
```

Replace `<your-railway-url>` with the actual Railway URL from Task 4 Step 4.

- [ ] **Step 2: Verify the web app works against Railway**

Start the web frontend:
```bash
cd work-life-balance-frontend
npm run dev
```

Open http://localhost:5173, create a daily entry and confirm it appears. Check the browser Network tab — requests should go to the Railway URL, not localhost:8080.

---

### Task 6: Commit and push web frontend

- [ ] **Step 1: Commit the URL change**

```bash
cd work-life-balance-frontend
git add src/services/api.ts
git commit -m "feat: point frontend API at Railway backend"
git push
```

Expected: Push succeeds to `https://github.com/AstridOttmann/work-life-balance-frontend`.
