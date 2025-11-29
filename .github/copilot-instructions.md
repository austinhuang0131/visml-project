# Copilot Instructions for visML Project

## Project Overview
**visML** is a pedestrian path detection visualization system that combines ML-detected paths with OpenStreetMap ground truth data. The project has two main components:
1. **Web visualization** (`example/`) - Interactive Leaflet.js map displaying ML predictions vs. OSM ground truth
2. **Analysis notebook** (`analysis_notebook.ipynb`) - Python-based geospatial analysis using GeoPandas/Shapely

## Architecture & Data Flow

### Component Boundaries
- **Frontend Layer** (`example/`): Leaflet.js map with layer management
  - `index.html` - Entry point, loads Leaflet/Turf/shpjs libraries
  - `app.js` - Core data loading and UI orchestration
  - `analysis.js` - Confusion matrix computation (buffer-based matching)
- **Data Layer** (`example/{tiles,network,polygons}/`): Shapefiles + tile imagery
  - Network: Detected pedestrian paths (`.shp`/`.dbf`/`.prj` files)
  - Polygons: Detected pedestrian areas (shapefile format)
  - Tiles: 96 aerial imagery tiles (256x256 px each at zoom level 19)
- **Analysis Layer** (`output/`, `analysis_notebook.ipynb`): GeoPandas-based metrics
  - Computes detailed confusion matrices and GeoJSON outputs
  - Generates per-tile analysis and global summary statistics

### Critical Data Flow
1. **Tile Loading**: CSV (`example_256_info.csv`) → Parse bounds → Create image overlays on map
2. **Shapefile Loading**: Fetch `.shp`/`.dbf`/`.prj` → Parse with `shpjs` → Add to Leaflet layer group
3. **OSM Ground Truth**: Overpass QL query (footways/paths/sidewalks) → GeoJSON → Style by highway type
4. **Confusion Matrix**: Extract features from layers → Buffer by 5m → Calculate intersection/union → Compute TP/FP/FN metrics

### Why This Architecture
- **Shapefile loading in browser** (via `shpjs`): Avoids server-side processing; entire viz runs client-side
- **Buffer-based matching (5m tolerance)**: Accounts for GPS/annotation error; simple and fast enough for analysis
- **Async layer loading with Promise.all**: Parallelizes network/polygons/Overpass loading after tiles are ready
- **Layer group organization**: Easy toggling and isolated error handling per data source

## Key Patterns & Conventions

### JavaScript (Frontend)
1. **Configuration-driven**: See `config` object in `app.js` (bbox, center, zoom, paths) - update here for new datasets
2. **Async/await with error handling**: Each loader (tiles, shapefiles, Overpass) has try/catch + status tracking
3. **Leaflet layer groups**: `layers.tiles`, `layers.network`, `layers.polygons`, `layers.overpass` for isolation
4. **Popup content generation**: Loop through `feature.properties` and build HTML dynamically (e.g., path attributes)
5. **Turf.js operations**: Buffer, intersect, length calculations always check for valid geometry first

### Performance Optimizations (Non-Aspirational)
- **1,000 comparison limit** in confusion matrix: Prevents browser freeze on large datasets
  - See `calculateIntersection()` in `analysis.js` - caps iterations to avoid exponential slowdown
  - Results marked as "approximate: true" if limit hit
- **Disabled visual overlay generation**: TP/FP/FN rendering was removed (too expensive); analysis-only metrics remain
- **Async UI updates**: `setTimeout(fn, 100)` wraps expensive operations to allow UI to respond
- **Progress logging**: Console logs at each stage (feature counts, buffering, intersection computation)

### Python (Analysis Notebook)
1. **GeoPandas for shapefile I/O**: `gpd.read_file(shapefile_path)` handles `.shp` + metadata
2. **Buffer distance as parameter**: `BUFFER_DISTANCE = 5  # meters` set at cell top; all functions use this constant
3. **Geometry validation before operations**: Check `.is_valid` and `.is_empty` to skip bad features
4. **Unary union for aggregation**: `unary_union()` combines multiple geometries before area/length calculations
5. **CSV output for inspection**: Metrics saved as `{tile}_metrics.json` per-tile for debugging

## Integration Points & External Dependencies

