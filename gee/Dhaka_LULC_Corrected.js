// ============================================================
// DHAKA DISTRICT — LULC CHANGE DETECTION & MARKOV PREDICTION
// Corrected Full Script
// Manuscript: EJRS-D-25-00228
//
// CORRECTIONS FROM ORIGINAL:
// 1. Fixed train/test split overlap (testingSet threshold 0.3 → 0.7)
// 2. Replaced ratio-based pseudo-Markov with proper pixel-by-pixel
//    cross-tabulation transition probability matrix
// 3. Renamed all print labels from "Training Year" to accurate descriptions
// ============================================================


// ============================================================
// SECTION 1: STUDY AREA
// ============================================================

var admin = ee.FeatureCollection("FAO/GAUL/2015/level2");

var dhaka = admin
  .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'))
  .filter(ee.Filter.eq('ADM2_NAME', 'Dhaka'));

Map.centerObject(dhaka, 10);
Map.addLayer(dhaka, {}, 'Dhaka District');

var roi = dhaka;


// ============================================================
// SECTION 2: CLASS DEFINITIONS & PALETTE
// ============================================================

var classNamesDict = ee.Dictionary({
  0: 'Water',
  1: 'Built_Up',
  2: 'Green_Area'
});

var landcoverPalette = [
  '#0c2c84', // 0 = Water
  '#dfff0b', // 1 = Built-up
  '#008000'  // 2 = Green area
];


// ============================================================
// SECTION 3: LANDSAT COMPOSITING FUNCTION
// ============================================================

var decades = [
  {
    label: '2015',
    start: '2015-01-01',
    end:   '2015-12-31',
    sensor: 'LANDSAT/LC08/C02/T1_L2'
  },
  {
    label: '2025',
    start: '2025-01-01',
    end:   '2025-12-31',
    sensor: 'LANDSAT/LC09/C02/T1_L2'
  }
];

/**
 * Builds an annual median composite for a given date range and sensor.
 * Applies USGS Collection 2 Level-2 scaling factors:
 *   Surface Reflectance = DN × 0.0000275 + (−0.2)
 * Clouds and cloud shadows are masked using the QA_PIXEL band.
 */
function getLandsatComposite(start, end, sensor) {
  var collection = ee.ImageCollection(sensor)
    .filterDate(start, end)
    .filterBounds(roi)
    .filterMetadata('CLOUD_COVER', 'less_than', 20)
    .map(function(image) {
      // --- Cloud & shadow mask using QA_PIXEL ---
      var qa = image.select('QA_PIXEL');
      // Bit 3 = cloud, Bit 4 = cloud shadow
      var cloudMask = qa.bitwiseAnd(1 << 3).eq(0)
                        .and(qa.bitwiseAnd(1 << 4).eq(0));

      // --- Radiometric scaling to surface reflectance ---
      var opticalBands = image.select('SR_B.*')
                              .multiply(0.0000275)
                              .add(-0.2);

      return image
        .addBands(opticalBands, null, true)
        .updateMask(cloudMask);
    });

  return collection.median().clip(roi);
}

// Display composites
decades.forEach(function(decade) {
  var image = getLandsatComposite(decade.start, decade.end, decade.sensor);
  Map.addLayer(image, {
    bands: ['SR_B4', 'SR_B3', 'SR_B2'],
    min: 0.0,
    max: 0.3
  }, 'Landsat Composite ' + decade.label);
});


// ============================================================
// SECTION 4: CLASSIFICATION (CART)
// ============================================================

// --- 4.1 Merge training samples ---
// (Assumes 'water', 'built_up', 'green_area' are pre-defined
//  FeatureCollections with a 'Class' property: 0, 1, 2)
var trainingData = water
  .merge(built_up)
  .merge(green_area);

// --- 4.2 Composite for classifier training (2025 = most recent) ---
var trainingImage = getLandsatComposite(
  '2025-01-01', '2025-12-31', 'LANDSAT/LC09/C02/T1_L2'
);

var bands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];

// --- 4.3 Sample training regions ---
var allSamples = trainingImage.select(bands).sampleRegions({
  collection: trainingData,
  properties: ['Class'],
  scale: 30
});

