import React, { useEffect } from 'react'
import { useApp } from './context/AppContext'
import Auth from './pages/Auth'
import Main from './pages/Main'
import AppLayout from './layout/AppLayout'

const App = () => {
  const { user, loading, error, clearError, handleLogout } = useApp()

  // Handle unauthorized errors by redirecting to login
  useEffect(() => {
    if (error && (error.includes('Unauthorized') || error.includes('UNAUTHORIZED'))) {
      // Clear the error to prevent infinite loops
      clearError()
      // Logout and redirect to login
      handleLogout()
    }
  }, [error, clearError, handleLogout])

  // Show loading state during authentication checks
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error overlay for all errors (including authentication errors)
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className={`${
          error.includes('Unauthorized') || error.includes('UNAUTHORIZED') 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        } border rounded-lg p-6 max-w-md w-full`}>
          <h3 className={`text-lg font-semibold mb-2 ${
            error.includes('Unauthorized') || error.includes('UNAUTHORIZED')
              ? 'text-red-800 dark:text-red-300'
              : 'text-orange-800 dark:text-orange-300'
          }`}>
            {error.includes('Unauthorized') || error.includes('UNAUTHORIZED') 
              ? 'Session Expired' 
              : 'Error'}
          </h3>
          <p className={`mb-4 ${
            error.includes('Unauthorized') || error.includes('UNAUTHORIZED')
              ? 'text-red-700 dark:text-red-400'
              : 'text-orange-700 dark:text-orange-400'
          }`}>
            {error.includes('Unauthorized') || error.includes('UNAUTHORIZED')
              ? 'Your session has expired. Please log in again.'
              : error}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={clearError}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                error.includes('Unauthorized') || error.includes('UNAUTHORIZED')
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {error.includes('Unauthorized') || error.includes('UNAUTHORIZED')
                ? 'Go to Login'
                : 'Dismiss'}
            </button>
            {!error.includes('Unauthorized') && !error.includes('UNAUTHORIZED') && (
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Reload Page
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Authentication gate - if no user, show auth pages
  if (!user) {
    return <Auth />
  }

  // Main application for authenticated users
  return (
    <AppLayout>
      <Main />
    </AppLayout>
  )
}

export default App