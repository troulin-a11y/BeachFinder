# Beach Finder App - Free API Research
## Europe & USA Coverage

*Research conducted: April 2026*

---

## 1. BEACH LOCATIONS DATABASE

### A. OpenStreetMap Overpass API (BEST OPTION)

- **URL**: https://overpass-api.de/ | https://wiki.openstreetmap.org/wiki/Overpass_API
- **Interactive tool**: https://overpass-turbo.eu/
- **API key**: NOT required
- **Cost**: Completely free
- **Rate limits**:
  - ~10,000 queries/day on main public instance (recommended safe maximum)
  - <1 GB data download/day
  - 180-second default query timeout (extendable to ~900s)
  - HTTP 429 returned when rate limit exceeded
  - Check your quota: `/api/status`
- **Geographic coverage**: Worldwide (full OpenStreetMap database)
- **Commercial use**: Allowed under ODbL license (requires attribution)

**How to query beaches:**
```
[out:json][timeout:90];
(
  node["natural"="beach"]({{bbox}});
  way["natural"="beach"]({{bbox}});
  relation["natural"="beach"]({{bbox}});
);
out center body;
```

**Available beach data in OSM tags:**
- `natural=beach` - main tag
- `name=*` - beach name
- `surface=sand/pebbles/gravel/rock` - beach surface type
- `access=yes/no/private`
- `nudism=yes/no`
- `supervised=yes/no` (lifeguard presence)
- `swimming=yes/no`
- `description=*`
- Coordinates included in all results

**Multiple public instances available:**
- Main: `overpass-api.de` (10K queries/day)
- VK Maps instance: No request limitations
- Private.coffee instance: No rate limit
- Can also self-host Overpass for unlimited queries

**Strategy for the app:**
- Do a one-time bulk extract of all beaches in Europe and USA
- Store in your own database with coordinates, names, surface types
- Periodically re-sync (monthly) for updates
- For real-time queries, use bounding-box queries per user viewport

---

### B. Geoapify Places API (Supplement)

- **URL**: https://apidocs.geoapify.com/docs/places/
- **API key**: Required (free to obtain)
- **Cost**: Free tier available
- **Rate limits**:
  - 3,000 requests/day
  - 5 requests/second
- **Geographic coverage**: Worldwide (uses OSM data)
- **Data**: 500+ POI categories including beaches; provides structured responses with coordinates, names, categories

**Note:** Since Geoapify uses OSM data underneath, Overpass is more direct and has higher limits. Geoapify is useful if you want a more developer-friendly REST API with cleaner responses.

---

### C. Strategy Recommendation

**Use Overpass API to build your beach database.** Do an initial bulk download of all `natural=beach` features for Europe and USA (tens of thousands of beaches). Store locally. Enrich with data from other APIs below. No API key, no cost, very generous limits. Self-host Overpass if you need unlimited queries.

---

## 2. WEATHER DATA (Wind Speed/Direction, Air Temperature)

### A. Open-Meteo (BEST FOR NON-COMMERCIAL)

- **URL**: https://open-meteo.com/en/docs
- **API key**: NOT required
- **Cost**: Free for non-commercial use
- **Rate limits (free tier)**:
  - 600 calls/minute
  - 5,000 calls/hour
  - 10,000 calls/day
  - 300,000 calls/month
- **Geographic coverage**: Worldwide
- **Commercial use**: NOT allowed on free tier (paid plans from EUR 29/month for 1M requests)
- **Attribution**: Required (CC BY 4.0)

**Available weather data:**
- Air temperature (current, hourly, daily min/max)
- Wind speed & direction (at 10m and 80m)
- Wind gusts
- Precipitation, rain, showers
- Cloud cover
- UV index
- Feels-like temperature (apparent temperature)
- Humidity, pressure, visibility
- 7-day hourly forecast, 16-day daily forecast

**Pros:** No API key, excellent documentation, very fast, open-source
**Cons:** Non-commercial only on free tier; no SLA guarantees

---

### B. OpenWeatherMap (BEST FOR COMMERCIAL USE)

- **URL**: https://openweathermap.org/api
- **API key**: Required (free)
- **Cost**: Free tier available
- **Rate limits (free tier)**:
  - 60 calls/minute
  - 1,000,000 calls/month (~33K/day)
  - One Call API 3.0: 1,000 calls/day free
- **Geographic coverage**: Worldwide
- **Commercial use**: Allowed on free tier with attribution

**Available weather data:**
- Current weather, 5-day/3-hour forecast
- Air temperature, feels-like
- Wind speed & direction
- Humidity, pressure, visibility
- Cloud cover, rain/snow volume
- Air pollution data

**Pros:** Very high free limit (1M/month), commercial use allowed, well-established
**Cons:** API key required, 5-day forecast only on free tier

---

### C. NWS weather.gov API (USA ONLY - UNLIMITED)

- **URL**: https://api.weather.gov/ | https://weather-gov.github.io/api/
- **API key**: NOT required (User-Agent header with contact info required)
- **Cost**: Completely free
- **Rate limits**: No published rate limits (fair use expected)
- **Geographic coverage**: USA only (2.5km grid)
- **Commercial use**: Public domain data, no restrictions

**Available data:**
- 7-day hourly and daily forecasts
- Wind speed & direction
- Temperature, humidity
- Alerts and warnings
- Observations from NWS stations

**Pros:** Truly free, unlimited, no key, USA government data
**Cons:** USA only, so you need another source for Europe

---

### D. Visual Crossing

- **URL**: https://www.visualcrossing.com/weather-api/
- **API key**: Required (free)
- **Rate limits**: 1,000 records/day (free tier)
- **Geographic coverage**: Worldwide
- **Commercial use**: Allowed with restrictions
- **Note:** Too low for a high-volume app; included for reference only

---

### E. WeatherAPI.com

- **URL**: https://www.weatherapi.com/
- **API key**: Required (free)
- **Rate limits**: 1,000 requests/month (free tier) -- too low
- **Note:** Not viable for a production app on free tier

---

### Weather Recommendation

**Primary (non-commercial):** Open-Meteo -- 10K calls/day, no key needed, excellent data
**Primary (commercial):** OpenWeatherMap free tier -- 1M calls/month, commercial allowed
**USA supplement:** NWS weather.gov API -- unlimited, free, no key
**Strategy:** Use NWS for USA users (unlimited free), Open-Meteo or OWM for Europe.
Cache aggressively -- weather data for a beach doesn't change minute-to-minute; 1-hour cache is fine.

---

## 3. SEA/OCEAN WATER TEMPERATURE

### A. Open-Meteo Marine Weather API (BEST OPTION)

