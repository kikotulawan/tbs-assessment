# Architecture

```text
                         ┌───────────────────┐
                         │      Browser      │
                         │                   │
                         │  Next.js / React  │
                         │  Staffing Chat    │
                         └─────────┬─────────┘
                                   │
                                   │ HTTPS
                                   ▼
                         ┌───────────────────┐
                         │     Next.js       │
                         │                   │
                         │ /api/assistant    │
                         │ server-side only  │
                         └───────┬─────┬─────┘
                                 │     │
                      ┌──────────┘     └──────────┐
                      ▼                           ▼
             ┌────────────────┐           ┌────────────────┐
             │ Meridian API   │           │   OpenRouter   │
             │                │           │      LLM       │
             │ HR             │           └────────────────┘
             │ Scheduling     │
             │ Credentialing  │
             └────────────────┘
```

## Data reconciliation

- HR identifies employees with `E-*`.
- Scheduling identifies workers with `W-*`.
- The identifiers are intentionally different.
- When HR/credentialing information is needed for a scheduling worker, `workEmail` is matched to HR `email`.
- Credential records link to HR using `employeeId`.

## Security

External API credentials are only read by server-side code. The browser never receives the Meridian or OpenRouter keys.
