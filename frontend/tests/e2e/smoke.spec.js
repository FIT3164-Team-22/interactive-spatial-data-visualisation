// Cross-browser smoke test with network stubbing
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Hide the welcome modal for deterministic tests
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('dashboard:welcomeShown', 'true')
      window.localStorage.setItem('dashboard:tutorialComplete', 'true')
    } catch {}
  })
  // States
  await page.route(/\/api\/v1\/states.*/, async (route) => {
    await route.fulfill({ json: ['VIC', 'NSW'] })
  })

  // Stations
  await page.route(/\/api\/v1\/stations.*/, async (route) => {
    const stations = [
      { id: 1, state: 'VIC', station_name: 'Melbourne', latitude: -37.8136, longitude: 144.9631 },
      { id: 2, state: 'NSW', station_name: 'Sydney', latitude: -33.8688, longitude: 151.2093 },
    ]
    await route.fulfill({ json: { items: stations, count: stations.length } })
  })

  // Heatmap data
  await page.route(/\/api\/v1\/weather\/heatmap.*/, async (route) => {
    const heatmap = [
      { station_id: 1, station_name: 'Melbourne', latitude: -37.8136, longitude: 144.9631, state: 'VIC', value: 25.2 },
      { station_id: 2, station_name: 'Sydney', latitude: -33.8688, longitude: 151.2093, state: 'NSW', value: 27.4 },
    ]
    await route.fulfill({ json: heatmap })
  })

  // Aggregated timeseries
  await page.route(/\/api\/v1\/weather\/aggregate.*/, async (route) => {
    const items = [
      { station_id: 1, station_name: 'Melbourne', period: '2024-01-01', avg_value: 20.0 },
      { station_id: 1, station_name: 'Melbourne', period: '2024-01-02', avg_value: 21.2 },
      { station_id: 1, station_name: 'Melbourne', period: '2024-01-03', avg_value: 22.8 },
    ]
    await route.fulfill({ json: { items } })
  })

  // Statistics
  await page.route(/\/api\/v1\/statistics.*/, async (route) => {
    const payload = {
      statistics: { temp_max: { mean: 22.0, std: 1.2, min: 20, max: 23, median: 22, count: 3 } },
      dominant_factor: 'Maximum Temperature',
      correlations: [],
      sample_size: 3,
    }
    await route.fulfill({ json: payload })
  })

  // Summary
  await page.route(/\/api\/v1\/weather\/summary.*/, async (route) => {
    const payload = {
      filters: {},
      records_analyzed: 3,
      stations_covered: 1,
      coverage: { start: '2024-01-01', end: '2024-01-03' },
      metrics: {
        temperature_max: {
          label: 'Maximum temperature (°C)',
          count: 3,
          average: 22.0,
          minimum: 20.0,
          maximum: 23.0,
          max_record: { station_id: 1, station_name: 'Melbourne', state: 'VIC', date: '2024-01-03', value: 23.0 },
          min_record: { station_id: 1, station_name: 'Melbourne', state: 'VIC', date: '2024-01-01', value: 20.0 },
          max_anomaly: { is_anomaly: false },
          min_anomaly: { is_anomaly: false },
        },
      },
      insights: ['Highest maximum temperature of 23 at Melbourne (VIC) on 2024-01-03.'],
      anomalies: [],
      generated_at: '2024-01-03T00:00:00Z',
    }
    await route.fulfill({ json: payload })
  })

  // Trend
  await page.route(/\/api\/v1\/weather\/trend.*/, async (route) => {
    const payload = {
      metric: 'temperature',
      trend: 'increasing',
      slope: '0.100000',
      intercept: '20.0000',
      r_squared: '0.8500',
      p_value: '0.010000',
      standard_error: '0.020000',
      is_significant: true,
      data_points: 3,
      interpretation: 'Temperature shows a statistically significant increasing trend over the selected period.',
    }
    await route.fulfill({ json: payload })
  })

  // CSV export
  await page.route(/\/api\/v1\/weather\/export.*/, async (route) => {
    await route.fulfill({
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=weather_data.csv',
      },
      body: 'State,Station Name,Date,Max Temperature (degC)\nVIC,Melbourne,2024-01-01,20\n',
    })
  })
})

test('Dashboard renders map, chart, and insights across browsers', async ({ page }) => {
  await page.goto('/?station=1')

  // Title and header
  await expect(page.getByRole('heading', { name: 'Meteorological Data Dashboard', exact: true })).toBeVisible()

  // Map container visible
  await expect(page.locator('.leaflet-container')).toBeVisible()

  // Chart area visible — aggregation select and export button present
  await expect(page.locator('#aggregation-select')).toBeVisible()
  await expect(page.getByRole('button', { name: /Export PNG/i })).toBeVisible()

  // Insights & Statistics sections
  await expect(page.getByText('Insights')).toBeVisible()
  await expect(page.getByText('Statistical Analysis')).toBeVisible()
})