- **URL**: https://open-meteo.com/en/docs/marine-weather-api
- **API key**: NOT required
- **Cost**: Free for non-commercial use
- **Rate limits**: Same as Open-Meteo weather (10K/day, 5K/hour, 600/min)
- **Geographic coverage**: Global oceans
- **Commercial use**: NOT on free tier

**Available marine data:**
- **Sea Surface Temperature (SST)** -- hourly snapshots in Celsius
- Wave height, direction, period (mean, wind-driven, swell)
- Swell components (primary, secondary, tertiary)
- Wave peak periods
- Sea level height including tides
- Ocean current velocity and direction
- 7-day forecast
- ERA5-Ocean historical data from 1940 to present

**Data sources:** MeteoFrance, ECMWF, NCEP GFS, DWD ICON Wave
**Resolution:** ~5km (Europe via DWD), ~50km (global reanalysis)

**Pros:** SST included, free, no key, same API as weather
**Cons:** Non-commercial on free tier; coastal accuracy limited (not suitable for navigation-level precision, but fine for "what's the water temp at this beach")

---

### B. NOAA CO-OPS Tides & Currents API (USA - Station-based)

- **URL**: https://api.tidesandcurrents.noaa.gov/api/prod/
- **API key**: NOT required
- **Cost**: Free
- **Rate limits**: Throttled under heavy load; 5 req/sec, 10K req/day recommended for CDO API
- **Geographic coverage**: USA coastal stations only

**Available data:**
- `water_temperature` product -- actual measured temperatures at buoy/station locations
- Air temperature, wind speed/direction, barometric pressure
- Tide predictions, water levels
- Currents

**URL format:**
```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?
  station=9414290&product=water_temperature&date=latest&units=metric&format=json
```

**Pros:** Real measured water temps (not modeled), free, no key
**Cons:** Station-based (not every beach has one), USA only

---

### C. Copernicus Marine Service (CMEMS) (EUROPE - Best Quality)

- **URL**: https://marine.copernicus.eu/ | https://data.marine.copernicus.eu/
- **API key**: Free registration required
- **Cost**: Completely free (EU-funded)
- **Rate limits**: No published quotas for the Copernicus Marine Toolbox
- **Geographic coverage**: Global oceans (excellent European coverage)

**Available SST data:**
- Global OSTIA SST: daily gap-free maps at 0.05 deg (~5.5km) resolution
- Mediterranean Sea high-resolution SST
- Near-real-time observations
- Historical reanalysis data
- Forecast SST data

**Access methods:**
- Copernicus Marine Toolbox (Python API / CLI)
- OPeNDAP for lazy-loading xarray datasets
- Direct file downloads (NetCDF)

**Pros:** Highest quality SST data, specifically excellent for European waters, completely free, no quotas
**Cons:** Designed for batch data access (Python toolbox), not a quick REST API for per-request lookups. Best used to pre-download and cache SST grids, then serve from your own backend.

---

### D. StormGlass API

- **URL**: https://stormglass.io/
- **API key**: Required (free)
- **Rate limits**: 10 requests/day (free tier) -- essentially unusable
- **Data**: Water temperature, waves, currents, wind
- **Note:** Too limited on free tier for production use

---

### Sea Temperature Recommendation

**Best approach (hybrid):**
1. **Open-Meteo Marine API** as primary SST source -- global, free, no key, same call as weather
2. **NOAA CO-OPS** for USA stations -- real measured temperatures at buoy locations
3. **Copernicus CMEMS** for pre-caching high-res European SST grids on your server
4. Cache SST data aggressively (SST changes slowly, 6-12 hour cache is fine)

---

## 4. BEACH SAFETY FLAGS

### Reality Check

**There is NO universal API for beach safety flag status.** This is the hardest data category because:

- Flag status is managed locally by individual lifeguard services, municipalities, or regional authorities
- Flags change multiple times per day based on conditions
- There is no centralized digital reporting system in most countries

### What Exists:

#### USA
- **NOAA Rip Current Forecast Model**: Predicts rip current probability (0-100%) hourly for up to 6 days. Available through NWS forecast products. This is the closest thing to an automated "safety" indicator.
  - URL: https://www.weather.gov/safety/ripcurrent
  - Free, no key

- **USLA (US Lifesaving Association)**: Defines the flag standard but does NOT provide a real-time API
  - Individual beach municipalities sometimes publish flags on their websites (e.g., Volusia County FL, Bay County FL)

#### Europe
- **No centralized API exists**
- Spain: Some municipalities use Telegram channels for flag updates; iPlaya app covers 2000+ Spanish beaches but has no public API
- UK: RNLI provides beach safety info on their website but no documented public API
- France (Pavillon Bleu), Italy, etc.: Flag status managed at municipal level

### Practical Strategy for Your App

Since no API exists, derive a **computed safety score** from available weather/marine data:

1. **Wind speed** (from Open-Meteo/OWM) -- high wind = higher risk
2. **Wave height** (from Open-Meteo Marine API) -- high waves = higher risk
3. **Rip current probability** (from NOAA for USA)
4. **Storm/weather alerts** (from NWS for USA, Open-Meteo for Europe)

Create your own traffic-light system:
- **Green**: Calm winds (<15 km/h), low waves (<0.5m), no alerts
- **Orange**: Moderate winds (15-30 km/h), moderate waves (0.5-1.5m)
- **Red**: Strong winds (>30 km/h), high waves (>1.5m), storm alerts

This is what most beach condition apps actually do -- they derive safety from weather/marine data rather than reading official flags.

---

## 5. BLUE FLAG CERTIFICATION

### A. EU JRC Data Catalogue (BEST STRUCTURED DATA)

- **URL**: https://data.jrc.ec.europa.eu/dataset/336eb078-91f6-4c0c-b536-88355df6c0fd
- **API endpoint**: `https://urban.jrc.ec.europa.eu/api/udp/v2/en/data/?databrick_id=771...`
- **Formats**: JSON, CSV, ODS, HTML
- **API key**: Not required
- **Cost**: Free
- **Coverage**: EU, Iceland, Norway, Switzerland
- **Data**: Blue Flag certifications with geographic coordinates at NUTS0/NUTS2/NUTS3 level
- **Limitation**: Aggregated at administrative region level, not individual beach coordinates

### B. Official Blue Flag Website

- **URL**: https://www.blueflag.global/all-sites
- **No public API** -- the website shows a filterable world map of all Blue Flag sites
- As of 2024: 5,010 Blue Flags worldwide
- Would require web scraping (check their ToS)

### C. Country-Specific Open Data Portals

| Country | Portal | Formats |
|---------|--------|---------|
| Ireland | data.gov.ie/dataset/designated-blue-flag-beach | JSON, WMS, WFS |
| UK | data.gov.uk (search "blue flag beaches") | CSV, download |
| Greece | geodata.gov.gr | CSV, GeoJSON, KML, Shapefile |
| Spain | datos.gob.es | Various |

