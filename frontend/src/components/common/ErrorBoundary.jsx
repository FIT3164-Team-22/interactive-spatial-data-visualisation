import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unexpected UI error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <div className="text-4xl mb-4" aria-hidden="true">!</div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition"
              type="button"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