### Browser Libraries (see `index.html`)
- **Leaflet 1.9.4**: `https://unpkg.com/leaflet@1.9.4/` - mapping and layer control
- **shpjs**: `https://unpkg.com/shpjs@latest/` - parses `.shp`/`.dbf` buffers in-browser
- **Turf.js 6.5.0**: `https://unpkg.com/@turf/turf@6.5.0/` - buffer, intersect, length calculations
- **Overpass API**: `https://overpass-api.de/api/interpreter` - queries OSM ways within bounding box

### Python Packages (see `analysis_notebook.ipynb` cell 2)
```python
geopandas, shapely, rtree, requests, fiona, pyproj
```
- `rtree` is critical for spatial indexing (required by GeoDataFrame operations)
- `requests` for Overpass API calls from Python notebook

### File Format Dependencies
- **Shapefiles** (network/polygons): Require all 4 files (.shp, .dbf, .prj, .shx) to parse correctly
- **CSV for tiles** (`example_256_info.csv`): Columns: [xtile, ytile, topLeftLon, topLeftLat, bottomRightLon, bottomRightLat]
- **JSON outputs**: GeoJSON for OSM data; JSON for confusion matrix results (precision, recall, F1, IoU)

## Developer Workflows

### Running the Web Visualization
```bash
cd example
python3 -m http.server 8000  # Start local server
# Open http://localhost:8000 in browser
```
- Map loads in order: tiles → network/polygons/Overpass (parallel) → auto-fit bounds
- Analysis button enabled once network + Overpass layers load

### Running the Analysis Notebook
```bash
# Ensure .venv activated
pip install -r requirements.txt  # (if exists) or install packages manually
jupyter notebook analysis_notebook.ipynb
# Or run in VS Code notebook interface
```
- Cells are ordered: imports → config → data loading → shapefile parsing → confusion matrix → per-tile analysis → exports
- Each section can run independently if data paths are correct

### Debugging Tips
- **Network issues**: Check browser console (F12) for Overpass API errors; Overpass has rate limits
- **Shapefile parsing fails**: Verify all 4 files (.shp/.dbf/.prj/.shx) are present; check paths in `config`
- **Analysis hangs**: Monitor console logs; if > 1000 comparisons reached, results are approximate
- **Tile imagery missing**: Verify path structure matches `example_256_info.csv` grid coordinates

## Project-Specific Conventions Differing from Common Practice

1. **Tolerance-first design**: 5m buffer is intentional (GPS/annotation error); not precision-first
2. **No server backend**: All data loading client-side; avoids CORS issues for local development
3. **Approximate metrics acceptable**: Confusion matrix results flagged as "approximate" if comparison limit hit; this is intended behavior, not a bug
4. **Overpass query specificity**: Query includes 8 separate predicates (footway, pedestrian, path, steps, sidewalk variants) to capture all OSM pedestrian infrastructure types
5. **Layer-based modularity**: Each data source (tiles, network, polygons, Overpass) is isolated in its own layer group; enables independent error handling and toggling

## Code Smell Red Flags
- **Missing `.prj` file in shapefile**: Will load but missing projection info; validate with `layer.feature.properties`
- **Overpass query returning 0 elements**: Check bbox format (minLat, minLon, maxLat, maxLon); Overpass is sensitive to coordinate order
- **Browser console warnings about geometry**: Usually means a feature is self-intersecting; filter with `feature.geometry.is_valid` in Python before analysis
- **Analysis button disabled**: Network and Overpass layers must both be loaded (check `loadStatus` in console)

## File Reference for Common Tasks

| Task | Key Files |
|------|-----------|
| Add new dataset | Update `config` in `app.js`; add tile CSV and shapefile directories |
| Change buffer distance | Modify `BUFFER_DISTANCE` constant in `analysis.js` and `analysis_notebook.ipynb` |
| Modify OSM query | Edit Overpass QL in `loadOverpassData()` function in `app.js` (add/remove highway predicates) |
| Change styling | See `networkStyle`, `polygonStyle`, `getStyle()` in `app.js` (color, weight, opacity values) |
| Add new metric | Extend `computeConfusionMatrix()` return object in `analysis.js`; update display logic in `displayResults()` |
| Export results | Check `output/` folder; modify GeoJSON export in last cell of `analysis_notebook.ipynb` |