### D. OpenStreetMap Tags

Many Blue Flag beaches have the tag `award=blue_flag` in OSM. Query via Overpass:
```
[out:json];
(
  way["award"="blue_flag"];
  node["award"="blue_flag"];
);
out center body;
```
**Note:** Coverage is incomplete -- not all Blue Flag beaches are tagged in OSM.

### Blue Flag Recommendation

**Best approach:**
1. Download the JRC dataset (EU coverage) as your baseline
2. Supplement with country-specific open data portals (Ireland, UK, Greece)
3. Cross-reference with OSM `award=blue_flag` tags
4. Manually compile from the official Blue Flag website (blueflag.global/all-sites)
5. Store as a static dataset in your app, update annually (Blue Flag awards are annual)

---

## 6. WATER QUALITY DATA

### A. EEA Bathing Water Quality - WISE BWD (EUROPE - BEST)

- **URL**: https://www.eea.europa.eu/data-and-maps/data/bathing-water-directive-status-of-bathing-water-13
- **DISCODATA REST endpoint**: https://discodata.eea.europa.eu/
- **Map services**: https://water.discomap.eea.europa.eu/arcgis/rest/services/BathingWater
- **API key**: NOT required
- **Cost**: Free
- **Coverage**: 38 European countries, ~22,000 bathing water sites (coastal + inland)
- **Data period**: 1990 to present (annual reporting, May-September season)

**DISCODATA tables available:**
- `[WISE_BWD][latest].assessment_BathingWaterStatus` -- quality classification (Excellent/Good/Sufficient/Poor)
- `[WISE_BWD][latest].timeseries_MonitoringResult` -- actual monitoring measurements
- `[WISE_BWD][latest].spatial_SpatialProtected` -- geographic data
- `[WISE_BWD][latest].timeseries_SeasonalPeriod` -- seasonal data
- `[WISE_BWD][latest].timeseries_Characterisation` -- site characteristics

**Query via SQL-like REST endpoint** (returns JSON):
```
https://discodata.eea.europa.eu/sql?query=SELECT * FROM [WISE_BWD][latest].[assessment_BathingWaterStatus] WHERE ...
```

**Quality classifications:**
- Excellent (blue)
- Good (green)
- Sufficient (yellow)
- Poor (red)

**Pros:** Covers all EU bathing waters, standardized quality ratings, REST API, free, no key
**Cons:** Data is annual (not real-time), reporting lag of ~1 year

---

### B. UK Bathing Water Quality API (UK - EXCELLENT)

- **URL**: https://environment.data.gov.uk/bwq/
- **API Documentation**: https://environment.data.gov.uk/bwq/profiles/help-api.html
- **API key**: NOT required
- **Cost**: Free
- **Coverage**: All designated bathing waters in England
- **Format**: JSON (Linked Data API)

**Available data:**
- Water quality classifications (Excellent/Good/Sufficient/Poor)
- E. coli and intestinal enterococci measurements
- Sampling dates and results
- Beach profiles and risk assessments
- Pollution risk forecasts

**Pros:** Well-documented REST API, JSON responses, no key, real-time-ish data
**Cons:** England only

---

### C. US EPA BEACON System (USA)

- **URL**: https://www.epa.gov/waterdata/beacon-20-beach-advisory-and-closing-online-notification
- **Web interface**: https://watersgeo.epa.gov/beacon2
- **API key**: NOT required
- **Cost**: Free
- **Coverage**: 6,000+ US coastal and Great Lakes beaches

**Available data:**
- Beach monitoring results (E. coli, enterococci)
- Advisory and closure notifications
- Beach locations with coordinates
- Monitoring station locations

**Limitation:** Data is reported annually by states (not real-time). Monitoring data updated within 10 minutes of WQX submission, but states only submit once a year minimum. BEACON has historical data, not necessarily current-season advisories.

---

### D. US Water Quality Portal (WQP)

- **URL**: https://www.waterqualitydata.us/
- **API docs**: https://www.waterqualitydata.us/webservices_documentation/
- **API key**: NOT required
- **Cost**: Free
- **Rate limits**: No published limits (supports queries up to 250K sites)
- **Coverage**: USA + territories (EPA + USGS + 400+ agencies)

**Base URL**: `https://www.waterqualitydata.us/data/`

**Endpoints:**
- `/Station/search` -- site locations
- `/Result/search` -- measurement results
- `/Activity/search` -- collection events

**Filter by:** Bounding box, state, county, site type, characteristic name, date range
**Formats:** XML, CSV, TSV, XLSX, GeoJSON, KML

**Pros:** Massive dataset, REST API, many formats, no key, no published rate limits
**Cons:** Complex data model, includes all water quality (not beach-specific), requires filtering

---

### Water Quality Recommendation

**Europe:** Use EEA DISCODATA as primary source -- covers 38 countries, standardized quality ratings, REST API. Supplement with UK Bathing Water Quality API for England-specific data.

**USA:** Use EPA BEACON data for beach-specific monitoring. Supplement with WQP for detailed measurements.

**Strategy:** Pre-download water quality classifications for all beaches. Store as a static layer, update annually when new EEA/EPA data is published. Display quality rating (Excellent/Good/Sufficient/Poor) on each beach profile.

---

## 7. REAL-TIME BEACH FLAGS (Red/Green/Yellow/Orange)

### Reality Check (Updated Research)

**There is NO universal global API for real-time beach lifeguard flag status.** Flag management is inherently local -- lifeguards physically raise/lower flags based on on-the-ground conditions. However, there are more data sources than initially expected:

---

### A. USA: NOAA Marine Beach Forecast (BEST USA SOURCE)

- **MapServer**: https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/marine_beachforecast/MapServer
- **FeatureServer**: https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/marine_beachforecast_summary/FeatureServer
- **Summary MapServer**: https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/marine_beachforecast_summary/MapServer
- **Visual Experience**: https://experience.arcgis.com/experience/4403e4e108914ab39b1eaf04a6fafd36
- **API key**: NOT required
- **Cost**: Free (US government public data)
- **Format**: ArcGIS REST API returning JSON, GeoJSON, PBF
- **Commercial use**: Yes (public domain)
- **Coverage**: All US coastal beaches -- Atlantic, Pacific, Gulf Coast, Great Lakes, Hawaii, Puerto Rico, Guam

**This is NOT actual lifeguard flag data but it IS the closest programmatic equivalent for the USA.**

