# LULC Change Detection and Markov Chain Prediction — Dhaka District

## Overview

This repository contains all code associated with the manuscript:

> Khan, N.I. (2025). Prediction of Land Use and Land Cover Changes in
> Dhaka City Using Markov Chain Analysis on Google Earth Engine.
> *The Egyptian Journal of Remote Sensing and Space Sciences*.
> Manuscript ID: EJRS-D-25-00228.

The study maps land use and land cover (LULC) change in Dhaka District,
Bangladesh between 2015 and 2025 using Landsat 8/9 OLI imagery and a
CART classifier in Google Earth Engine, and projects LULC distribution
for 2035 using a first-order Markov chain model under a
business-as-usual scenario.

---

## Key Results

| LULC Class | 2015 (km²) | 2025 (km²) | 2035 Projected (km²) |
|---|---|---|---|
| Water | 467.97 | 275.97 | 162.75 |
| Built-up | 524.30 | 825.21 | 1,298.41 |
| Green area | 618.93 | 510.02 | 420.28 |

**Classification accuracy (independent validation):**
Overall Accuracy = 95.9% | Kappa = 0.92

---

## Repository Structure

```
gee/        Google Earth Engine JavaScript script for image
            preprocessing, CART classification, and Markov
            chain prediction
R/          R code for LULC bar chart figures (ggplot2)
data/       Training sample FeatureCollections (GeoJSON)
results/    Accuracy report and LULC area statistics (CSV)
figures/    Exported bar charts and workflow diagram
```

---

## How to Use the GEE Script

1. Go to [code.earthengine.google.com](https://code.earthengine.google.com)
2. Create a new script
3. Copy and paste the contents of `gee/Dhaka_LULC_Corrected.js`
4. In the script, replace the `water`, `built_up`, and `green_area`
   variables with your own digitised training sample FeatureCollections
5. Click **Run**

**Required GEE datasets (all free and publicly available):**
- `FAO/GAUL/2015/level2` — Administrative boundaries
- `LANDSAT/LC08/C02/T1_L2` — Landsat 8 OLI Collection 2 Level 2
- `LANDSAT/LC09/C02/T1_L2` — Landsat 9 OLI Collection 2 Level 2
- `MODIS/061/MOD11A1` — MODIS Land Surface Temperature

---

## How to Run the R Bar Charts

```r
# Install required packages (run once)
install.packages(c("ggplot2", "scales"))

# Open LULC_barcharts.R in RStudio
# Set working directory to your output folder
# Click Source or press Ctrl+Shift+Enter
```

---



## Data Availability

The classified raster outputs and area statistics are available from
the corresponding author upon reasonable request.

Training sample FeatureCollections were digitised manually in GEE
and are available upon request.

---

## Citation

If you use this code, please cite:

> Khan, N.I. (2025). Prediction of Land Use and Land Cover Changes
> in Dhaka City Using Markov Chain Analysis on Google Earth Engine.
> *The Egyptian Journal of Remote Sensing and Space Sciences*.
> DOI: [add DOI after acceptance]

---

## License

This code is released under the MIT License.
See [LICENSE](LICENSE) for details.

---

## Contact

Newaz Ibrahim Khan
Department of Computer Science and Engineering
World University of Bangladesh
GitHub: [github.com/newazkhn](https://github.com/newazkhn)
