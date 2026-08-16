# Meridian Staffing Assistant

Assessment application built with Next.js, TypeScript, Tailwind CSS, and the Vercel AI SDK.

## Architecture

```mermaid
flowchart TB
    User["User / Reviewer"]

    subgraph AWS["AWS EC2 Assessment Server"]
        Nginx["Nginx<br/>HTTPS / TLS<br/>Basic Authentication"]

        Next["Next.js Application<br/>Production Server :3000"]

        API["Next.js Server API<br/>/api/assistant"]

        Secrets["Server-side Environment Variables<br/>MERIDIAN_API_KEY<br/>OPENROUTER_API_KEY"]

        Systemd["systemd<br/>Process Supervisor"]

        Nginx -->|"Reverse proxy<br/>localhost:3000"| Next
        Next --> API
        Systemd -->|"Keeps application running"| Next
        Secrets -.->|"Server-side only"| API
    end

    Meridian["Meridian Staffing API<br/>Staffing / Scheduling Data"]

    OpenRouter["OpenRouter API<br/>LLM"]

    User -->|"HTTPS :443"| Nginx

    API -->|"HTTPS + API Key"| Meridian
    API -->|"HTTPS + Bearer API Key"| OpenRouter
```

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## QA

See `ANSWERS.md` for the six required assessment questions and the recorded production answers.
