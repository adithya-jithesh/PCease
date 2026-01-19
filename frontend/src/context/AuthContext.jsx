import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) {
            fetchUser()
        } else {
            setLoading(false)
        }
    }, [token])

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const userData = await res.json()
                setUser(userData)
            } else {
                logout()
            }
        } catch {
            logout()
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.detail || 'Login failed')
        }

        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        setToken(data.access_token)
        await fetchUser()
        return data
    }

    const register = async (email, username, password) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.detail || 'Registration failed')
        }

        return res.json()
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
