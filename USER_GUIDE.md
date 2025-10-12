# Meteorological Data Dashboard - User Guide

Welcome to the **Interactive Spatial Data Visualisation** dashboard for Australian weather data. This comprehensive guide will help you navigate and utilize all features of the platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard Components](#dashboard-components)
   - [Interactive Map](#interactive-map)
   - [Filter Sidebar](#filter-sidebar)
   - [Charts](#charts)
   - [Statistics Panel](#statistics-panel)
   - [Insights Panel](#insights-panel)
4. [Key Features](#key-features)
5. [Advanced Usage](#advanced-usage)
6. [Troubleshooting](#troubleshooting)
7. [Technical Details](#technical-details)

---

## Overview

The Meteorological Data Dashboard provides interactive visualization and analysis of Australian Bureau of Meteorology (BOM) weather data. The platform features:

- **377 weather stations** across Australia
- **Data from 2019 to August 2025**
- **5 key metrics**: Temperature, Rainfall, Humidity, Wind Speed, and Evapotranspiration
- **Real-time filtering** and aggregation
- **Statistical analysis** and trend detection
- **Export capabilities** for data and visualizations

---

## Getting Started

### First Visit

When you first visit the dashboard, you'll be greeted with a **Welcome Modal** that provides:

1. **Introduction** to the platform and its capabilities
2. **Interactive Tutorial** covering all major features (6 steps)
3. **Preference Settings** for saving filter configurations

**Tip**: Complete the tutorial to understand all available features. You can skip it and access the guide later via the "Guide" button in the header.

### Interface Layout

The dashboard consists of:

- **Left Sidebar**: Filters and controls
- **Top Header**: Page title, theme toggle, export, and guide buttons
- **Main Content Area**: Map, charts, statistics, and insights
- **Mobile Support**: Responsive design with optimized layouts for smaller screens

---

## Dashboard Components

### Interactive Map

The map is your primary interface for exploring weather stations.

#### Map Features

- **Station Markers**: Each weather station is represented by a marker
- **Clustering**: Stations automatically group when zoomed out
- **Heatmap Overlay**: Visualize metric intensity across regions
- **Interactive Selection**: Click stations to view detailed data

#### How to Use the Map

1. **Select a Station**:
   - Click on any station marker
   - The map centers on the selected station
   - Charts and statistics update to show station-specific data
   - The insights panel displays trend analysis for that station

2. **Deselect a Station**:
   - Click anywhere on the map background (not on a marker)
   - Returns to overview mode
   - Charts show aggregated data for the selected region/filters

3. **Navigation**:
   - **Zoom**: Use mouse wheel or +/- buttons
   - **Pan**: Click and drag the map
   - **Reset**: Click the home button to return to Australia-wide view

4. **Heatmap Toggle**:
   - Enable/disable via the sidebar
   - Shows color-coded intensity of the selected metric
   - Legend displays value ranges and colors

5. **Map Styles**:
   - Choose from multiple base map styles in the sidebar:
     - Streets (default)
     - Satellite
     - Topographic
     - Light/Dark modes

#### Station Information Card

When you hover over a station marker, a popup displays:
- Station name
- Current metric value
- Location coordinates

---

### Filter Sidebar

The sidebar provides comprehensive filtering and customization options.

#### Filter Options

1. **Time Period**:
   - **Start Date**: Select the beginning of your analysis period
   - **End Date**: Select the end of your analysis period
   - **Date Range Validation**: End date must be after start date
   - **Preset Ranges**: Quick selection for common periods

2. **Metric Selection**:
   - **Temperature** (°C): Daily average temperature
   - **Rainfall** (mm): Daily total precipitation
   - **Humidity** (%): Relative humidity percentage
   - **Wind Speed** (m/s): Average wind speed
   - **Evapotranspiration** (mm): Daily evapotranspiration

3. **Region Filter**:
   - Filter by Australian states and territories:
     - All Australia (default)
     - New South Wales (NSW)
     - Victoria (VIC)
     - Queensland (QLD)
     - South Australia (SA)
     - Western Australia (WA)
     - Tasmania (TAS)
     - Northern Territory (NT)
     - Australian Capital Territory (ACT)

#### Station Selection Priority ⚠️

**IMPORTANT**: When you select a specific station on the map, the region filter automatically:
- Resets to "All Australia"
- Becomes disabled (grayed out)
- Shows a **red warning box** explaining the behavior

**Why?** This prevents conflicting filters. For example, analyzing a Sydney station (in NSW) with the region set to Victoria would produce no data.

**How to re-enable region filtering:**
- Click anywhere on the map to deselect the station
- The region dropdown will become active again
- You can then select a state/territory to analyze

#### Additional Sidebar Controls

- **Saved Views**: Save and load favorite filter combinations
- **Map Style Selector**: Change the base map appearance
- **Heatmap Toggle**: Enable/disable the heatmap overlay
- **Sidebar Collapse**: Minimize the sidebar for more viewing space

---

### Charts

The dashboard provides two main chart types for visualizing data.

#### Time Series Chart

Displays how metrics change over time.

**Features**:
- Line chart showing temporal trends
- Interactive tooltips with exact values
- Zoom and pan capabilities
- Download as PNG image

**Aggregation Levels**:
- **Daily**: Individual day values (default for short date ranges)
- **Weekly**: Average values per week
- **Monthly**: Average values per month
- **Yearly**: Average values per year

**Note**: Aggregation options automatically adjust based on your selected date range for optimal visualization.

**How to Read**:
- X-axis: Time period
- Y-axis: Metric value with appropriate units
- Hover over data points for exact values

#### Distribution Charts

Shows the statistical distribution of metric values.

**Chart Types**:

1. **Histogram**:
   - Displays frequency distribution
   - Shows how often values fall within ranges
   - Helps identify typical vs. extreme values

2. **Box Plot**:
   - Shows quartiles and outliers
   - Median line in the center
   - Box represents 25th-75th percentile
   - Whiskers show min/max (excluding outliers)
   - Outliers plotted as individual points

**Use Cases**:
- Identify data spread and variability
- Detect outliers and anomalies
- Understand typical value ranges
- Compare distributions across different time periods

---

### Statistics Panel

Provides comprehensive statistical analysis of the filtered data.

#### Displayed Statistics

1. **Mean (Average)**:
   - The central tendency of the data
   - Sum of all values divided by count

2. **Median**:
   - The middle value when sorted
   - Less affected by outliers than mean

3. **Standard Deviation**:
   - Measure of data spread
   - Higher values indicate more variability

4. **Minimum Value**:
   - Lowest recorded value in the dataset

5. **Maximum Value**:
   - Highest recorded value in the dataset

6. **Data Points Count**:
   - Total number of observations in the filtered dataset

#### Correlation Analysis

When viewing data across multiple metrics:
- **Correlation Coefficients**: Shows relationships between metrics
- **Strength Indicators**: Weak, moderate, or strong correlations
- **Direction**: Positive or negative relationships

**Example**: Temperature and evapotranspiration often show positive correlation (higher temperature → higher evapotranspiration).

---

### Insights Panel

Automatically analyzes your data to surface interesting patterns.

#### Trend Analysis

When a specific station is selected, the insights panel displays **Linear Regression Analysis**:

**Components**:

1. **Trend Direction**:
   - **Increasing** (shown in green): Values trending upward over time
   - **Decreasing** (shown in red): Values trending downward over time
   - **No significant trend** (shown in gray): Statistical analysis shows no clear pattern

2. **Statistical Significance**:
   - **p-value < 0.05**: Trend is statistically significant
   - **p-value ≥ 0.05**: Trend may be due to random variation
   - Lower p-values indicate higher confidence in the trend

3. **R² (R-squared) Value**:
   - Measures how well the trend line fits the data
   - Range: 0 to 1
   - Higher values (closer to 1) indicate better fit
   - Example: R² = 0.85 means 85% of variance is explained by the trend

4. **Slope**:
   - Rate of change per day
   - Units match the selected metric
   - Example: Slope of 0.002°C/day = ~0.73°C increase per year

5. **Interpretation**:
   - Plain-language explanation of what the trend means
   - Automatically generated based on statistical analysis

**Example Trend Analysis**:
```
📈 Increasing Trend (Statistically Significant)

Temperature is increasing over the selected time period.

• Slope: 0.0019°C per day
• R²: 0.82 (strong fit)
• p-value: 0.0003 (highly significant)
• Data points: 1,825

Interpretation: Temperature shows a statistically significant increasing
trend of approximately 0.69°C per year at this station.
```

#### Anomaly Detection

**Highlights**:
- Identifies unusually high or low values
- Based on statistical thresholds (typically 2+ standard deviations)
- Displays dates and values of notable events

**Use Cases**:
- Detect extreme weather events
- Identify data quality issues
- Investigate unusual patterns

---

## Key Features

### 1. Saved Views

**Purpose**: Save frequently used filter combinations for quick access.

**How to Use**:
1. Configure your desired filters (date range, metric, region, station)
2. Click "Save Current View" in the sidebar
3. Enter a descriptive name (e.g., "Sydney Summer 2024")
4. View appears in the "Saved Views" list
5. Click any saved view to instantly restore those filters

**Benefits**:
- Save time on repetitive analysis
- Track specific stations over time
- Compare seasonal patterns
- Share filter configurations via exported settings

### 2. Data Export

**CSV Export**:
1. Click the "Export" button in the header
2. Select which metrics to include
3. Download filtered data as CSV
4. Opens in Excel, Python, R, or other analysis tools

**Export Contents**:
- Date/time stamps
- Station information
- Selected metric values
- Filtered according to current settings

### 3. Chart Export

**Image Export**:
1. Navigate to the desired chart view
2. Click the download icon on the chart
3. Saves as PNG image file
4. Suitable for reports, presentations, and documentation

### 4. Theme Toggle

**Light Mode**:
- Default high-contrast theme
- Better for bright environments
- Easier on some screens

**Dark Mode**:
- Reduces eye strain in low-light conditions
- Saves battery on OLED screens
- Modern aesthetic

**Toggle**: Click "Light Mode" or "Dark Mode" button in the header

### 5. Responsive Design

The dashboard automatically adapts to different screen sizes:

- **Desktop** (1920px+): Full layout with all panels visible
- **Laptop** (1366px+): Optimized grid layout
- **Tablet** (768px+): Stacked layout with touch controls
- **Mobile** (< 768px): Single-column layout with simplified navigation

**Mobile Features**:
- Collapsible sidebar
- Touch-friendly controls
- Optimized chart sizes
- Screen size warning for very small devices

---

## Advanced Usage

### URL Parameters

The dashboard supports URL parameters for sharing specific views:

**Examples**:
```
?metric=temperature&start_date=2024-01-01&end_date=2024-12-31
?state=NSW&metric=rainfall
?station_id=066062&metric=humidity
```

**Supported Parameters**:
- `metric`: temperature, rainfall, humidity, wind_speed, evapotranspiration
- `start_date`: YYYY-MM-DD format
- `end_date`: YYYY-MM-DD format
- `state`: NSW, VIC, QLD, SA, WA, TAS, NT, ACT
- `station_id`: BOM station ID

### Keyboard Shortcuts

- **Esc**: Close open modals (Welcome, Export, Guide)
- **Tab**: Navigate between interactive elements
- **Enter**: Confirm selections in modals

### Performance Optimization

**Tips for Smooth Performance**:

1. **Limit Date Ranges**: Shorter periods load faster
2. **Use Aggregation**: Weekly/monthly views reduce data points
3. **Single Station Analysis**: Faster than state-wide analysis
4. **Disable Heatmap**: Improves map rendering speed
5. **Clear Browser Cache**: If experiencing slowdowns

### Data Refresh

- Data is cached for 5 minutes to improve performance
- Changing filters triggers new API requests
- Large queries (multiple years, all stations) may take longer

---

## Troubleshooting

### Common Issues

#### No Data Displayed

**Possible Causes**:
1. **Invalid Date Range**: End date before start date
2. **No Stations in Region**: Selected state may have limited coverage
3. **Station/Region Conflict**: Station selected outside filtered region
4. **Network Error**: Check internet connection

**Solutions**:
- Reset filters to defaults
- Try a different date range
- Deselect station to re-enable region filter
- Refresh the page

#### Charts Not Loading

**Possible Causes**:
1. **Browser Compatibility**: Older browsers may not support all features
2. **JavaScript Disabled**: Charts require JavaScript
3. **Ad Blockers**: May interfere with chart rendering

**Solutions**:
- Use modern browsers (Chrome, Firefox, Safari, Edge)
- Enable JavaScript
- Disable ad blockers for this site
- Clear browser cache

#### Slow Performance

**Possible Causes**:
1. **Large Dataset**: Querying many years of data
2. **Too Many Stations**: Heatmap with all stations can be slow
3. **Limited Resources**: Device has low memory

**Solutions**:
- Reduce date range
- Filter by single state/region
- Disable heatmap overlay
- Use data aggregation (monthly instead of daily)
- Close other browser tabs

#### Export Fails

**Possible Causes**:
1. **File Size Too Large**: Exporting too much data
2. **Popup Blocker**: Preventing download
3. **Insufficient Permissions**: Browser blocking file downloads

**Solutions**:
- Reduce date range before exporting
- Allow popups for this site
- Check browser download settings
- Try different export format

### Browser Support

**Recommended Browsers**:
- ✅ Google Chrome (latest)
- ✅ Mozilla Firefox (latest)
- ✅ Microsoft Edge (latest)
- ✅ Safari (latest)

**Not Supported**:
- ❌ Internet Explorer
- ❌ Browsers with JavaScript disabled

### Getting Help

If you encounter issues not covered here:

1. **Check Browser Console**: Press F12 to view error messages
2. **Try Incognito/Private Mode**: Rules out extension conflicts
3. **Contact Support**: Provide error messages and steps to reproduce

---

## Technical Details

### Data Source

- **Provider**: Australian Bureau of Meteorology (BOM)
- **Stations**: 377 active weather stations
- **Coverage**: Australia-wide
- **Time Period**: 2019 - August 2025
- **Update Frequency**: Data imported from historical BOM records

### Metrics Definitions

1. **Temperature (°C)**:
   - Daily average temperature
   - Calculated from hourly observations
   - Precision: 0.1°C

2. **Rainfall (mm)**:
   - Daily total precipitation
   - Measured in millimeters
   - Includes rain, drizzle, and melted snow

3. **Humidity (%)**:
   - Relative humidity percentage
   - Average of 9am and 3pm observations
   - Range: 0-100%

4. **Wind Speed (m/s)**:
   - Average wind speed
   - Measured in meters per second
   - 10-minute average

5. **Evapotranspiration (mm)**:
   - Daily evapotranspiration
   - Calculated using meteorological data
   - Represents water loss from soil and plants

### Statistical Methods

**Trend Analysis**:
- Method: Linear Regression (Ordinary Least Squares)
- Library: scipy.stats.linregress
- Significance Level: p < 0.05 (95% confidence)

**Anomaly Detection**:
- Threshold: ±2 standard deviations from mean
- Method: Z-score analysis

**Correlation Analysis**:
- Method: Pearson correlation coefficient
- Range: -1 (perfect negative) to +1 (perfect positive)

### Technology Stack

**Frontend**:
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- Leaflet (maps)
- Chart.js (charts)
- React Query (data fetching)

**Backend**:
- Python 3.11+
- Flask (web framework)
- PostgreSQL (database)
- SQLAlchemy (ORM)
- NumPy/SciPy (statistical analysis)

### API Rate Limiting

To ensure fair usage and system stability:
- **Standard Endpoints**: 60 requests per minute
- **Export Endpoint**: 10 requests per minute
- **Trend Analysis**: 20 requests per minute

Exceeding limits returns HTTP 429 (Too Many Requests).

### Data Privacy

- **No User Tracking**: Dashboard does not collect personal information
- **Local Storage**: Preferences saved locally in your browser
- **No Cookies**: Session management is client-side only
- **Anonymous Usage**: All weather data is public domain

### Accessibility

The dashboard follows WCAG 2.1 Level AA guidelines:
- **Keyboard Navigation**: Full support for keyboard-only users
- **Screen Readers**: ARIA labels and semantic HTML
- **Color Contrast**: Meets minimum contrast ratios
- **Focus Indicators**: Clear visual focus states
- **Responsive Text**: Scales with browser zoom

---

## Appendix

### Glossary

- **Aggregation**: Combining multiple data points (e.g., daily → monthly averages)
- **Anomaly**: A value significantly different from the norm
- **Correlation**: Statistical relationship between two variables
- **Heatmap**: Color-coded visualization of spatial data
- **Linear Regression**: Statistical method to identify trends
- **p-value**: Probability that results occurred by chance
- **R²**: Measure of how well a trend fits the data
- **Standard Deviation**: Measure of data variability

### Useful Links

- **BOM Website**: http://www.bom.gov.au
- **Station Metadata**: Available in CSV export

---

**Last Updated**: October 2025
**Document Version**: 1.3
**Dashboard Version**: 1.3.0

For questions or feedback, please contact the development team.
