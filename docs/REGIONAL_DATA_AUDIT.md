# GreenNext Regional Data Audit

Internal content-governance record for the seven-region experience. This file is not rendered by the public site.

## Review method

The following sources were searched in order for each regional field:

1. `C:/Users/janan/Downloads/Green Data/Green Data/src/data/locationsData.js`
2. `C:/Users/janan/Downloads/Green Data/Green Data/locations.html`
3. `C:/Users/janan/Downloads/Green Data/Green Data/V2-GreenNext-Technologies.html`
4. `C:/Users/janan/Downloads/Green Data/Green Data/views/location-detail.ejs`
5. The main project's `src/data/regions.ts`, `src/data/regionalPortfolio.ts`, `src/data/dashboard.ts`, `src/components/home/RegionalExplorer.tsx`, and the regional page template.

Aliases searched included `Puducherry`/`Pondicherry`, `Tiruchirappalli`/`Trichy`, `Mangalore`/`Mangaluru`, `land`/`landBank`/`acres`, `power`/`powerCapacity`/`MW`, `IT load`/`compute`, `fiber`/`fibre`, `airport`/`transit`, and `substation`/`grid`.

The reference project's `locationsData.js` contains six location records: Hosur, Tirunelveli, Trichy, Coimbatore, Madurai, and Pondicherry. It does not contain a Mangalore record. The supplied reference HTML repeats several of those records with different acreage figures. Reference wording such as `Verified`, `Approved`, `Ready`, `continuous`, or `dedicated` is treated as a source-reported planning claim, not independent verification.

## Classification key

| Classification | Meaning |
| --- | --- |
| `REFERENCE` | Value found in the read-only reference project and carried over with its planning/source caveat. |
| `EXISTING_PROJECT` | Value already present in the main project and retained. |
| `FALLBACK` | Existing code fallback from `unavailable()` in `src/data/regionalPortfolio.ts`; it means the source search found no reliable region-specific value. |
| `ILLUSTRATIVE` | Demo or conceptual value that must not be read as measured or verified. |
| `DERIVED` | Computed or normalized value; no regional technical value was derived for this audit. |
| `UNAVAILABLE` | No reliable value and no factual fallback was used. |

## Existing fallback policy

`src/data/regionalPortfolio.ts:37-42` defines the existing fallback:

```ts
unavailable(label) => {
  label,
  value: "Unavailable for this region",
  status: "Unavailable",
}
```

This fallback is used for missing portfolio fields in the regional cards and dossier template. It is explicitly a fallback, not a reference-verified value. The dashboard uses a separate explicit `null` state for location-specific telemetry that is unavailable; it does not substitute another region's metrics. The four original dashboard profiles remain marked `ILLUSTRATIVE / DEMO DATA`.

## Field audit by region

### Madurai (MDU)

Reference locations: `locationsData.js:142-172`; conflicting portfolio detail: `locations.html:724-748`; supporting references also searched in `V2-GreenNext-Technologies.html` and `views/location-detail.ejs`.

