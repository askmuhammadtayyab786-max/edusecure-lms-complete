# EduSecure LMS — Security Workflow

This document tracks the DevSecOps security workflow applied to
EduSecure LMS, from threat modeling through containerization.

---

## Workflow Overview

```
Threat Dragon → SonarLint (SonarQube for IDE) → Snyk → GitLeaks
→ HashiCorp Vault → Trivy → Containerization (Docker)
```

Each stage catches a different class of issue, at the earliest and
cheapest point possible ("shift-left security").

---

## 1. Threat Dragon — Threat Modeling ✅ Done

**What it does:** Models the application's data flow (STRIDE method) to
identify design-level risks before any code is written.

**Applied to:** EduSecure LMS login/course/quiz flow — Student,
Instructor, Admin actors; Next.js frontend and Node.js/Express API
processes; MySQL database and file storage data stores; three trust
boundaries (Internet, Application, Internal/Database).

**Output:** STRIDE threats identified per element (Spoofing, Tampering,
Repudiation, Information Disclosure, Denial of Service, Elevation of
Privilege), each with a documented mitigation — see
`EduSecure-DevSecOps-Implementation-Report.docx` for the full list.

---

## 2. SonarQube for IDE (formerly SonarLint) ✅ Done

**What it does:** Live analysis of our own source code inside the
editor — bugs, code smells, and security hotspots.

**Setup used:**
- Java 17 (`openjdk-17-jdk`) — required by the analysis engine
- Node.js 20.12+ (via `nvm`) — required for JS/TS analysis
- VS Code extension: `SonarQube for IDE` by SonarSource

**Status:** Actively analyzing the backend codebase; no outstanding
issues found in `authController.js` during review.

---

## 3. Snyk — Dependency Scanning ✅ Done

**What it does:** Scans `package.json` dependencies against a CVE
database.

**Results:**

| Project | Dependencies Tested | Vulnerabilities Found |
|---|---|---|
| Backend | 115 | 0 |
| Frontend | 54 | 0 |

**Monitoring:** `snyk monitor` enabled on both projects — future CVEs
affecting these dependencies will trigger an email alert.

---

## 4. GitLeaks — Secrets Detection ✅ Done

**What it does:** Scans the entire codebase (including `db/` SQL files
and Docker configs) for hardcoded secrets, API keys, and credentials
before anything is pushed to GitHub.

**Command used:**
```bash
gitleaks detect --source . -v
```

**Why it matters here:** `db/create_app_user.sql` contains a DB
password placeholder and `db/seed_admin.sql` contains a bcrypt hash —
GitLeaks confirms neither is a real, leaked credential.

---

## 5. HashiCorp Vault — Secrets Management ✅ Done

**What it does:** Moves secrets (DB password, JWT signing keys) out of
the plaintext `backend/.env` file into Vault, with RBAC policies and
TTL-bound access tokens.

**Status:** Integrated — backend now fetches secrets from Vault at
startup instead of reading them directly from `.env`.

---

## 6. Trivy — Container Image Scanning ✅ Done

**What it does:** Scans built Docker images for OS-level and library
vulnerabilities (the layer Snyk doesn't cover, since Snyk only checks
`package.json`, not the underlying Alpine Linux packages).

**Commands used:**
```bash
docker compose build
trivy image edusecure-lms-complete_backend
trivy image edusecure-lms-complete_frontend
```

## 6b. OWASP ZAP — Dynamic Application Testing ✅ Done

**What it does:** Scans the running application itself (DAST) for
exploitable vulnerabilities that only surface at runtime — things
static analysis and dependency scanning can't catch, like broken auth
flows or injection points exposed through actual HTTP requests.

**Applied to:** The running EduSecure LMS instance (frontend +
backend), matching the same workflow used earlier against Juice Shop.

---

## 7. Syft + Grype — Software Bill of Materials ⏳ To Run

**Syft — generates the inventory:**
```bash
syft edusecure-lms-complete_backend -o json > backend-sbom.json
syft edusecure-lms-complete_frontend -o json > frontend-sbom.json
```
Lists every package inside the image (application + OS level) with
exact versions — the "ingredients list" for the container.

**Grype — scans that inventory for vulnerabilities:**
```bash
grype sbom:backend-sbom.json
grype sbom:frontend-sbom.json
```
Works like Snyk/Trivy, but scans strictly from the pre-generated SBOM
— useful for supply-chain audits and keeping a saved record of exactly
what's running in production at a point in time.

---

## 8. Containerization — Docker ✅ Done

**Status:** Backend, frontend, and MySQL are all running successfully
via `docker compose up -d --build`.

```
CONTAINER              STATUS
edusecure-backend      Up (healthy)
edusecure-frontend     Up (running)
edusecure-mysql        Up (healthy)
```

**Verified working:** Login, dashboard rendering, and role-based
routing all confirmed functional end-to-end through the browser.

**Known issue to fix:** `/api/courses` currently throws a MySQL
`ER_WRONG_ARGUMENTS` error — `LIMIT ? OFFSET ?` placeholders in
`courseController.js` need to be passed as actual numbers (not
strings) for `mysql2`'s `execute()` (prepared statements don't support
placeholders for `LIMIT`/`OFFSET` the same way `query()` does). This
does not affect security — it's a functional bug — but should be
fixed before further testing.

---

## Current Status Summary

| Stage | Status |
|---|---|
| Threat Dragon (threat model) | ✅ Done |
| SonarQube for IDE (code analysis) | ✅ Done |
| Snyk (dependency scan) | ✅ Done — 0 vulnerabilities |
| GitLeaks (secrets scan) | ✅ Done |
| HashiCorp Vault (secrets management) | ✅ Done |
| Trivy (image scan) | ✅ Done |
| OWASP ZAP (DAST) | ✅ Done |
| Syft + Grype (SBOM) | ⏳ To run |
| Docker containerization | ✅ Done — all 3 services running |
| `/api/courses` LIMIT/OFFSET bug | 🐛 Needs fix |
