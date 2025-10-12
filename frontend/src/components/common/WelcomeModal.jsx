import { useState, useEffect, useRef, useCallback } from 'react'

const WELCOME_STORAGE_KEY = 'dashboard:welcomeShown'
const TUTORIAL_COMPLETE_KEY = 'dashboard:tutorialComplete'
const PREFERENCE_SET_KEY = 'dashboard:preferenceSet'

export default function WelcomeModal({ isOpen, onClose }) {
  const [stage, setStage] = useState('welcome') // welcome, tutorial, preference
  const [currentStep, setCurrentStep] = useState(0)
  const closeButtonRef = useRef(null)

  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
      } catch {
        // Ignore storage errors
      }
    }
    onClose?.()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleClose])

  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    } else if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleStartTutorial = () => {
    setStage('tutorial')
    setCurrentStep(0)
  }

  const handleSkipTutorial = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TUTORIAL_COMPLETE_KEY, 'skipped')
      } catch {
        // Ignore storage errors
      }
    }
    setStage('preference')
  }

  const handleTutorialNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(TUTORIAL_COMPLETE_KEY, 'true')
        } catch {
          // Ignore storage errors
        }
      }
      setStage('preference')
    }
  }

  const handleTutorialPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePreferenceSubmit = (showEveryTime) => {
    if (typeof window !== 'undefined') {
      try {
        // If user wants to show every time, don't mark as shown
        // Otherwise, mark as shown so it won't appear again
        localStorage.setItem(WELCOME_STORAGE_KEY, showEveryTime ? 'false' : 'true')
        localStorage.setItem(PREFERENCE_SET_KEY, showEveryTime ? 'show_always' : 'hide')
      } catch {
        // Ignore storage errors
      }
    }
    onClose?.()
  }

  const tutorialSteps = [
    {
      title: 'Welcome to the Dashboard',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This interactive dashboard visualizes weather data from the Australian Bureau of Meteorology.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Explore <strong>377 weather stations</strong> across Australia with data spanning from <strong>2019 to August 2025</strong>.
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> This guide will help you understand all the features available in the dashboard.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Interactive Map',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            The <strong>map</strong> is your primary interface for exploring weather stations:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li><strong>Click a station marker</strong> (blue circles) to select it and view detailed time series data in the charts panel</li>
            <li><strong>Click the map background</strong> anywhere to deselect the station and return to overview mode</li>
            <li><strong>Zoom and pan</strong> using mouse wheel or touch gestures to explore different regions of Australia</li>
            <li><strong>Toggle heatmap</strong> to visualize metric intensity across regions with color gradients</li>
            <li><strong>Map styles:</strong> Choose between Street, Satellite, Terrain, and Dark modes in the sidebar</li>
          </ul>
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Tip:</strong> The heatmap legend appears in the top-left corner when heatmap is enabled, showing the gradient from low to high values.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Time Series & Distribution Charts',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            After selecting a station, view detailed charts with multiple visualization modes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li><strong>Time Series:</strong> Track how metrics change over time with interactive line charts. Hover over points to see exact values and dates</li>
            <li><strong>Distribution Charts:</strong> View histograms showing the statistical spread and frequency of values</li>
            <li><strong>Aggregation options:</strong> Switch between Daily, Weekly, Monthly, and Yearly views to analyze data at different time scales</li>
            <li><strong>Trend indicators:</strong> See automatic trend analysis with arrows showing if metrics are increasing/decreasing over time</li>
            <li><strong>Export charts:</strong> Download any chart as a PNG image for reports and presentations</li>
          </ul>
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Smart Aggregation:</strong> The available aggregation options automatically adjust based on your selected date range to provide meaningful insights.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Filters & Metrics',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Customize your data view using the <strong>Filter Sidebar</strong> on the left:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li><strong>Time Period:</strong> Select custom start and end dates to focus on specific timeframes (data available from 2019 to August 2025)</li>
            <li><strong>Metric Selection:</strong> Choose from Temperature (°C), Rainfall (mm), Humidity (%), Wind Speed (m/s), or Evapotranspiration (mm)</li>
            <li><strong>Region Filter:</strong> Filter stations by Australian states and territories (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)</li>
            <li><strong>Map Options:</strong> Toggle heatmap visualization and switch between different map styles</li>
          </ul>
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded text-sm text-gray-700 dark:text-gray-300 border border-red-200 dark:border-red-700">
            <strong>⚠️ Important:</strong> When you click a specific station on the map, the region filter automatically resets to "All Australia" and becomes disabled. This prevents conflicting filters (e.g., analyzing a Sydney station while NSW filter is active). Simply click anywhere on the map background to deselect the station and re-enable region filtering.
          </div>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-700">
            <strong>Note:</strong> Pan evaporation and solar radiation metrics are excluded from this platform due to inconsistent data quality and limited relevance for general users.
          </div>
        </div>
      ),
    },
    {
      title: 'Statistics & Insights',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Discover patterns and anomalies in your data with advanced analytics:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li><strong>Statistical Analysis Panel:</strong> View comprehensive stats including mean, median, standard deviation, min/max values, and correlations between metrics</li>
            <li><strong>Insights Panel:</strong> Automated detection of highlights, anomalies, and interesting patterns in the data</li>
            <li><strong>Trend Analysis:</strong> Linear regression analysis showing direction (increasing/decreasing), R² fit quality, P-value for statistical significance, and slope with standard error</li>
            <li><strong>Anomaly Detection:</strong> Automatically identifies unusual values and outliers that deviate significantly from expected patterns</li>
            <li><strong>Records Information:</strong> See the number of records analyzed, stations covered, and date coverage for your current selection</li>
          </ul>
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Pro tip:</strong> The Trend Analysis uses blurple-colored cards to display direction, R² fit, and P-value. Green arrows indicate increasing trends, while red arrows show decreasing trends in the Time Series charts.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Export & Additional Features',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Save time and enhance your workflow with these productivity features:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
            <li><strong>Export Data:</strong> Download filtered weather data as CSV files for use in Excel, R, Python, or other analysis tools</li>
            <li><strong>Export Charts:</strong> Save any visualization as a high-quality PNG image for reports, presentations, and publications</li>
            <li><strong>Dark Mode:</strong> Toggle between light and dark themes using the button in the top-right corner for comfortable viewing in any environment</li>
            <li><strong>User Guide:</strong> Access comprehensive documentation and this tutorial anytime by clicking the "Guide" button in the navigation bar</li>
            <li><strong>Responsive Design:</strong> The dashboard works seamlessly on desktop, tablet, and mobile devices</li>
          </ul>
          <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
            <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-2">
              <strong>Getting Help:</strong>
            </p>
            <ul className="text-xs list-disc list-inside space-y-1 text-indigo-800 dark:text-indigo-200">
              <li>Click the "Guide" button anytime to review this tutorial</li>
              <li>Hover over elements for tooltips and additional information</li>
              <li>Check the Guide PDF for detailed documentation</li>
            </ul>
          </div>
        </div>
      ),
    },
  ]

  const currentTutorialStep = tutorialSteps[currentStep]

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={handleClose}
      />
      <div className="relative bg-white dark:bg-custom-card rounded-xl shadow-2xl border border-gray-300 dark:border-gray-600 w-full max-w-2xl mx-2 sm:mx-4 animate-scale-in overflow-hidden max-h-[95vh] flex flex-col">
        {stage === 'welcome' && (
          <div className="p-4 sm:p-6 md:p-8 overflow-y-auto">
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition"
              type="button"
              aria-label="Close welcome dialog"
            >
              <span className="text-xl sm:text-2xl leading-none">×</span>
            </button>

            <div className="text-center mb-6 sm:mb-8">
              <h2 id="modal-title" className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Welcome to the Meteorological Data Dashboard
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Explore Australian weather data from 377 stations across the continent
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  1
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">Interactive Visualization</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Explore maps, charts, and statistical insights in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  2
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">Comprehensive Data</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Temperature, rainfall, humidity, wind speed, and evapotranspiration metrics
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  3
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">Advanced Analytics</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Trend analysis, anomaly detection, and statistical correlations
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 justify-center">
              <button
                onClick={handleSkipTutorial}
                className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium text-xs sm:text-sm md:text-base"
                type="button"
              >
                Skip Tutorial
              </button>
              <button
                onClick={handleStartTutorial}
                className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium text-xs sm:text-sm md:text-base"
                type="button"
              >
                Start Tutorial
              </button>
            </div>
          </div>
        )}

        {stage === 'tutorial' && (
          <div className="flex flex-col h-full max-h-[85vh]">
            <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 pr-2">
                  {currentTutorialStep.title}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition flex-shrink-0"
                  type="button"
                  aria-label="Close tutorial"
                >
                  <span className="text-xl sm:text-2xl leading-none">×</span>
                </button>
              </div>
              <div className="flex gap-1 sm:gap-2">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 sm:h-2 flex-1 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              {currentTutorialStep.content}
            </div>

            <div className="p-3 sm:p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-2">
              <button
                onClick={handleTutorialPrev}
                disabled={currentStep === 0}
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                type="button"
              >
                Previous
              </button>
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
              <button
                onClick={handleTutorialNext}
                className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium text-xs sm:text-sm"
                type="button"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {stage === 'preference' && (
          <div className="p-4 sm:p-6 md:p-8 overflow-y-auto">
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition"
              type="button"
              aria-label="Close preferences dialog"
            >
              <span className="text-xl sm:text-2xl leading-none">×</span>
            </button>

            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Show Welcome Page on Startup?
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Choose whether you want to see this welcome tutorial every time you visit
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">Yes, show every time</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  The welcome tutorial will appear each time you visit the dashboard
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">No, don't show again</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Skip the welcome page on future visits
                </p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6 p-2.5 sm:p-3 bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 text-center">
                <strong>Note:</strong> You can always review this tutorial by clicking the <strong>Guide</strong> button in the top navigation bar.
              </p>
            </div>

            <div className="flex gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => handlePreferenceSubmit(false)}
                className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium text-xs sm:text-sm md:text-base"
                type="button"
              >
                No, don't show again
              </button>
              <button
                onClick={() => handlePreferenceSubmit(true)}
                className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium text-xs sm:text-sm md:text-base"
                type="button"
              >
                Yes, show every time
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
