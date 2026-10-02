# GreenNext Digital Presence Intelligence

## Layer 1: Session Intelligence

```text
Raw Events
    ↓
Session Reconstruction
    ↓
Session Intelligence
    ↓
Session Metrics
```

Session Intelligence is derived from the existing anonymous analytics event stream. The raw event tabs remain canonical; `Session_Intelligence` is a derived reporting sheet and is safe to regenerate.

### Session definition

A session is the set of valid events sharing one anonymous `sessionId`. The first valid timestamp establishes `session_start_time` and the first observed page-view event establishes `entry_page`. Existing `new_session` / `returning_session` values are preserved when present.

### Navigation and pages

`page_view` and `nav_page_view` events are ordered by timestamp. Duplicate page-view signals for the same page within two seconds are treated as one visit so the root component's two existing page-view signals do not inflate page counts. `pages_visited`, `pages_count`, `navigation_flow`, and `exit_page` are derived from that ordered sequence.

### Active dwell time

The existing visibility-aware page behavior hook records `time_on_page` in active foreground milliseconds. Each derived page entry stores approximate `page_start`, `page_end`, and `active_time`. Hidden/background time is excluded. Route cleanup records the current page's accumulated active time. Browser lifecycle events are best-effort only.

### Session end and duration

`session_end` is emitted on a non-bfcache `pagehide` event when available. The derived end timestamp is the last valid event timestamp; `session_end_observed` identifies sessions with an explicit lifecycle signal. If the browser closes before delivery, the final observed event is used and exact close time is not fabricated.

`total_session_duration` is elapsed time between the first and last observed event, in milliseconds. It is not a claim of continuous active attention.

### Bounce

`bounce = true` when the reconstructed session has exactly one page and no meaningful engagement or conversion event. A CTA, form interaction, engagement milestone, scroll milestone, or lead conversion makes the session non-bounce.

### Engagement

A session is engaged when it has multiple pages, an engagement milestone, a meaningful scroll milestone, a CTA/form interaction, or a lead conversion. Housekeeping events (`page_view`, scroll telemetry, dwell, and lifecycle events) alone do not count as meaningful engagement.

### Data quality and privacy

Malformed or missing-session events are excluded from reconstruction. Historical five-column behavioral rows remain readable; new behavioral rows add `Session Kind` as a sixth column. Duplicate event fingerprints are suppressed during reconstruction. No GPS, raw IP identity, fingerprinting, or new PII is introduced.

The model is intentionally conservative: missing timestamps, missing page values, dropped unload events, offline requests, and legacy rows remain incomplete rather than being fabricated.

## Layer 2: Context Enrichment

### Production analytics transport

For production browser telemetry, the transport path is:

```text
Browser
    ↓
POST /api/analytics (existing TanStack Start/Nitro runtime)
    ↓
Transient server-side provider lookups
    ↓
Existing Google Apps Script doPost endpoint
    ↓
Canonical raw event tabs + derived intelligence sheets
```

The browser continues to send the existing flat analytics payload. The server adapter preserves those fields, adds only validated derived context, and forwards the payload to the existing Apps Script ingestion path. A per-event `eventId` is used only for short-lived deduplication; it is not written as a new raw-sheet column.

The production deployment targets Vercel, while Cloudflare support remains available. The adapter accepts only deployment-controlled IP headers: Vercel `X-Real-IP`, or `X-Forwarded-For` when `X-Vercel-ID` is present; Cloudflare `CF-Connecting-IP` remains supported. Browser-supplied IP fields are ignored. The raw IP exists only during the provider lookup, is hashed for the short-lived in-memory cache key, and is never forwarded, logged, returned, or stored in Sheets. Provider calls have a bounded timeout, a small in-memory cache, and a per-provider rate limit.

If the server adapter cannot be reached, the browser falls back to the existing direct Apps Script endpoint. Apps Script validates the optional server enrichment signature before accepting Geo/network fields and deduplicates retryable behavioral events by `eventId` using a short-lived cache.

```text
Session Intelligence
    ↓
Context Enrichment
 ├── Traffic Intelligence
 ├── Geo Intelligence
 ├── Time Zone Intelligence
 └── IP Intelligence
```

Layer 2 uses the same canonical event stream and the derived Layer 1 session records. It does not create independent collectors or duplicate raw events.

### Traffic Intelligence

The first event in a session captures referrer, landing page, UTM fields, and a deterministic traffic classification: `direct`, `organic`, `paid`, `referral`, `social`, `campaign`, or `unknown`. Paid media takes precedence over social; recognized search engines with organic attribution are organic; an external valid referrer is referral; incomplete attribution remains unknown. UTM context is held in anonymous session storage so route changes do not discard first-touch campaign attribution.

### Geo Intelligence

Geo enrichment is performed before Apps Script receives the event. When a trusted deployment IP and a configured provider are available, country, region, and city are normalized and forwarded through the existing analytics payload. Browser geolocation permission and precise coordinates are not used. The provider abstraction validates country/region/city, confidence, and source metadata before storage; invalid responses are discarded. If the provider is unavailable or no trusted IP is present, the fields remain empty.

Provider configuration is server-side through the Vercel environment (or the equivalent server runtime configuration):

- `GEO_PROVIDER_URL`
- `GEO_PROVIDER_API_KEY`