| Field | Reference value / location | Existing main value | Final displayed value | Class | Decision / limitation |
| --- | --- | --- | --- | --- | --- |
| Land area | `75+ Acres Verified` (`locationsData.js:147`); `93+ acres` (`locations.html:728-731`) | `75+ acres; 93+ acres` | Detail profile and overview card show both conflicting values | `REFERENCE` | Retained separately; title and final parcel size require confirmation. |
| Building area | Not found under building, floor, GFA, or data-centre-area aliases | `Unavailable for this region` | Same fallback | `FALLBACK` | Existing `unavailable()` fallback used; no building-size claim invented. |
| Site power | `90 MW Scalable` and `90 MW power availability` (`locationsData.js:149,169`) | `90 MW scalable` | `90 MW scalable` | `REFERENCE` | Site/portfolio power only; not IT load. |
| Data-centre IT load | No Madurai-specific IT-load value found; generic `100+ MW` text is not assigned to Madurai | Existing fallback | `Unavailable for this region` | `FALLBACK` | Kept separate from site power. |
| Substation | `230/110 kV Substation` (`locationsData.js:148`); `110kV Dedicated Feed` in the HTML (`locations.html:735-736`) | `230/110 kV substation described; HTML separately describes a 110 kV dedicated feed` | Same qualified source-reported planning description | `REFERENCE` | Voltage/feed configuration and approval require utility confirmation. |
| Renewable | No Madurai-specific renewable field found; generic reference themes mention renewable/open-access planning | `Solar/open-access planning opportunity described` | Same proposed planning narrative | `EXISTING_PROJECT` | Retained from the main project's planning model; not reference-verified and not a secured PPA. |
| Water | `2.2 MLD` (`locationsData.js:170`) | `2.2 MLD` | `2.2 MLD` | `REFERENCE` | Allocation and continuity require utility confirmation. |
| Cooling | No Madurai-specific cooling system found; generic closed-loop/adiabatic text is not region-specific | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic reference architecture not promoted to a Madurai fact. |
| PUE | No Madurai-specific PUE; generic `PUE ≤ 1.25` is a reference target only | Existing fallback | `Unavailable for this region` | `FALLBACK` | No regional PUE assigned. |
| Fibre/connectivity | NH-44, Madurai-Tuticorin corridor, and direct BSNL/Airtel/Jio/Tata routing (`locationsData.js:151,171`) | Direct carrier routing via BSNL, Airtel, Jio and Tata Communications; NH-44, Ring Road, ELCOT and Madurai-Tuticorin corridor | Same source-reported planning description | `REFERENCE` | Carrier route availability and diversity require provider confirmation. |
| Airport/transit | `20 mins to Madurai International Airport` (`locationsData.js:150`) | Same | Same | `REFERENCE` | Travel time is source-reported, not independently measured. |
| Zoning | IT Park, Commercial, Institutional (`locationsData.js:172`) | Same | Same | `REFERENCE` | Approval status requires documentary confirmation. |
| Facility/development status | Proposed campus language in reference | `Proposed`; `Under Validation` in narrative model | Proposed planning profile | `REFERENCE` | No operating GreenNext facility is claimed. |

### Coimbatore (CJB)

Reference locations: `locationsData.js:108-138`; conflicting portfolio detail: `locations.html:430-468, 662-690`; supporting references also searched in `V2-GreenNext-Technologies.html` and `views/location-detail.ejs`.

| Field | Reference value / location | Existing main value | Final displayed value | Class | Decision / limitation |
| --- | --- | --- | --- | --- | --- |
| Land area | `85+ Acres Verified` (`locationsData.js:113`); `98+ contiguous acres` (`locations.html:437,670,673`) | `85+ acres; 98+ acres` | Detail profile and overview card show both conflicting values | `REFERENCE` | Retained separately; parcel/title confirmation required. |
| Building area | Not found under building, floor, GFA, or data-centre-area aliases | Existing fallback | `Unavailable for this region` | `FALLBACK` | No building-size claim invented. |
| Site power | `100 MW Scalable` (`locationsData.js:115`) | `100 MW scalable` | Same | `REFERENCE` | Site/portfolio power only; not IT load. |
| Data-centre IT load | No Coimbatore-specific IT-load value found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic powered-shell ranges are not a Coimbatore IT-load commitment. |
| Substation | `230/110 kV Dedicated GIS` (`locationsData.js:114`); HTML describes `110kV` ingress at 1.2 km (`locations.html:437,677-682`) | `230/110 kV dedicated GIS; 110 kV reference ingress` | Both source descriptions retained | `REFERENCE` | Apparent configuration/distance conflict requires utility/site confirmation. |
| Renewable | No Coimbatore-specific renewable field found; generic reference themes mention renewable/open-access planning | Matching planning description | Same proposed planning narrative | `EXISTING_PROJECT` | Retained from the main project's planning model; not reference-verified and no secured renewable supply is claimed. |
| Water | `3.5 MLD` (`locationsData.js:136`) | `3.5 MLD` | Same | `REFERENCE` | Allocation and continuity require confirmation. |
| Cooling | No Coimbatore-specific cooling system found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic cooling reference is not regional evidence. |
| PUE | No Coimbatore-specific PUE; generic `PUE ≤ 1.25` is not assigned | Existing fallback | `Unavailable for this region` | `FALLBACK` | No regional PUE assigned. |
| Fibre/connectivity | Avinashi Road/NH-544, Kochi corridor, six conduits (`locationsData.js:117,137`) | Six diverse conduits connecting Chennai and Kochi cable landings; NH-544 / Avinashi Road corridor | Same source-reported planning description | `REFERENCE` | Carrier identity and route availability require confirmation. |
| Airport/transit | `25 mins to Coimbatore International Airport` (`locationsData.js:116`) | Same | Same | `REFERENCE` | Source-reported travel time. |
| Zoning | IT Park, Aerospace SEZ, Hi-Tech Industrial (`locationsData.js:138`) | Same | Same | `REFERENCE` | Certification/approval requires confirmation. |
| Facility/development status | Proposed flagship campus language | `Proposed`; `Under Validation` in narrative model | Proposed planning profile | `REFERENCE` | No operating facility is claimed. |