// --- 4.4 Stratified random 70/30 split ---
// FIX: Original used gte(0.3) for testingSet, causing ~40% overlap.
// Correct split: training = random < 0.7, testing = random >= 0.7
var withRandom  = allSamples.randomColumn('random', 42); // seed=42 for reproducibility
var trainingSet = withRandom.filter(ee.Filter.lt('random', 0.7));
var testingSet  = withRandom.filter(ee.Filter.gte('random', 0.7)); // CORRECTED from 0.3

print('Training sample count:', trainingSet.size());
print('Testing sample count:',  testingSet.size());

// --- 4.5 Train CART classifier ---
var classifier = ee.Classifier.smileCart().train({
  features:        trainingSet,
  classProperty:   'Class',
  inputProperties: bands
});

// --- 4.6 Validate on independent test set ---
// FIX: Renamed from "Training Year" to accurate label
var validated       = testingSet.classify(classifier);
var confusionMatrix = validated.errorMatrix('Class', 'classification');

print('=== CLASSIFICATION ACCURACY (Independent Validation Set — 2025) ===');
print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa Coefficient:', confusionMatrix.kappa());
print('Consumers Accuracy (User Accuracy — per column):', confusionMatrix.consumersAccuracy());
print('Producers Accuracy (per row):', confusionMatrix.producersAccuracy());


// ============================================================
// SECTION 5: CLASSIFY BOTH YEARS & DISPLAY
// ============================================================

function classifyYear(decade) {
  var image      = getLandsatComposite(decade.start, decade.end, decade.sensor);
  var classified = image.select(bands).classify(classifier);

  Map.addLayer(classified, {
    min: 0, max: 2,
    palette: landcoverPalette
  }, 'LULC ' + decade.label);

  return classified;
}

var classified2015 = classifyYear(decades[0]);
var classified2025 = classifyYear(decades[1]);


// ============================================================
// SECTION 6: AREA CALCULATION PER CLASS
// ============================================================

function getAreaKm2(classifiedImage, yearLabel) {
  var histogram = classifiedImage.reduceRegion({
    reducer:   ee.Reducer.frequencyHistogram(),
    geometry:  roi.geometry(),
    scale:     30,
    maxPixels: 1e13
  });

  var classDict = ee.Dictionary(histogram.get('classification'));
  var keys      = classDict.keys();

  var features = keys.map(function(k) {
    var count   = ee.Number(classDict.get(k));
    var areaSqKm = count.multiply(0.0009); // 900 m² per pixel → km²
    var label   = classNamesDict.get(ee.Number.parse(k));
    return ee.Feature(null, {
      year:     yearLabel,
      class_id: ee.Number.parse(k),
      class:    label,
      area_km2: areaSqKm
    });
  });

  return ee.FeatureCollection(features);
}

var area2015FC = getAreaKm2(classified2015, '2015');
var area2025FC = getAreaKm2(classified2025, '2025');

print('=== LULC AREA 2015 (km²) ===', area2015FC);
print('=== LULC AREA 2025 (km²) ===', area2025FC);

// Bar charts
[{fc: area2015FC, year: '2015'}, {fc: area2025FC, year: '2025'}]
  .forEach(function(item) {
    var chart = ui.Chart.feature.byFeature({
      features:    item.fc,
      xProperty:   'class',
      yProperties: ['area_km2']
    })
    .setChartType('ColumnChart')
    .setOptions({
      title:  'Land Cover Area in Dhaka (' + item.year + ')',
      hAxis:  { title: 'Land Cover Class' },
      vAxis:  { title: 'Area (km²)' },
      legend: { position: 'none' },
      colors: landcoverPalette
    });
    print(chart);
  });


// ============================================================
// SECTION 7: PROPER MARKOV CHAIN TRANSITION MATRIX
// ============================================================
//
// FIX: Original script divided 2025 histogram by 2015 histogram,
// which produces a net-change ratio — NOT a transition matrix.
// A valid Markov transition matrix requires knowing, for every pixel,
// which class it was in 2015 AND which class it became in 2025.
// This is achieved by stacking both classified images and computing
// a cross-tabulation (errorMatrix) between them.
//
// Matrix structure (rows = 2015 class, columns = 2025 class):
//   Row 0 = Water pixels in 2015  → distributed across 2025 classes
//   Row 1 = Built-up pixels in 2015
//   Row 2 = Green area pixels in 2015
// ============================================================

// --- 7.1 Sample paired pixels from both classified maps ---
var pairedImage = classified2015.rename('class2015')
                   .addBands(classified2025.rename('class2025'));