**Data fields per beach zone (verified from live API):**
- `beachname`: Descriptive name (e.g., "Santa Barbara County Southeastern Coast Beaches")
- `rip`: Rip current risk level -- "Low", "Moderate", "High"
- `surf`: Wave height (e.g., "2 to 4 feet")
- `wtemp`: Water temperature (e.g., "60 to 62 degrees")
- `uv`: UV Index risk
- `maxtemp`: Air temperature
- `weather`: Conditions forecast
- `winds`: Wind forecast
- `tstorm`: Thunderstorm risk
- `wspout`: Waterspout risk
- `productdat`/`producttim`: Forecast date/time
- `period`: "Today" / "Tomorrow"
- `sitename`: NWS Weather Forecast Office name
- Polygon geometry (beach zone boundaries)

**How it works:**
- 130+ layers organized by NWS Weather Forecast Office (WFO)
- Day 1 and Day 2 forecasts per WFO
- Summary layers aggregate to 3 layers: Day1, Day2, Max 48-Hour Risk
- Swim risk is categorized: Low (gray), Moderate (yellow), High (red)
- Updated multiple times daily by NWS forecasters

**Query example (all beaches, Day 1):**
```
https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/marine_beachforecast_summary/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson
```

**Per-WFO query (e.g., Los Angeles area, Layer ID 64):**
```
https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/marine_beachforecast/MapServer/64/query?where=1%3D1&outFields=*&f=pjson
```

**Practical integration**: HIGH. This is a well-structured REST API with JSON/GeoJSON output, no key needed, no rate limit published. You can map the rip current risk directly to a traffic-light color system.

---

### B. Spain: Catalonia Proteccio Civil Beach API (REAL FLAG DATA!)

- **Beaches endpoint**: https://platges.interior.gencat.cat/api/platges
- **Today's flag status**: https://platges.interior.gencat.cat/api/estats/today
- **Coasts**: https://platges.interior.gencat.cat/api/costes
- **Municipalities**: https://platges.interior.gencat.cat/api/municipis
- **API key**: NOT required
- **Cost**: Free (Catalan government)
- **Format**: JSON
- **Commercial use**: Likely yes (government open data), verify ToS
- **Coverage**: ~250 beaches on the Catalan coast (Costa Brava, Maresme, Barcelones, Garraf, Costa Daurada)

**This is ACTUAL real-time flag data** from Proteccio Civil (Civil Protection).

**Beach data fields (verified from live API):**
- `Platja`: Beach name
- `Coordenades`: Coordinates (e.g., "40.82407100,0.736152000")
- `Municipi`: Municipality
- `Costa`: Coast region
- `Dutxes`: Showers (boolean)
- `Vaters`: Toilets (boolean)
- `Aparcament`: Parking (boolean)
- `Bars`, `Restaurants`: Food availability
- `Socorristes`: Lifeguards (boolean)
- `AccessDiscapacitats`: Disability access
- `BanderaBlava`: Blue Flag status
- `Vigilancia`: Surveillance status
- Plus: parasol rental, lounger rental, WiFi, webcam, megaphone, adapted facilities

**Flag status** comes from the `/api/estats/today` endpoint (empty in off-season, populated during summer beach season ~June-September).

**Practical integration**: HIGH for Catalonia. This is a gold-standard example of what a beach flag API should look like. Limited to one Spanish region, but proves the model exists.

---

### C. Spain: Cruz Roja (Red Cross) Beach Data

- **URL**: https://www.cruzroja.es/appjv/consPlayas/listaPlayas.do
- **URL**: http://jav.cruzroja.es/crmaps/inicio.do?app=playas
- **Format**: Web page (not API)
- **Coverage**: ~43+ beaches operated by Red Cross across Spain
- **Data**: Beach names, municipalities, provinces. Individual beach pages may show flag status.

**Practical integration**: LOW. No public API. Data is web-only. Would require scraping. Limited coverage.

---

### D. Spain: iPlaya App

- **URL**: https://iplaya.es/
- **Coverage**: 2,000+ beaches on Spanish and Portuguese coasts
- **Data source**: AEMET (Spanish meteorological agency)
- **Data**: Weather forecasts, water temperature, wave conditions, tides, UV index
- **Public API**: None documented
- **Note**: Uses AEMET data rather than actual lifeguard flag reports

**Practical integration**: NONE (no API). But confirms AEMET is a data source for derived beach conditions in Spain.

---

### E. France: Infoplages

- **URL**: https://www.infoplages.com/
- **Coverage**: French coastal beaches (municipalities that subscribe)
- **Data**: Water quality, flag color status, weather conditions
- **Public API**: NOT documented
- **Note**: This is a B2G (business-to-government) platform for municipalities. Not open data.

**Practical integration**: NONE (no public API).

---

### F. France: data.gouv.fr Bathing Season Data

- **URL**: https://www.data.gouv.fr/datasets/donnees-de-rapportage-de-la-saison-balneaire-1
- **URL**: https://baignades.sante.gouv.fr/
- **Coverage**: All designated bathing sites in France
- **Data**: Water quality monitoring, bathing prohibitions, pollution events, site characteristics
- **Format**: Downloadable datasets (CSV)
- **API key**: Not required
- **Cost**: Free (government open data)
- **Commercial use**: Yes (Licence Ouverte / Open License)

**Note**: This covers water quality and bathing prohibitions, NOT daily flag colors. Flags in France are managed locally by mairies (town halls) and SDIS (fire/rescue services) with no centralized digital reporting system.

**Practical integration**: MEDIUM for water quality overlay; NONE for live flag status.

---

### G. UK: RNLI Beach Safety

- **URL**: https://rnli.org/safety/beach-safety
- **Coverage**: 240+ beaches patrolled by RNLI lifeguards in UK and Channel Islands
- **Public API**: NOT documented
- **Data on website**: Beach profiles, safety information, lifeguard patrol seasons
- **Note**: RNLI provides excellent content on their website but no documented REST API for real-time flag status

**Practical integration**: NONE (no API). RNLI beach profiles could potentially be scraped for static data (lifeguard season dates, beach characteristics).

---

### H. Beach Flag Aggregators

**No global aggregator API exists.** Searched extensively. The ILS (International Life Saving Federation) defines the flag standard but does not aggregate data. No commercial or open-source service was found that collects real-time flag data from multiple countries.

---

### Beach Flag Strategy Recommendation

**Tier 1 -- Real data (where available):**
1. **USA**: NOAA Marine Beach Forecast API -- swim risk (Low/Moderate/High) mapped to Green/Yellow/Red. Free, no key, REST API with JSON/GeoJSON. Covers all US coasts.
2. **Catalonia (Spain)**: Proteccio Civil API -- actual flag status. Free, no key, JSON. ~250 beaches.