### Trichy / Tiruchirappalli (TRZ)

Reference locations: `locationsData.js:74-104`; detail section: `locations.html:781-808`; supporting references also searched in `V2-GreenNext-Technologies.html` and `views/location-detail.ejs`.

| Field | Reference value / location | Existing main value | Final displayed value | Class | Decision / limitation |
| --- | --- | --- | --- | --- | --- |
| Land area | `45+ Acres Verified` (`locationsData.js:79`); `45 acres` (`locations.html:786-789`) | `45+ acres` | `45+ acres` | `REFERENCE` | Source values are materially consistent but still require title confirmation. |
| Building area | Not found under building, floor, GFA, or data-centre-area aliases | Existing fallback | `Unavailable for this region` | `FALLBACK` | No building-size claim invented. |
| Site power | `80 MW Scalable` (`locationsData.js:81`) | `80 MW scalable` | Same | `REFERENCE` | Site/portfolio power only; not IT load. |
| Data-centre IT load | No Trichy-specific IT-load value found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic facility ranges are not assigned to Trichy. |
| Substation | `230/110 kV Substation` (`locationsData.js:80`); `230kV` switchyard in technical specs (`locationsData.js:101`) | `230/110 kV substation described` | Same source-reported description | `REFERENCE` | Exact ingress, redundancy, and approval require confirmation. |
| Renewable | No Trichy-specific renewable value found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic network/energy themes not promoted to a regional claim. |
| Water | `2.0 MLD Cauvery river industrial bulk connection` (`locationsData.js:102`) | `2.0 MLD` | Same | `REFERENCE` | Connection and continuity require confirmation. |
| Cooling | No Trichy-specific cooling system found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic cooling reference not regional evidence. |
| PUE | No Trichy-specific PUE; generic target only | Existing fallback | `Unavailable for this region` | `FALLBACK` | No regional PUE assigned. |
| Fibre/connectivity | National highways, rail, airport and four-carrier fibre (`locationsData.js:83,103`) | Dual underground fibre ring with four diverse national carriers; NH-45, NH-83, NH-67, rail, airport and international connectivity | Same source-reported planning description | `REFERENCE` | Carrier and route availability require confirmation. |
| Airport/transit | `15 mins to Trichy International Airport` (`locationsData.js:82`) | Same | Same | `REFERENCE` | Source-reported travel time. |
| Zoning | Mixed-use Commercial, IT SEZ, MICE (`locationsData.js:104`) | Same | Same | `REFERENCE` | Clearance status requires confirmation. |
| Facility/development status | Proposed knowledge/technology corridor | `Proposed`; `Under Validation` in narrative model | Proposed planning profile | `REFERENCE` | No operating facility is claimed. |

### Mangalore (IXE)

The searched reference files contain no Mangalore/Mangaluru location record. The main project already contains a conceptual regional narrative and map position in `src/data/regions.ts` and `src/components/home/RegionalExplorer.tsx`.

