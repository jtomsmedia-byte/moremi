# Moremi Movement
A Next.js App Router implementation of the public MCF recruitment website and invitation-only M90 programme. Both environments share one origin. The pilot runs one cohort per installation on one Node server with a persistent local disk.

## Run locally
Use Node 24+ and npm. Docker runs the local SMTP inbox. If using an existing SMTP server, omit the Docker command and set SMTP_URL and MAIL_FROM in .env.local.
```sh
npm ci
npm run setup -- coordinator@example.org
docker compose up -d mail
npm run dev
```
Visit http://localhost:3000. Open the local test inbox at http://localhost:8025. Setup generates a random OTP secret and sets the cohort start to today unless an environment file already exists. Change COHORT_START to the actual Lagos intake start. Use real MCF media and contact details before deployment.

## Entry points
| Route | Access | Purpose |
|---|---|---|
| / | Public | Convener film slot, value propositions and lead capture |
| /program | Public | M90 roadmap, application wizard, email verification |
| /faq | Public | Programme and access questions |
| /activate | Public gate | Email OTP, first-use invitation, returning sign-in |
| /member/ | Active member | M90 timeline, live room, cohort chat, directory, learning and case study |
| /admin/ | Provisioned staff | Applicant decisions, publication, evidence review and cohort totals |

## Walk through the pilot
1. Submit an application with an eligible birth date and verify its email. Interest registrations do not start applications.
2. In another browser profile, sign in as the provisioned staff account using its email code. Review the answers and issue an invitation.
3. In the applicant’s browser, enter the invitation and registered email, then the six-digit code. The server consumes both credentials and creates membership in one transaction. Copying an invitation alone cannot activate an account.
4. From the content desk publish mentor bios, a direct HTTPS seminar video, a founder video, a PDF or a meeting room. Select an existing item to update it. Use a provider-authenticated room or suitably protected media origin. Staff explicitly open and close live rooms. Hosting and transcoding videos happens at the media provider.
5. Send a cohort chat message. Other connected dashboards refresh from server-sent change notifications. Staff verify LINK after an introduction and goal, then LEARN after worksheet discussion. Days measure elapsed calendar time; bars count verified milestones. These 30-day stages are pilot defaults.
6. After LEARN, drop a PDF case study or use the file chooser. Staff record an expert’s decision and feedback. A revision reopens the upload. Approval completes LEAD.
7. On a personal device, save a worksheet, open the saved library, then disable the network and reopen /member/. Only explicitly saved worksheets and the generic offline shell persist. Sign-out clears the cache. Browser downloads are under the user’s control.

## Project map
- app/ contains responsive routes, the shared layout, styles and the HTTP entry point.
- components/ separates recruitment, verification forms, dashboard, member sections and staff work.
- lib/ contains the curriculum, shared types, SQLite schema, session lookup and SMTP adapter.
- public/member/ holds the scoped worker, install manifest, placeholder app icons and offline library.
- scripts/setup.mjs provisions staff from the server shell. No browser role selector or default credentials.

## Deployment
Run npm run check, npm run build and npm start. Use HTTPS, set the exact APP_ORIGIN, configure SMTP delivery and replace the placeholder M icons with approved MCF artwork. Set DATA_DIR to a private persistent volume and back up the database and uploaded files together. Set the public founder film URL before build. Real participants, videos and mentors appear only after staff add them.

Put a 6 MB request-body cap and anonymous IP throttling on the reverse proxy. Disable proxy buffering for /api/changes/ and allow long-lived connections. A member may save worksheets on their own device; disable offline saving on shared-device deployments. Supply approved privacy text, file scanning and retention controls before handling real applications or case studies. Staff email verification is single-factor; require an identity-aware MFA proxy for staff in operational deployments, including staff API actions. For multiple cohorts, independent expert roles or horizontal deployment, add cohort-scoped database policies, object storage and a shared event bus before serving additional tenants. The included chat is cohort-wide.

## Verification
npm run check validates strict TypeScript. npm run build compiles all routes and the Tailwind stylesheet. Validate SMTP, meeting-provider permissions, Safari/Android installation and offline downloads using your production origin and media before rollout.