**Tier 2 -- Computed safety score (everywhere else):**
Derive a flag-equivalent from weather/marine data:
- Wind speed + wave height + rip current probability => Green/Yellow/Orange/Red
- Use Open-Meteo Marine API for wave data (global)
- Use NWS alerts for storm warnings (USA)
- Use Meteocat for Catalonia-specific weather

**Tier 3 -- Community/crowdsourced (future feature):**
- Allow users to report current flag color at their beach
- Verify with nearby weather data
- Build your own flag status database over time

---

## 8. BLUE FLAG CERTIFICATION (Expanded Research)

### A. Official Blue Flag Website (blueflag.global)

- **URL**: https://www.blueflag.global/all-sites
- **Coverage**: 4,800+ sites in 49+ countries (as of 2025, Spain alone has 747)
- **Public API**: NONE
- **Data access**: Interactive map with filter by country/region/category
- **Download**: NOT available
- **Note**: Would require web scraping (check ToS). The map loads data dynamically.

### B. Country-Specific Open Data Downloads (with coordinates)

| Country | URL | Format | Coordinates? | Year |
|---------|-----|--------|-------------|------|
| Ireland | https://data.gov.ie/dataset/designated-blue-flag-beach | JSON, WMS, WFS, SHP | Yes | Updated annually |
| UK | https://data.gov.uk/dataset/uk-blue-flag-beaches | CSV | Yes | Discontinued (~2009) |
| Greece | https://geodata.gov.gr/en/dataset/aktes-me-galazia-semaia-2010 | GML, SHP, GeoJSON, KML | Yes | 2010 (dated) |
| Datahub.io | https://old.datahub.io/dataset/blue-flag-beaches | GML, SHP | Yes | 2008 (archived) |

### C. EU JRC Dataset

- **URL**: https://data.jrc.ec.europa.eu/dataset/336eb078-91f6-4c0c-b536-88355df6c0fd
- **Coverage**: EU + Iceland, Norway, Switzerland
- **Limitation**: Aggregated at NUTS administrative region level, NOT per-beach coordinates
- **Useful for**: Regional statistics, not beach-by-beach mapping

### D. OpenStreetMap `award=blue_flag` Tag

- Query via Overpass: `way["award"="blue_flag"];` or `node["award"="blue_flag"];`
- Coverage: Incomplete (only beaches where OSM contributors have added this tag)
- Advantage: Includes exact coordinates and beach geometry

### E. Catalonia API (bonus)

The Catalan Proteccio Civil API (`/api/platges`) includes `BanderaBlava` (Blue Flag) as a boolean field per beach, with coordinates. This is verified live data.

### F. Wikidata

- **URL**: https://www.wikidata.org/wiki/Q458651
- Blue Flag beach is a defined entity in Wikidata
- Individual beaches may be linked to Blue Flag status with coordinates
- Query via SPARQL endpoint

### Blue Flag Recommendation (Updated)

**Best approach for comprehensive coverage:**
1. **Ireland**: Download from data.gov.ie (best quality, coordinates, updated annually)
2. **Catalonia**: Pull from Proteccio Civil API (BanderaBlava field)
3. **OSM**: Query `award=blue_flag` for worldwide coverage (incomplete but free)
4. **blueflag.global**: Manually compile or carefully scrape the interactive map for remaining countries
5. **Spain 2025 list**: 747 Blue Flags -- available from banderaazulplayas.com
6. Store as static dataset, refresh annually when new Blue Flag awards are announced (~May each year)

---

## 9. DOGS ALLOWED ON BEACH

### A. OpenStreetMap `dog=*` Tags (BEST SOURCE)

- **Tag key**: `dog`
- **Wiki**: https://wiki.openstreetmap.org/wiki/Key:dog
- **API**: OSM Overpass API (free, no key)
- **Commercial use**: Yes (ODbL license with attribution)

**Possible tag values:**
| Value | Meaning | Usage |
|-------|---------|-------|
| `dog=yes` | Dogs permitted | Most common |
| `dog=no` | Dogs prohibited | Common |
| `dog=leashed` | Dogs allowed on leash only | Moderate |
| `dog=unleashed` | Dogs allowed off-leash | Less common |
| `dog=designated` | Specifically for dogs (dog beach) | Less common |
| `dog=outside` | Dogs allowed outside only | Rare (restaurants) |

**Conditional restrictions (seasonal rules on beaches):**
```
dog:conditional=no @ (May-Sep)
dog:conditional=unleashed @ (00:00-08:00)
```
This handles the common case where dogs are banned from beaches only during summer season.

**Related alternative tags:**
- `pets=yes/no` -- general pets access
- `pets_allowed=yes/no` -- alternative scheme

**Overpass query for dog-friendly beaches:**
```
[out:json][timeout:90];
(
  way["natural"="beach"]["dog"="yes"];
  node["natural"="beach"]["dog"="yes"];
  way["natural"="beach"]["dog"="designated"];
  node["natural"="beach"]["dog"="designated"];
);
out center body;
```

**Overpass query for beaches where dogs are banned:**
```
[out:json][timeout:90];
(
  way["natural"="beach"]["dog"="no"];
  node["natural"="beach"]["dog"="no"];
);
out center body;
```

**Coverage assessment**: Incomplete. The `dog=*` tag is well-defined but not yet applied to most beaches in OSM. You will get a partial dataset -- strongest in Northern Europe (UK, Netherlands, Germany) where OSM mapping is dense. Weaker in Southern Europe and USA.

### B. OSM Pets Map

- **URL**: https://wiki.openstreetmap.org/wiki/OSM_Pets_Map
- A web tool that visualizes dog/pet tags from OSM data
- Can be used as reference for what data exists

### C. BringFido (Reference Only)

- **URL**: https://www.bringfido.com/attraction/beaches/
- **Coverage**: Extensive listings of dog-friendly beaches worldwide
- **API**: NONE (website only)
- **Data**: Beach name, location, dog policy details
- **Note**: Commercial website, no public data export

### D. Catalonia API (bonus)

The Catalan Proteccio Civil beach API does NOT appear to include a dog-friendly field directly, but the comprehensive amenity data could be cross-referenced.

### Dogs-on-Beach Recommendation

**Primary source**: OSM Overpass API querying `dog=yes/no/leashed/designated` on `natural=beach` features. Free, includes coordinates, commercial use allowed.

**Coverage gap mitigation:**
1. Start with OSM data as baseline (partial but structured)
2. Allow users to contribute dog policy info (crowdsource)
3. Cross-reference with municipal beach regulations where available
4. The Catalonia API may be extended in future seasons

**Note**: This is inherently hard to get comprehensively because dog policies vary by municipality and season. OSM is the best structured open data source that exists.

---

## 10. RESTAURANTS/FOOD NEARBY

### A. OpenStreetMap Overpass API (BEST FREE OPTION)

