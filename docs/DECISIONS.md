# Decisions Log

Newest at top. Each entry: what we decided and why.

## Product & architecture

- **Reporting-only layer, not a data store.** Flex Reports connects to the host's schema and
  fetches data at run time; it persists only report definitions (JSON). Avoids re-importing
  data into spreadsheets and keeps the host as the source of truth.
- **Pluggable data-source adapter** (`getSchema` + `fetchRows`). REST/GraphQL/SQL are just
  adapters, so the package stays host-agnostic. SQL adapters run server-side only.
- **Column-defined, row-evaluated formulas.** One formula per column, applied to every row.
  Simpler than free-form Excel and matches the "goes all the way down" mental model. No
  per-cell overrides in the POC.
- **Operators limited to `+ - / * % ( )`.** `%` means percent-of (÷100), not modulo. Keeps
  the formula engine tiny and avoids a heavyweight/GPL formula library.
- **Custom lightweight pivot + chart** (Nivo), not react-pivottable (stale/buggy) or
  WebDataRocks (proprietary + bulky).

## Licensing & distribution

- **All third-party deps must be MIT/Apache/BSD.** Enables commercial redistribution and a
  "works forever" self-hosted product. Rules out HyperFormula (GPL/paid), Handsontable,
  Jspreadsheet Pro, Flexmonster, AG Grid Enterprise, WebDataRocks.
- **Our own code is proprietary**, distributed via private registry / build artifacts. This
  is separate from (and compatible with) using permissive dependencies.
- **No hosted service, no usage metering.** True enforcement is impossible on self-hosted
  client code, so licensing is legal + a light technical seam.
- **Signed offline license keys (future).** Verified locally with an embedded public key;
  no phone-home. "Free-for-life" = perpetual signed key. If a client stops paying, software
  keeps working; they just lose updates/support.
- **`licenseKey` seam added from day one but non-enforcing** for the POC.
- **npm package + adapter** is the integration model (host is React/JS). Standalone repo now.

## Tooling

- **Node latest via nvm** (v26.5.1 at setup), **Vite + React latest + TypeScript**, **Vitest**.
- **Per-component stylesheets.** Edit view = Excel-like; saved view = clean web page.
- **MVC-flavored structure** (models/services/controllers/views) to match a Rails mindset.

## Process

- Work on branches, open PRs; nothing hits `main` without review.
- Stop and ask when unsure.
- Keep docs (SPEC, DECISIONS, PRACTICES, TODO) current as we go.
