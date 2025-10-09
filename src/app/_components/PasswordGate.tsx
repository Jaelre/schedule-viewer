'use client'

import { useState, useEffect, type FormEvent, type ReactNode } from 'react'

interface PasswordGateProps {
  children: ReactNode
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Check if we have a token in localStorage
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('schedule_viewer_token')

        if (!token) {
          setHasAccess(false)
          setIsChecking(false)
          return
        }

        // Verify token with server
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
        const response = await fetch(`${apiUrl}/check-access`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setHasAccess(data.success === true)
        } else {
          // Invalid token, clear it
          localStorage.removeItem('schedule_viewer_token')
          setHasAccess(false)
        }
      } catch {
        setHasAccess(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedPassword = password.trim()
    if (!trimmedPassword) {
      setError('Inserisci la password.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: trimmedPassword }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.success && data.token) {
          // Store token in localStorage
          localStorage.setItem('schedule_viewer_token', data.token)

          setPassword('')
          setError('')
          setHasAccess(true)
          return
        }
      }

      const data = await response.json().catch(() => null)
      if (data && typeof data.error === 'string') {
        setError(data.error)
        return
      }

      setError('Password non valida. Riprova.')
    } catch (requestError) {
      console.error('Password verification failed', requestError)
      setError('Si è verificato un errore nella verifica della password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Accesso richiesto</h1>
          <p className="text-sm text-muted-foreground">Inserisci la password per visualizzare il calendario.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Inserisci password"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifica…' : 'Conferma'}
          </button>
        </form>
      </div>
    </div>
  )
}