| Field | Reference value / location | Existing main value | Final displayed value | Class | Decision / limitation |
| --- | --- | --- | --- | --- | --- |
| Land area | Not found in reference or relevant aliases | Existing fallback | `Unavailable for this region` | `FALLBACK` | No source-specific land value exists. |
| Building area | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No building-size value exists. |
| Site power | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No site-power value exists. |
| Data-centre IT load | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No IT-load value exists. |
| Substation | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No substation value exists. |
| Renewable | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No regional renewable value exists. |
| Water | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No water value exists. |
| Cooling | Not found; generic reference cooling language is not location-specific | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic architecture is not promoted to Mangalore. |
| PUE | Not found regionally; generic target is not assigned | Existing fallback | `Unavailable for this region` | `FALLBACK` | No regional PUE assigned. |
| Fibre/connectivity | No city-specific route/carrier value found | Main conceptual coastal gateway narrative | Conceptual connectivity role only | `EXISTING_PROJECT` | Provider routes and carrier diversity require site-specific verification. |
| Airport/transit | No city-specific travel value found in reference | Main narrative names airport, port, rail and NH-66 context | Conceptual transport context only | `EXISTING_PROJECT` | No travel time or facility distance displayed as verified. |
| Zoning | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No zoning value exists. |
| Facility/development status | No Mangalore development record found | `To be confirmed` / `Not Confirmed` | Conceptual planning node | `EXISTING_PROJECT` | No city-specific GreenNext facility is claimed. |

### Hosur (HSR)

Reference locations: `locationsData.js:6-36`; conflicting detail: `locations.html:694-721`; supporting references also searched in `views/location-detail.ejs`.

| Field | Reference value / location | Existing main value | Final displayed value | Class | Decision / limitation |
| --- | --- | --- | --- | --- | --- |
| Land area | `90+ Acres Verified` (`locationsData.js:11`); `65 acres` (`locations.html:702,705`) | `90+ acres; 65 acres` | Detail profile and overview card show both conflicting values | `REFERENCE` | Title and final parcel size require confirmation. |
| Building area | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No building-size claim invented. |
| Site power | `120 MW Scalable` (`locationsData.js:13`) | `120 MW scalable` | Same | `REFERENCE` | Site/portfolio power only; not IT load. |
| Data-centre IT load | HTML describes an `80+ MW hyperscale compute parcel` (`locations.html:705`); not an IT-load commitment | `80+ MW hyperscale compute parcel` with proposed caveat | Same source-reported proposal | `REFERENCE` | Kept separate from 120 MW site power; not confirmed IT load. |
| Substation | `230/110 kV Dedicated Hookup` (`locationsData.js:12`); direct 230kV ingress in HTML (`locations.html:705,709`) | `230/110 kV dedicated hookup` | Same | `REFERENCE` | Connection and redundancy require confirmation. |
| Renewable | `100% green open-access power` in `locationsData.js:22`; supporting HTML uses green-power language | Proposed renewable readiness | Same planning claim | `REFERENCE` | No secured PPA or operating supply claimed. |
| Water | `2.5 MLD` (`locationsData.js:34`) | `2.5 MLD` | Same | `REFERENCE` | Allocation and continuity require confirmation. |
| Cooling | No Hosur-specific cooling system found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic liquid-cooling text is not a committed facility design. |
| PUE | No Hosur-specific PUE; generic target only | Existing fallback | `Unavailable for this region` | `FALLBACK` | No regional PUE assigned. |
| Fibre/connectivity | Carrier-neutral loop and six Tier-1 backbones (`locationsData.js:15,35`) | Carrier-neutral fibre loop with six Tier-1 backbones; NH-44, Electronic City proximity and rail-freight connectivity | Same source-reported planning description | `REFERENCE` | Carrier and route claims require provider confirmation. |
| Airport/transit | `60 mins to BLR International Airport` (`locationsData.js:14`) | Same | Same | `REFERENCE` | Source-reported travel time; site route requires confirmation. |
| Zoning | Industrial/IT-SEZ clearance language (`locationsData.js:36`) | Same proposed suitability | Same planning claim | `REFERENCE` | Approval status requires documentary confirmation. |
| Facility/development status | Proposed industrial/hyperscale-edge campus | `Proposed` | Proposed planning profile | `REFERENCE` | No operating facility is claimed. |

### Tirunelveli (TNV)