- **URL**: https://overpass-api.de/
- **API key**: NOT required
- **Cost**: Free
- **Rate limits**: ~10K queries/day on public instance
- **Commercial use**: Yes (ODbL with attribution)
- **Coverage**: Worldwide

**Overpass query for restaurants within 500m of a coordinate:**
```
[out:json][timeout:30];
(
  node["amenity"="restaurant"](around:500,43.2965,5.3698);
  way["amenity"="restaurant"](around:500,43.2965,5.3698);
  node["amenity"="cafe"](around:500,43.2965,5.3698);
  way["amenity"="cafe"](around:500,43.2965,5.3698);
  node["amenity"="fast_food"](around:500,43.2965,5.3698);
  way["amenity"="fast_food"](around:500,43.2965,5.3698);
  node["amenity"="bar"](around:500,43.2965,5.3698);
  way["amenity"="bar"](around:500,43.2965,5.3698);
);
out center body;
```

**Available fields**: name, cuisine, phone, website, opening_hours, wheelchair, outdoor_seating, takeaway, delivery, diet:vegetarian, etc.

**Pros**: Free, no key, includes coordinates, rich metadata, commercial use allowed
**Cons**: No ratings/reviews, no photos, data completeness varies by region

---

### B. Geoapify Places API (BEST HOSTED FREE OPTION)

- **URL**: https://apidocs.geoapify.com/docs/places/
- **API key**: Required (free)
- **Cost**: Free tier available
- **Free tier**: 3,000 credits/day (~90K/month), 5 req/sec
- **Commercial use**: YES (with attribution required)
- **Coverage**: Worldwide (uses OSM data + proprietary enrichment)
- **License**: Can cache/store results with no limits

**Restaurant search example:**
```
https://api.geoapify.com/v2/places?categories=catering.restaurant,catering.cafe,catering.fast_food&filter=circle:5.3698,43.2965,500&limit=20&apiKey=YOUR_KEY
```

**Pros**: Clean REST API, JSON responses, 500+ POI categories, caching allowed, commercial use OK
**Cons**: API key required, 3K/day limit on free tier
**Note**: Since Geoapify uses OSM data underneath, Overpass gives you the same data with higher limits. Geoapify adds convenience (structured responses, categories, built-in proximity search).

---

### C. Overture Maps Foundation (BULK FREE DATA)

- **URL**: https://overturemaps.org/
- **Download**: https://overturemaps.org/download/
- **Cost**: Free
- **API key**: NOT required for data download
- **Coverage**: 64+ million POIs worldwide
- **Format**: GeoParquet files on AWS S3 and Azure Blob Storage
- **License**: CDLA Permissive v2 (commercial use allowed, except OSM-derived data which is ODbL)
- **Latest release**: March 2026

**What it is**: A collaborative effort by Amazon, Meta, Microsoft, TomTom to create open map data. The Places theme contains 59+ million POI records not previously available as open data, merged with OSM data.

**Pros**: Massive dataset, includes restaurants/cafes/food, free bulk download, commercial use
**Cons**: Bulk data only (no real-time API for proximity queries), requires your own infrastructure to query, GeoParquet format requires processing

**Practical integration**: HIGH if you pre-process and load into your own database. Perfect for building a local food-near-beach index.

---

### D. Foursquare Places API

- **URL**: https://foursquare.com/products/places-api/
- **API key**: Required
- **Free tier**: $200/month in credits; 10,000 calls/month to Pro endpoints
- **Paid**: Pro fields at tiered pricing; Premium fields (photos, tips, hours, ratings) at $18.75/1K calls
- **Commercial use**: Check ToS (likely yes with credit card on file)
- **Coverage**: Worldwide, strong in urban areas
- **Rate limit**: 50 QPS (sandbox/pay-as-you-go), 100 QPS (enterprise)

**Pros**: Rich data (ratings, tips, photos, hours), good coverage, modern API
**Cons**: Free tier is small (10K calls/month), premium data costs money, credits don't roll over

**Practical integration**: MEDIUM. The $200 credit is generous for development but may not sustain production use without costs. Photos and ratings are premium-only.

---

### E. Google Places API (New)

- **URL**: https://developers.google.com/maps/documentation/places/web-service/
- **API key**: Required
- **Free tier (since March 2025)**: Free monthly usage per SKU:
  - Essentials: 10,000 events/month free
  - Pro: 5,000 events/month free
  - Enterprise: 1,000 events/month free
- **Text Search pricing**: $32-40 per 1,000 requests (depending on fields)
- **Nearby Search**: Similar pricing
- **Commercial use**: Yes
- **Coverage**: Best-in-class worldwide

**IMPORTANT: Google removed the $200/month recurring credit in February 2025.** The new free tier gives per-SKU free events that are much smaller. For restaurant search (Text Search or Nearby Search), you get approximately 5,000 free searches/month.

**Pros**: Best data quality, ratings, reviews, photos, hours, live busy times
**Cons**: No longer meaningfully free for production use. 5K searches/month is very limited. Costs escalate quickly.

**Practical integration**: LOW for a free app. Only viable if you have budget or extremely aggressive caching.

---

### F. Yelp Fusion/Places API

- **URL**: https://business.yelp.com/data/products/places-api/
- **API key**: Required
- **Free tier**: NONE (as of 2024, Yelp sunsetted free commercial API access)
- **Pricing**: Starter $7.99/1K calls, Plus $9.99/1K, Enterprise $14.99/1K
- **Coverage**: Strong in USA, moderate in Europe
- **Commercial use**: Requires license agreement

**Practical integration**: NONE for a free app. Yelp has eliminated free API access entirely.

---

### Restaurant/Food Recommendation

