# Tile2Net Evaluation Visualization

Interactive web-based visualization for analyzing tile2net pedestrian network detection results.

## Overview

This visualization tool provides three main views for evaluating ML-detected pedestrian networks against OSM ground truth:

1. **Confusion Matrix View**: Displays true positives, false positives, and false negatives as overlaid GeoJSON layers
2. **Tile Heatmap View**: Colors individual tiles based on selected performance metrics
3. **Scatter Plot Analysis**: Explores correlations between area composition and performance metrics

## Features

### Sample Selection
- Switch between different datasets (Boston Common, Times Square)
- Data loads dynamically when sample is changed

### Map Views

#### Confusion Matrix View
- **True Positives (Green)**: ML network segments within polygons that match OSM ground truth
- **False Positives (Orange)**: ML network segments within polygons with no OSM match
- **False Negatives (Red)**: OSM path segments outside all ML polygons
- **ML Polygons (Blue)**: Detected pedestrian areas
- **OSM Ground Truth (Gray)**: OpenStreetMap pedestrian paths
- Interactive layer control to show/hide individual layers

#### Tile Heatmap View
- Color-coded tiles based on selected metric:
  - F1 Score
  - Precision
  - Recall
  - IoU
  - TP/FP/FN Length
- Click any tile to see:
  - Satellite imagery
  - All performance metrics
  - Area composition breakdown
  - Detection counts

### Base Map Options
- **Satellite Imagery**: Original aerial imagery tiles used for ML detection
- **OpenStreetMap**: Standard OSM tiles for geographic context

### Scatter Plot Analysis
- Select X and Y axes from available metrics:
  - Performance: F1 Score, Precision, Recall, IoU
  - Lengths: TP, FP, FN lengths
  - Area Composition: Buildings %, Roads %, Green Spaces %, etc.
- Points colored by F1 Score (red = low, green = high)
- Click any point to open detailed tile information with imagery

### Global Statistics
- Overall performance metrics (F1, Precision, Recall, IoU)
- Total lengths for TP/FP/FN
- ML and OSM network statistics
- Polygon coverage information

## Usage

### Setup

1. Ensure your data is structured as:
   ```
   visml/
   ├── visualization/
   │   ├── index.html
   │   └── app.js
   ├── boston_common/
   │   └── tiles/
   │       └── static/
   │           └── ma/
   │               └── 256_19/
   │                   └── *.jpg
   ├── boston_common_output/
   │   ├── confusion_matrix_global_polygon_based.json
   │   ├── confusion_matrix_per_tile_polygon_based.json
   │   ├── true_positives_polygon_based.geojson
   │   ├── false_positives_polygon_based.geojson
   │   ├── false_negatives_polygon_based.geojson
   │   ├── ml_polygons.geojson
   │   └── osm_ground_truth.geojson
   ├── times_square/
   │   └── ...
   └── times_square_output/
       └── ...
   ```

2. Start a local web server in the `visml` directory:
   ```bash
   cd /Users/austinhuang/Downloads/visml
   python3 -m http.server 8000
   ```

3. Open your browser to:
   ```
   http://localhost:8000/visualization/
   ```

### Workflow

1. **Select Sample**: Choose between available datasets using the dropdown
2. **Choose Base Map**: Toggle between satellite imagery and OSM tiles
3. **Explore Map Views**:
   - Start with Confusion Matrix view to see overall detection quality
   - Switch to Tile Heatmap to identify spatial patterns in performance
   - Select different metrics to explore various aspects
4. **Analyze Correlations**:
   - Use scatter plot to find relationships between area composition and performance
   - Click points to investigate specific tiles
5. **Review Statistics**: Check global metrics at the bottom

## Data Requirements

### Required Files per Sample