Reference locations: `locationsData.js:40-70`; conflicting detail: `locations.html:752-779`; supporting references also searched in `views/location-detail.ejs`.

| Field | Reference value / location | Existing main value | Final displayed value | Class | Decision / limitation |
| --- | --- | --- | --- | --- | --- |
| Land area | `50+ Acres Verified` (`locationsData.js:45`); `40 acres` (`locations.html:760,763`) | `50+ acres; 40 acres` | Detail profile and overview card show both conflicting values | `REFERENCE` | Title and final parcel size require confirmation. |
| Building area | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No building-size claim invented. |
| Site power | `150 MW 100% Green Energy Ready` (`locationsData.js:47`) | `150 MW scalable` | `150 MW scalable` with renewable caveat | `REFERENCE` | Site/portfolio power only; not IT load. |
| Data-centre IT load | `100+ MW` AI/data-centre planning claim in the overview/focus (`locationsData.js:52,60`); renewable park detail (`locations.html:761,768`) | `100+ MW renewable data-centre park` with proposed caveat | Same source-reported proposal | `REFERENCE` | Source supports a proposed data-centre scale claim, not measured or secured IT load; kept separate from 150 MW site power. |
| Substation | `400/230 kV Ultra-High Voltage Grid` (`locationsData.js:46`); `230kV` within 800 m (`locations.html:763,767`) | `400/230 kV grid; 230 kV reference substation within 800 m` | Both source-reported statements retained | `REFERENCE` | Voltage, distance, access, and readiness require confirmation. |
| Renewable | Wind/solar corridor and renewable wheeling (`locationsData.js:47,66`; `locations.html:772`) | Matching proposed readiness | Same planning claim | `REFERENCE` | No secured renewable supply claimed. |
| Water | `3.0 MLD` (`locationsData.js:68`) | `3.0 MLD` | Same | `REFERENCE` | Allocation and continuity require confirmation. |
| Cooling | No Tirunelveli-specific cooling system found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic liquid-cooling reference not promoted to a facility fact. |
| PUE | No Tirunelveli-specific PUE; generic target only | Existing fallback | `Unavailable for this region` | `FALLBACK` | No regional PUE assigned. |
| Fibre/connectivity | NH-44, Tuticorin port, rail and redundant fibre planning (`locationsData.js:49,69`) | Redundant underground optical fibre conduits on dual diverse highway paths; NH-44, rail and Tuticorin port connectivity | Same source-reported planning description | `REFERENCE` | Provider diversity and route readiness require confirmation. |
| Airport/transit | `35 mins to Tuticorin Airport / 120 mins to Madurai` (`locationsData.js:48`); port about 45 km in HTML (`locations.html:763`) | `35 minutes to Tuticorin Airport; 45 km reference to port` | Same source-reported planning description | `REFERENCE` | Travel time and port distance require route/site confirmation. |
| Zoning | IT/data-centre and heavy-engineering zoning (`locationsData.js:70`) | Same | Same planning claim | `REFERENCE` | Approval status requires confirmation. |
| Facility/development status | Proposed renewable-energy/high-density campus | `Proposed` | Proposed planning profile | `REFERENCE` | No operating facility is claimed. |

### Puducherry / Pondicherry (PDY)

Reference record uses `pondicherry`: `locationsData.js:176-206`; conflicting detail: `locations.html:810-835`; supporting references also searched in `views/location-detail.ejs`.