var pairedSample = pairedImage.sample({
  region:    roi.geometry(),
  scale:     30,
  numPixels: 100000, // large sample for stable probability estimates
  seed:      42,
  geometries: false
});

print('Paired sample size for Markov matrix:', pairedSample.size());

// --- 7.2 Build transition matrix ---
// Rows = 2015 class (actual), Columns = 2025 class (predicted)
var transitionMatrix = pairedSample.errorMatrix('class2015', 'class2025');
print('=== MARKOV TRANSITION COUNTS (rows=2015, cols=2025) ===');
print(transitionMatrix);

// --- 7.3 Convert counts to row-normalised probabilities ---
// Each row sums to 1.0, giving the probability that a pixel
// of class i in 2015 transitions to class j by 2025.
var transArray  = transitionMatrix.array();          // 3×3 array of counts
var rowSums     = transArray.reduce(ee.Reducer.sum(), [1]); // sum each row
var probMatrix  = transArray.divide(rowSums.repeat(1, 3));  // row-normalise

print('=== MARKOV TRANSITION PROBABILITY MATRIX ===');
print('(rows = from-class in 2015, cols = to-class in 2025)');
print('Row 0 = Water | Row 1 = Built-up | Row 2 = Green area');
print(probMatrix);

// --- 7.4 Get 2025 class pixel counts as column vector ---
var hist2025 = ee.Dictionary(
  classified2025.reduceRegion({
    reducer:   ee.Reducer.frequencyHistogram(),
    geometry:  roi.geometry(),
    scale:     30,
    maxPixels: 1e13
  }).get('classification')
);

// Build state vector [water_count, builtup_count, green_count]
var stateVector2025 = ee.Array([
  ee.Number(hist2025.get('0')),
  ee.Number(hist2025.get('1')),
  ee.Number(hist2025.get('2'))
]);

print('=== 2025 STATE VECTOR (pixel counts per class) ===');
print(stateVector2025);

// --- 7.5 Apply one Markov step: state2035 = probMatrix^T × state2025 ---
// Matrix multiply: [3×3] transposed × [3×1] = [3×1] predicted counts
var state2035 = probMatrix.transpose()
                           .matrixMultiply(stateVector2025.reshape([3, 1]))
                           .reshape([3]);

// Convert to km²
var area2035 = state2035.multiply(0.0009);

print('=== PREDICTED 2035 PIXEL COUNTS (Markov) ===');
print(state2035);
print('=== PREDICTED 2035 AREA (km²) ===');
print(area2035);

// --- 7.6 Build FeatureCollection for chart & export ---
var classLabels = ['Water', 'Built_Up', 'Green_Area'];
var area2035List = area2035.toList();

var pred2035FC = ee.FeatureCollection(
  ee.List.sequence(0, 2).map(function(i) {
    i = ee.Number(i);
    return ee.Feature(null, {
      class:    ee.List(classLabels).get(i),
      area_km2: ee.Number(area2035List.get(i))
    });
  })
);

print('=== PREDICTED LULC AREA 2035 (km²) ===', pred2035FC);

// Bar chart — 2035 prediction
var chart2035 = ui.Chart.feature.byFeature({
  features:    pred2035FC,
  xProperty:   'class',
  yProperties: ['area_km2']
})
.setChartType('ColumnChart')
.setOptions({
  title:  'Predicted Land Cover Area — Dhaka (2035, Markov Chain)',
  hAxis:  { title: 'Land Cover Class' },
  vAxis:  { title: 'Area (km²)' },
  legend: { position: 'none' },
  colors: landcoverPalette
});
print(chart2035);


// ============================================================
// SECTION 8: EXPORTS
// ============================================================

// Classified maps
[
  {image: classified2015, desc: 'Dhaka_LULC_2015'},
  {image: classified2025, desc: 'Dhaka_LULC_2025'}
].forEach(function(item) {
  Export.image.toDrive({
    image:           item.image,
    description:     item.desc,
    folder:          'EarthEngine_Exports',
    fileNamePrefix:  item.desc,
    region:          roi.geometry(),
    scale:           30,
    crs:             'EPSG:4326',
    maxPixels:       1e13
  });
});

// Area tables
Export.table.toDrive({
  collection:     area2015FC,
  description:    'Dhaka_LULC_Area_2015',
  folder:         'EarthEngine_Exports',
  fileNamePrefix: 'dhaka_lulc_area_2015',
  fileFormat:     'CSV'
});