**Output folder** (`{sample}_output/`):
- `confusion_matrix_global_polygon_based.json`: Global performance metrics
- `confusion_matrix_per_tile_polygon_based.json`: Per-tile metrics with area composition
- `true_positives_polygon_based.geojson`: TP network segments
- `false_positives_polygon_based.geojson`: FP network segments
- `false_negatives_polygon_based.geojson`: FN network segments
- `ml_polygons.geojson`: Detected pedestrian polygons
- `osm_ground_truth.geojson`: OSM reference paths

**Tiles folder** (`{sample}/tiles/static/{region}/256_19/`):
- Satellite imagery tiles named `{xtile}_{ytile}.jpg`

## Metrics Explained

### Performance Metrics
- **F1 Score**: Harmonic mean of precision and recall (0-1, higher is better)
- **Precision**: TP / (TP + FP) - Accuracy of ML predictions
- **Recall**: TP / (TP + FN) - Coverage of ground truth
- **IoU**: Intersection over Union - Overall overlap quality

### Confusion Matrix Components
- **TP (True Positive)**: ML network inside polygons matching OSM (meters)
- **FP (False Positive)**: ML network inside polygons with no OSM match (meters)
- **FN (False Negative)**: OSM paths outside all ML polygons (meters)

### Area Composition
- **Buildings %**: Percentage of tile covered by buildings
- **Roads %**: Road surface area (buffered by estimated width)
- **Pedestrian Areas %**: Dedicated pedestrian zones
- **Green Spaces %**: Parks, grass, recreation areas
- **Water %**: Water bodies and waterways
- **Railways %**: Rail tracks (buffered)
- **Parking %**: Parking lots/areas
- **Unmapped %**: Area not covered by any category

## Technical Details

### Libraries Used
- **Leaflet.js 1.9.4**: Interactive maps
- **Plotly.js 2.27.0**: Scatter plots
- **Vanilla JavaScript**: No framework dependencies

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript ES6+ required
- No Internet Explorer support

### Performance Considerations
- GeoJSON files are loaded asynchronously
- Satellite imagery tiles use image overlays (may take time to load)
- Large datasets (>100 tiles) may experience slight lag in scatter plot interactions

## Troubleshooting

### Map doesn't load
- Check browser console for errors
- Verify file paths match your directory structure
- Ensure local server is running

### Satellite imagery missing
- Verify tile path matches sample name
- Check that `.jpg` files exist in correct directory
- Region path differs: `ma` for boston_common, `nyc` for times_square

### GeoJSON layers not showing
- Confirm all required `.geojson` files exist in output folder
- Check file permissions
- Verify JSON is valid (use JSONLint if needed)

### Scatter plot click doesn't work
- Make sure Plotly.js loaded correctly
- Check browser console for JavaScript errors
- Try refreshing the page

## Adding New Samples

To add a new sample (e.g., `central_park`):

1. Create data structure:
   ```
   central_park/
   └── tiles/
       └── static/
           └── {region}/
               └── 256_19/
                   └── *.{jpg|png}  # Tile images
   central_park_output/
   └── [all required JSON/GeoJSON files]
   ```

2. Add configuration to `app.js` (at the top, in `sampleConfig`):
   ```javascript
   const sampleConfig = {
       'boston_common': {
           tilePath: '../boston_common/tiles/static/ma/256_19',
           imageExtension: 'jpg'
       },
       'times_square': {
           tilePath: '../times_square/tiles/static/nyc/256_19',
           imageExtension: 'png'
       },
       'central_park': {
           tilePath: '../central_park/tiles/static/nyc/256_19',
           imageExtension: 'png'  // Use 'jpg' or 'png' as appropriate
       }
   };
   ```

3. Add option to HTML (`index.html`):
   ```html
   <select id="sampleSelect">
       <option value="boston_common">Boston Common</option>
       <option value="times_square">Times Square</option>
       <option value="central_park">Central Park</option>
   </select>
   ```

**Note**: The visualization automatically handles different image formats (`.jpg` or `.png`) based on the configuration. Each sample can use its own image format.

## License

This visualization tool is part of the visML project for evaluating tile2net pedestrian network detection.