| Field | Reference value / location | Existing main value | Final displayed value | Class | Decision / limitation |
| --- | --- | --- | --- | --- | --- |
| Land area | `45+ Acres Verified` (`locationsData.js:181`); `35 acres` (`locations.html:818,821`) | `45+ acres; 35 acres` | Detail profile and overview card show both conflicting values | `REFERENCE` | Title and final parcel size require confirmation. |
| Building area | Not found | Existing fallback | `Unavailable for this region` | `FALLBACK` | No building-size claim invented. |
| Site power | `60 MW Scalable` (`locationsData.js:183`) | `60 MW scalable` | Same | `REFERENCE` | Site/portfolio power only; not IT load. |
| Data-centre IT load | No Puducherry-specific IT-load value found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Edge/data-centre facility themes are not an IT-load value. |
| Substation | `110/33 kV Dedicated Substation` (`locationsData.js:182`) | Same | Same source-reported planning description | `REFERENCE` | Connection and approval require confirmation. |
| Renewable | No Puducherry-specific renewable value found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic green-energy themes not promoted to a regional claim. |
| Water | `1.8 MLD` (`locationsData.js:204`) | `1.8 MLD` | Same | `REFERENCE` | Desalination/treatment and continuity require confirmation. |
| Cooling | No Puducherry-specific cooling system found | Existing fallback | `Unavailable for this region` | `FALLBACK` | Generic cooling reference is not regional evidence. |
| PUE | No Puducherry-specific PUE; generic target only | Existing fallback | `Unavailable for this region` | `FALLBACK` | No regional PUE assigned. |
| Fibre/connectivity | ECR/NH-32, Chennai backhaul and port context (`locationsData.js:185,205`) | ECR, NH-32, Chennai backhaul and port connectivity; reference also claims a 1.2 ms route to Chennai subsea cable landings | Same source-reported planning description | `REFERENCE` | The `1.2 ms` latency claim is not independently validated. |
| Airport/transit | `15 mins to Pondicherry Airport / 90 mins to Chennai` (`locationsData.js:184`) | Same | Same | `REFERENCE` | Source-reported travel time. |
| Zoning | Tourism-Commercial-IT mixed status (`locationsData.js:206`) | Same proposed suitability | Same planning claim | `REFERENCE` | Legal/zoning status requires confirmation. |
| Facility/development status | Proposed coastal innovation/edge campus | `Proposed` | Proposed planning profile | `REFERENCE` | No operating facility is claimed. |

## Map coordinates and dashboard metrics

The reference project does not provide a validated coordinate dataset for these GreenNext sites. The main project uses city-level map coordinates in `src/components/home/RegionalExplorer.tsx:60-67` for a conceptual SVG map. These are existing map-placement values, not parcel coordinates, and are not treated as infrastructure verification.

The original Madurai, Coimbatore, Trichy, and Mangalore dashboard percentages/events/alerts in `src/data/dashboard.ts` are retained as `ILLUSTRATIVE` demo values because the existing UI and disclaimer define them that way. Hosur, Tirunelveli, and Puducherry use `null` and display `N/A` with `Planning / Telemetry unavailable`; no values were copied from another region and no live telemetry is implied.

## Conflicts and remaining confirmation work

- Acreage conflicts exist for Coimbatore (85+ vs 98+), Hosur (90+ vs 65), Madurai (75+ vs 93+), Tirunelveli (50+ vs 40), and Puducherry (45+ vs 35). Both source-reported values remain visible in the internal portfolio model; none is labelled verified by GreenNext.
- Tirunelveli has separate source claims for 150 MW site power and a proposed 100+ MW data-centre park. These remain separate and are not combined into an IT-load figure.
- Hosur has separate source claims for 120 MW site power and an 80+ MW hyperscale compute parcel. These remain separate and are not combined into an IT-load figure.
- Coimbatore has a 230/110 kV GIS claim and a separate HTML description of 110 kV ingress about 1.2 km away. The model retains both as a confirmation issue.
- Mangalore has no location-specific record in the supplied reference project. Its technical portfolio fields therefore use the existing explicit fallback, while its conceptual airport/port/rail/connectivity narrative remains in the main project.
- No region has a reference-verified building area, cooling system, or PUE. The generic reference `PUE ≤ 1.25` and generic closed-loop/adiabatic cooling text were intentionally not assigned to individual regions.
- Land title, utility allocation, substation access, fibre route diversity, zoning, construction status, and operating-facility status remain subject to independent confirmation.

## Route and component coverage

All seven ids are present in the shared regional portfolio and the regional page template:

`/regions/madurai`, `/regions/coimbatore`, `/regions/trichy`, `/regions/mangalore`, `/regions/hosur`, `/regions/tirunelveli`, `/regions/puducherry`.

The Regional Exploration map and comparison selector use the same seven-region portfolio. The dashboard selector uses the same seven ids, with explicit demo/unavailable handling described above.