GreenNext is configured for IPLocation.net API v2 when live Geo enrichment is enabled. The endpoint is `https://api.iplocation.net/v2/ip-location`; it accepts an HTTPS `POST` request with `{ "ip": "..." }` and a `Bearer` API key, and returns location/network fields including `country` or `country_code`, `region` or `region_name`, `city`, ISP, ASN, and network type. Optional `confidence` and `provider`/`source` metadata are retained when valid. The server runtime uses the following URL/key contract when live lookups are enabled:

- `GEO_PROVIDER_URL`
- `GEO_PROVIDER_API_KEY`

The `/api/analytics` server adapter uses the deployment-controlled Vercel IP headers described above. If they are absent, or the provider is not configured, location remains unavailable. No client-provided location is accepted. The single IPLocation.net response is also used for supported network fields when no separate network provider is configured. No provider credentials are committed to this repository; live Geo Intelligence requires configuring the two server-only variables in Vercel.

### Time Zone Intelligence

Timezone, UTC offset, local activity hour, and activity day are client-derived from the browser environment and labeled as such. They indicate local activity timing only; they are not treated as proof of geographic location.

### IP / Network Intelligence

Raw IP is never stored or exposed. Network type, ISP, organization, and ASN remain unavailable because the current Apps Script request environment does not provide a trusted provider or client-IP source. The provider abstraction validates network type, ISP, organization, ASN, confidence, and source metadata without retaining the lookup IP.

Optional server-side Script Properties are:

- `NETWORK_PROVIDER_URL`
- `NETWORK_PROVIDER_API_KEY`

The server runtime also requires:

- `NETWORK_PROVIDER_URL`
- `NETWORK_PROVIDER_API_KEY`
- `ANALYTICS_APPS_SCRIPT_URL` (optional; the existing deployed endpoint is the fallback)
- `ANALYTICS_ENRICHMENT_SECRET` (must match the Apps Script Script Property of the same name before derived provider fields are accepted)

The `/api/analytics` adapter performs the optional lookup only when a trusted platform IP header and provider configuration are present. Lightweight suspicious-traffic flags are deterministic and based only on canonical session events: high event volume, high page-view volume, short event bursts, and abnormal event density. They do not block visitors, fingerprint them, or attempt identity resolution.

Layer 2 outputs are written to `Traffic_Intelligence`, `Geo_Intelligence`, `Timezone_Intelligence`, and `IP_Intelligence`, while the compact per-session context index is stored in `Session_Context`. These are derived structures, not replacements for raw event tabs.

## Digital Presence Action Layer

The action layer is a client-side, first-party personalization layer built on the existing canonical `trackEvent` calls. It creates a random anonymous `visitorId` in local storage (`gn_visitor_id`), separate from the per-session `sessionId`. The visitor profile stores only bounded behavioral summaries: whether a later session is returning, recent pages, section visit/engagement counts, meaningful CTA values, interest labels, inquiry types, and a conversion flag. The identifier and profile are not sent to Google Sheets, the server, the assistant provider, or any third-party enrichment service.

The root shell uses that profile to show an optional, dismissible “Welcome back” recommendation with user-controlled links to continue exploring a relevant section. The existing GreenNext AI Assistant receives a compact derived context containing returning status, recent pages, dominant interest, engaged sections, relevant CTA, conversion state, current page, and current-session engagement. Its contextual opening and suggestions are generated from that state; no second chatbot or analytics collector is created, and no redirect is forced.

The action layer works when Geo/IP providers are unavailable because it depends only on local anonymous behavior plus the existing Session, Traffic, Time Zone, and Unified Intelligence-compatible event fields. Malformed or missing local state is discarded safely and treated as a new visitor. This is browser-local personalization: historical Google Sheet rows are not loaded into the browser, and clearing storage or changing browsers resets the profile.

## Layer 3: Unified Intelligence

```text
Layer 1: Session Intelligence
        ↓
Layer 2: Traffic / Geo / Timezone / IP
        ↓
Layer 3: Unified Intelligence
        ↓
Funnel + Behavior + Regional + Acquisition Insights
```

`Unified_Intelligence` is joined by the anonymous `session_id` only. It combines the existing session and context fields without using raw IP, email, fingerprints, or other personal identifiers.

### Unified profiles and segments

Each session receives a deterministic analytical profile containing session type, acquisition source, campaign, landing page, engagement segment, conversion status, geographic context, timezone context, and network/security context. It is not a persistent personal profile.

Engagement segments are:

- `converted`: the session has a lead conversion.
- `high`: at least 120,000 active dwell milliseconds, three or more pages, and a CTA or form interaction.
- `medium`: at least two pages, an existing engagement flag, or at least three events.
- `low`: all other valid sessions.

Behavior labels such as `single_page`, `deep_navigation`, `cta_driven`, `form_driven`, `converted`, `returning_engaged`, and `campaign_engaged` are descriptive observations, not intent or sensitive-attribute inferences.

The unified sheet contains deterministic traffic, campaign, entry/exit, navigation, geography, timezone, traffic/geography, traffic/timezone, network/traffic, funnel, and session-record sections. Conversion rates use sessions in the relevant group as the denominator; empty groups return `N/A`. Missing geo/network values remain unavailable.