**Best free approach:**
1. **Primary**: OSM Overpass API -- query `amenity=restaurant/cafe/fast_food/bar` within radius of beach coordinates. Free, no key, commercial use OK.
2. **Alternative hosted API**: Geoapify Places API -- 3K credits/day free, commercial use OK, cleaner API.
3. **Bulk enrichment**: Overture Maps Foundation -- download 64M+ POIs, build your own food-near-beach index. Free, commercial use OK.
4. **Cache everything**: One Overpass query per beach for food nearby, cache for 7-30 days (restaurants don't move).

**Avoid**: Google Places (expensive), Yelp (no free tier), Foursquare premium fields (paid).

---

## 11. BEACH AMENITIES (Parking, Toilets, Showers, Wheelchair Access)

### A. OpenStreetMap Tags on Beach Features Themselves

Many beach features in OSM carry amenity tags directly:

| Tag | Meaning | Example Values |
|-----|---------|---------------|
| `toilets=yes/no` | Toilets on/near beach | Boolean |
| `shower=yes/no` | Showers on/near beach | Boolean |
| `supervised=yes/no` | Lifeguard present | Boolean |
| `wheelchair=yes/no/limited` | Wheelchair accessible | Tri-state |
| `parking=yes/no` | Parking available | Boolean |
| `access=yes/no/private` | Public access | Multiple values |
| `fee=yes/no` | Entry fee required | Boolean |
| `nudism=yes/no/designated` | Nudist beach | Multiple values |
| `surface=sand/pebbles/gravel/rock` | Beach material | Multiple values |

**Query beaches with their amenity tags:**
```
[out:json][timeout:90];
(
  way["natural"="beach"]({{bbox}});
);
out center body;
```
Then check each result's tags for `toilets`, `shower`, `wheelchair`, etc.

---

### B. Nearby Amenity Features (Separate OSM Nodes)

Amenities are often mapped as separate nodes near the beach, not as tags on the beach polygon itself. Use the `around` filter to find them:

**Toilets within 200m of a beach coordinate:**
```
[out:json][timeout:30];
node["amenity"="toilets"](around:200,43.2965,5.3698);
out body;
```

**All beach amenities within 300m:**
```
[out:json][timeout:30];
(
  node["amenity"="toilets"](around:300,LAT,LON);
  node["amenity"="shower"](around:300,LAT,LON);
  node["amenity"="parking"](around:300,LAT,LON);
  node["amenity"="restaurant"](around:300,LAT,LON);
  node["amenity"="cafe"](around:300,LAT,LON);
  node["amenity"="drinking_water"](around:300,LAT,LON);
  node["emergency"="lifeguard"](around:300,LAT,LON);
  node["leisure"="playground"](around:300,LAT,LON);
);
out body;
```

**Wheelchair-accessible toilets:**
```
node["amenity"="toilets"]["toilets:wheelchair"="yes"](around:300,LAT,LON);
```

---

### C. Key OSM Amenity Tags for Beach Context

| Feature | OSM Tag | Notes |
|---------|---------|-------|
| Public toilets | `amenity=toilets` | Common, well-mapped |
| Wheelchair toilet | `toilets:wheelchair=yes` | Specialized subtag |
| Beach shower | `amenity=shower` | Includes outdoor beach rinse showers |
| Parking lot | `amenity=parking` | Very well-mapped in OSM |
| Disabled parking | `capacity:disabled=*` | Number of accessible spaces |
| Lifeguard station | `emergency=lifeguard` | Permanent station location |
| Changing room | `amenity=dressing_room` | Less commonly mapped |
| Drinking water | `amenity=drinking_water` | Taps/fountains |
| First aid | `emergency=first_aid_kit` | At some beaches |
| Playground | `leisure=playground` | For family beaches |
| Beach resort amenities | `leisure=beach_resort` | Groups managed beach facilities |

---

### D. Catalonia API (Bonus -- Rich Amenity Data)

The Catalan Proteccio Civil API includes extensive boolean amenity fields per beach:

- `Dutxes` (showers)
- `Vaters` (toilets)
- `Aparcament` (parking)
- `Bars`, `Restaurants`
- `QuioscBegudes` (drink kiosk)
- `LloguerParasols` (parasol rental)
- `LloguerGandules` (lounger rental)
- `Socorristes` (lifeguards)
- `AccessDiscapacitats` (disability access)
- `AparcamentDiscapacitats` (disabled parking)
- `VatersAdaptats` (adapted toilets)
- `DutxesAdaptades` (adapted showers)
- `Vigilancia` (surveillance)
- `TorresVigilancia` (watchtowers)
- `Ambulancies` (ambulance)
- `Wifi`
- `WebCam`
- `Megafonia` (loudspeakers)

This is the richest structured amenity dataset found for any region.

---

### Beach Amenities Recommendation

**Two-pronged approach:**

1. **Tags on beach features**: When you bulk-download beaches from OSM, capture all amenity-related tags (`toilets`, `shower`, `wheelchair`, `supervised`, `parking`, etc.). Many beaches have these directly.

2. **Nearby amenity scan**: For each beach in your database, run a one-time Overpass `around` query (200-300m radius) to find nearby `amenity=toilets`, `amenity=shower`, `amenity=parking`, `emergency=lifeguard` nodes. Cache the results.

3. **Regional enrichment**: Where regional APIs exist (Catalonia), pull the richer amenity data to supplement OSM.

4. **Crowdsource gaps**: Allow users to confirm/add amenity info for beaches they visit.

---

## SUMMARY: RECOMMENDED API STACK

| Category | Primary API | Backup/Supplement | Key Needed? | Daily Limit | Commercial? |
|----------|------------|-------------------|-------------|-------------|-------------|
| **Beach Locations** | OSM Overpass API | Geoapify Places API | No / Yes | 10K / 3K | Yes (ODbL) |
| **Weather (Europe)** | Open-Meteo | OpenWeatherMap | No / Yes | 10K / 33K | No / Yes |
| **Weather (USA)** | NWS weather.gov | Open-Meteo | No (User-Agent) | Unlimited | Yes |
| **Sea Temperature** | Open-Meteo Marine | NOAA CO-OPS (USA) | No / No | 10K / 10K | No / Yes |
| **Sea Temp (Europe)** | Open-Meteo Marine | Copernicus CMEMS | No / Yes (free reg) | 10K / No quota | No / Yes |
| **Beach Flags (USA)** | NOAA Beach Forecast API | Computed from weather/wave | No | No published limit | Yes |
| **Beach Flags (Catalonia)** | Proteccio Civil API | -- | No | No published limit | Yes (gov) |
| **Beach Flags (rest)** | Computed from weather/wave data | -- | -- | -- | -- |
| **Blue Flag** | OSM + country portals | Catalonia API, JRC Dataset | No | Static data | Yes |
| **Dogs on Beach** | OSM `dog=*` tags | Crowdsource | No | 10K (Overpass) | Yes (ODbL) |
| **Restaurants Nearby** | OSM Overpass API | Geoapify, Overture Maps | No / Yes | 10K / 3K | Yes |
| **Beach Amenities** | OSM tags + around query | Catalonia API | No | 10K (Overpass) | Yes (ODbL) |
| **Water Quality (EU)** | EEA DISCODATA | UK BWQ API | No | No limit | Yes |
| **Water Quality (US)** | EPA BEACON + WQP | -- | No | No limit | Yes |

---

## ARCHITECTURE RECOMMENDATIONS

### Caching Strategy (Critical for High Volume)

Since many of these free APIs have daily limits, implement aggressive caching:

1. **Beach database**: One-time bulk download, re-sync monthly. Store in your own DB.
2. **Weather data**: Cache per beach, refresh every 1-2 hours. One API call serves all users viewing that beach.
3. **Sea temperature**: Cache per beach, refresh every 6-12 hours (SST changes slowly).
4. **Beach flags/safety**: Cache per region, refresh every 2-4 hours (NOAA updates ~2x/day; Catalonia API updates during season).
5. **Water quality**: Static dataset, refresh annually.
6. **Blue Flag status**: Static dataset, refresh annually (awards announced ~May).
7. **Dogs allowed**: Static dataset from OSM, refresh monthly. Supplement with crowdsourced data.
8. **Restaurants nearby**: Cache per beach (300m radius), refresh every 7-30 days.
9. **Beach amenities**: One-time scan per beach from OSM, refresh monthly.
10. **Computed safety score**: Re-calculate when weather/marine/flag data refreshes.

### Volume Estimation

With caching, even with 100K daily active users:
- You only need ~5,000 unique beach weather lookups/day (not per-user)
- Open-Meteo's 10K/day handles this easily
- NWS (unlimited) handles all USA weather
- Beach DB is local (no API calls)
- Water quality is static (no API calls)

### Commercial Use Note

If the app is commercial (monetized or has ads):
- Open-Meteo free tier is NON-COMMERCIAL only. Options:
  - Pay for Open-Meteo (EUR 29/month for 1M requests)
  - Use OpenWeatherMap free tier (allows commercial, 1M/month)
  - Self-host Open-Meteo (open source, unlimited)
- All government APIs (NWS, NOAA, EEA, EPA) allow commercial use
- OpenStreetMap data allows commercial use with attribution (ODbL)

---

## KEY API DOCUMENTATION LINKS

| API | Documentation |
|-----|--------------|
| Overpass API | https://wiki.openstreetmap.org/wiki/Overpass_API |
| Overpass Turbo | https://overpass-turbo.eu/ |
| Open-Meteo Weather | https://open-meteo.com/en/docs |
| Open-Meteo Marine | https://open-meteo.com/en/docs/marine-weather-api |
| Open-Meteo Pricing | https://open-meteo.com/en/pricing |
| OpenWeatherMap | https://openweathermap.org/api |
| OWM Pricing | https://openweathermap.org/price |
| NWS API | https://weather-gov.github.io/api/ |
| NOAA CO-OPS | https://api.tidesandcurrents.noaa.gov/api/prod/ |
| NOAA CDO | https://www.ncdc.noaa.gov/cdo-web/webservices/v2 |
| Copernicus Marine | https://marine.copernicus.eu/ |
| CMEMS Data Store | https://data.marine.copernicus.eu/products |
| EEA DISCODATA | https://discodata.eea.europa.eu/ |
| EEA Bathing Water | https://www.eea.europa.eu/data-and-maps/data/bathing-water-directive-status-of-bathing-water-13 |
| UK BWQ API | https://environment.data.gov.uk/bwq/ |
| EPA BEACON | https://www.epa.gov/waterdata/beacon-20-beach-advisory-and-closing-online-notification |
| Water Quality Portal | https://www.waterqualitydata.us/ |
| WQP API Docs | https://www.waterqualitydata.us/webservices_documentation/ |
| JRC Blue Flag Data | https://data.jrc.ec.europa.eu/dataset/336eb078-91f6-4c0c-b536-88355df6c0fd |
| Blue Flag Official | https://www.blueflag.global/all-sites |
| Ireland Blue Flag Data | https://data.gov.ie/dataset/designated-blue-flag-beach |
| Geoapify Places | https://apidocs.geoapify.com/docs/places/ |
| Geoapify Pricing | https://www.geoapify.com/pricing/ |
| StormGlass | https://stormglass.io/ (10 req/day free -- reference only) |
| **New: Beach Flags & Safety** | |
| NOAA Beach Forecast MapServer | https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/marine_beachforecast/MapServer |
| NOAA Beach Forecast Summary | https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/marine_beachforecast_summary/MapServer |
| NOAA Beach Forecast FeatureServer | https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/marine_beachforecast_summary/FeatureServer |
| NOAA Beach Forecast Visual | https://experience.arcgis.com/experience/4403e4e108914ab39b1eaf04a6fafd36 |
| NOAA NWS Surf Zone Forecasts | https://www.weather.gov/safety/ripcurrent-forecasts |
| Catalonia Beach API (beaches) | https://platges.interior.gencat.cat/api/platges |
| Catalonia Beach API (flags today) | https://platges.interior.gencat.cat/api/estats/today |
| Catalonia Beach Viewer | https://interior.gencat.cat/ca/arees_dactuacio/proteccio_civil/estatplatges/ |
| Platges Cat (water quality) | https://aplicacions.aca.gencat.cat/platgescat2/front/landing |
| France Bathing Data | https://www.data.gouv.fr/datasets/donnees-de-rapportage-de-la-saison-balneaire-1 |
| France Bathing Water Quality | https://baignades.sante.gouv.fr/ |
| Spain iPlaya | https://iplaya.es/ (no API -- reference only) |
| Spain Cruz Roja Beaches | https://www.cruzroja.es/appjv/consPlayas/listaPlayas.do (no API -- reference only) |
| RNLI Beach Safety | https://rnli.org/safety/beach-safety (no API -- reference only) |
| **New: Dogs on Beach** | |
| OSM dog=* tag wiki | https://wiki.openstreetmap.org/wiki/Key:dog |
| OSM Pets Map | https://wiki.openstreetmap.org/wiki/OSM_Pets_Map |
| OSM taginfo dog=yes | https://taginfo.openstreetmap.org/tags/dog=yes |
| **New: Restaurants Nearby** | |
| Overture Maps Foundation | https://overturemaps.org/ |
| Overture Maps Download | https://overturemaps.org/download/ |
| Foursquare Places API | https://foursquare.com/products/places-api/ |
| Foursquare Pricing | https://foursquare.com/pricing/ |
| Google Places API (New) | https://developers.google.com/maps/documentation/places/web-service/ |
| Google Maps Pricing (March 2025) | https://developers.google.com/maps/billing-and-pricing/march-2025 |
| Yelp Places API | https://business.yelp.com/data/products/places-api/ (no free tier) |
| **New: Beach Amenities** | |
| OSM amenity=toilets | https://wiki.openstreetmap.org/wiki/Tag:amenity=toilets |
| OSM amenity=shower | https://wiki.openstreetmap.org/wiki/Tag:amenity=shower |
| OSM amenity=parking | https://wiki.openstreetmap.org/wiki/Tag:amenity=parking |
| OSM wheelchair key | https://wiki.openstreetmap.org/wiki/Key:wheelchair |
| OSM beach_resort tag | https://wiki.openstreetmap.org/wiki/Tag:leisure=beach_resort |
