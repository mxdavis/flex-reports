# Flex Reports

A self-hostable, embeddable **reporting layer** that sits on top of a billing (or any)
application's data. End users build reports in a familiar spreadsheet-style editor —
defining columns and simple per-row formulas — then save them as clean, filterable
pivot + chart views. Flex Reports stores **only the report definitions**, never the
underlying data.

Built to be sold as a one-time-fee, self-hosted package: no recurring cost, no license
server, no service we host. The developer who installs it hosts it.

---

## Documentation

- **[docs/SPEC.md](docs/SPEC.md)** — full product spec, architecture, and scope.
- **[docs/DECISIONS.md](docs/DECISIONS.md)** — decisions log (what we chose and why).
- **[docs/PRACTICES.md](docs/PRACTICES.md)** — **you own this file.** Coding practices I must
  follow. Edit it anytime; I read it before writing code.
- **[docs/TODO.md](docs/TODO.md)** — live task tracker (worked on / in PR / in main).

---

## Quick start

> The project is being scaffolded. This section is filled in as the POC lands.

```bash
# install
npm install

# run the demo
npm run dev

# run tests
npm test
```

---

## What it is / is not

- **Is:** a read-only reporting UI + engine you embed via a data adapter.
- **Is not:** a data store, a spreadsheet host, or a billing system.

See [docs/SPEC.md](docs/SPEC.md) for the details.
