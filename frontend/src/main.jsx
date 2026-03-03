import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid rgba(148,163,184,0.1)',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                    },
                }}
            />
        </BrowserRouter>
    </React.StrictMode>
)