Export.table.toDrive({
  collection:     area2025FC,
  description:    'Dhaka_LULC_Area_2025',
  folder:         'EarthEngine_Exports',
  fileNamePrefix: 'dhaka_lulc_area_2025',
  fileFormat:     'CSV'
});

Export.table.toDrive({
  collection:     pred2035FC,
  description:    'Dhaka_LULC_Predicted_2035',
  folder:         'EarthEngine_Exports',
  fileNamePrefix: 'dhaka_lulc_predicted_2035',
  fileFormat:     'CSV'
});


// ============================================================
// SECTION 9: LAND SURFACE TEMPERATURE (MODIS)
// ============================================================

/**
 * Returns a mean daytime LST image in Celsius for a given period.
 * MODIS MOD11A1 scale factor: DN × 0.02 − 273.15
 */
function getModisLST(start, end) {
  var col = ee.ImageCollection('MODIS/061/MOD11A1')
    .filterDate(start, end)
    .filterBounds(roi)
    .select('LST_Day_1km');

  return col.mean()
            .multiply(0.02)
            .subtract(273.15)
            .rename('LST_Celsius')
            .clip(roi);
}

var lstYears = [
  {label: '2015', start: '2015-01-01', end: '2015-12-31', classified: classified2015},
  {label: '2025', start: '2025-01-01', end: '2025-12-31', classified: classified2025}
];

var lstResults = {};

lstYears.forEach(function(item) {
  var lst        = getModisLST(item.start, item.end);
  var urbanMask  = item.classified.eq(1);
  var nonUrbanMask = item.classified.neq(1);

  var urbanLST = lst.updateMask(urbanMask).reduceRegion({
    reducer:   ee.Reducer.mean(),
    geometry:  roi.geometry(),
    scale:     1000,
    maxPixels: 1e13
  }).get('LST_Celsius');

  var nonUrbanLST = lst.updateMask(nonUrbanMask).reduceRegion({
    reducer:   ee.Reducer.mean(),
    geometry:  roi.geometry(),
    scale:     1000,
    maxPixels: 1e13
  }).get('LST_Celsius');

  print('=== LST ' + item.label + ' ===');
  print('  Urban mean LST (°C):',    urbanLST);
  print('  Non-urban mean LST (°C):', nonUrbanLST);

  Map.addLayer(lst, {
    min: 20, max: 40,
    palette: ['blue', 'cyan', 'green', 'yellow', 'red']
  }, 'LST ' + item.label + ' (°C)');

  lstResults[item.label] = {urban: urbanLST, nonUrban: nonUrbanLST};
});

// --- Linear extrapolation to 2035 ---
var u2015 = ee.Number(lstResults['2015'].urban);
var u2025 = ee.Number(lstResults['2025'].urban);
var n2015 = ee.Number(lstResults['2015'].nonUrban);
var n2025 = ee.Number(lstResults['2025'].nonUrban);

var urbanLST2035    = u2025.add(u2025.subtract(u2015));
var nonUrbanLST2035 = n2025.add(n2025.subtract(n2015));

print('=== PROJECTED LST 2035 (linear extrapolation) ===');
print('  Urban mean LST (°C):',    urbanLST2035);
print('  Non-urban mean LST (°C):', nonUrbanLST2035);

// --- LST trend chart ---
var lstFC = ee.FeatureCollection([
  ee.Feature(null, {year: 2015, urban_lst: u2015,        nonurban_lst: n2015}),
  ee.Feature(null, {year: 2025, urban_lst: u2025,        nonurban_lst: n2025}),
  ee.Feature(null, {year: 2035, urban_lst: urbanLST2035, nonurban_lst: nonUrbanLST2035})
]);

var lstChart = ui.Chart.feature.byFeature({
  features:    lstFC,
  xProperty:   'year',
  yProperties: ['urban_lst', 'nonurban_lst']
})
.setChartType('LineChart')
.setOptions({
  title: 'Mean LST in Dhaka — Urban vs. Non-Urban (2015–2035)',
  hAxis: { title: 'Year', format: '####' },
  vAxis: { title: 'Mean LST (°C)' },
  series: {
    0: { color: 'red',   label: 'Urban LST' },
    1: { color: 'green', label: 'Non-Urban LST' }
  },
  pointSize: 5
});
print(lstChart);
