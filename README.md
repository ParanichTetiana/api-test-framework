# API Test Framework for eRx McKesson

Automated API + database verification tests for the McKesson eRx `NewRx`/patient intake service, built with Jest, Axios, and node-oracledb.

## Prerequisites

- Node.js
- Network access to the McKesson QA environment (auth server, API, and Oracle DB)
- Valid QA credentials (auth user/password, DB user/password)

## Setup

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Copy the environment template and fill in real credentials:
   ```powershell
   Copy-Item .env.example .env
   ```
3. Fill in `.env`:
   | Variable | Description |
   | --- | --- |
   | `AUTH_URL` | OAuth token endpoint (Basic Auth, `client_credentials` grant) |
   | `AUTH_USER_ID` | Basic Auth username for the token endpoint |
   | `AUTH_PASSWORD` | Basic Auth password for the token endpoint |
   | `API_BASE_URL` | Base URL for the patient intake / NewRx API |
   | `DB_USER` | Oracle DB username |
   | `DB_PASSWORD` | Oracle DB password |
   | `DB_CONNECT_STRING` | Oracle Easy Connect string or full descriptor (`host:port/serviceName`) |

   `.env` is git-ignored — never commit real credentials.

## Running tests

```powershell
npm test
```

Runs all specs under `tests/specs/**/*.test.js` with Jest. A shared access token is fetched once before the run (`globalSetup`) and reused across all tests via `process.env.ACCESS_TOKEN`.

## Linting & formatting

```powershell
npm run lint     # ESLint check
npm run format   # Prettier auto-format
```

VS Code users: install the ESLint extension to get auto-fix-on-save (see `.vscode/settings.json`).

## Project structure

```
core/config/
  auth.js       # Fetches an OAuth access token via Basic Auth
  env.js        # Centralized process.env access (auth, API, DB config)
tests/
  db/
    connections.js   # Oracle connection pool + query helper
  hooks/
    globalSetup.js   # Fetches the access token once before all tests run
  specs/
    test_api.test.js # Actual Jest test suites
  testdata/
    *.js              # NewRx payload builders for various test scenarios
utils/
  apiClient.js  # Axios instance with base URL, auto-attached bearer token,
                # and automatic 401 retry after refreshing the token
```

## How it works

1. **Authentication** — [core/config/auth.js](core/config/auth.js) requests a token from `AUTH_URL` using HTTP Basic Auth (`AUTH_USER_ID`/`AUTH_PASSWORD`) with a `grant_type=client_credentials` form body.
2. **Token sharing** — [tests/hooks/globalSetup.js](tests/hooks/globalSetup.js) fetches this token once per test run and stores it in `process.env.ACCESS_TOKEN`.
3. **API calls** — [utils/apiClient.js](utils/apiClient.js) is a preconfigured Axios instance that automatically attaches `Authorization: Bearer <token>` to every request, and retries once on a `401` after refreshing the token.
4. **Test data** — [tests/testdata/](tests/testdata) contains reusable payload builders (e.g. `buildNewRxPayload()`), each generating a fresh, unique `CorrelationId` per call.
5. **DB verification** — [tests/db/connections.js](tests/db/connections.js) provides an Oracle connection pool (`initPool`/`query`/`closePool`) used to confirm submitted data was persisted correctly (e.g. joining `EREFERRAL_ORDER` → `EREFERRAL_ITEM` → `VACCINATION_DETAIL` by `CORRELATION_ID`).

## Notes

- Tests hit real QA endpoints and a real Oracle DB — they require network access and valid credentials to pass.
- Each spec file that opens a DB pool (`initPool()`) must also close it in the same file (`afterAll(() => closePool())`), since Jest's `globalSetup`/`globalTeardown` run in a separate module context and can't share in-memory state (like an open pool) with test files.
