import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Browse = lazy(() => import('./pages/Browse'))
const Builder = lazy(() => import('./pages/Builder'))
const Advisor = lazy(() => import('./pages/Advisor'))
const Forum = lazy(() => import('./pages/Forum'))
const Auth = lazy(() => import('./pages/Auth'))
const Compare = lazy(() => import('./pages/Compare'))

// Loading fallback
const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
    </div>
)

export default function App() {
    return (
        <AuthProvider>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/builder" element={<Builder />} />
                    <Route path="/builder/:shareId" element={<Builder />} />
                    <Route path="/advisor" element={<Advisor />} />
                    <Route path="/forum" element={<Forum />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/register" element={<Auth isRegister />} />
                </Routes>
            </Suspense>
            <Footer />
        </AuthProvider>
    )
}
