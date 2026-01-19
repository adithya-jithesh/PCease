import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Builder from './pages/Builder'
import Advisor from './pages/Advisor'
import Forum from './pages/Forum'
import Auth from './pages/Auth'

export default function App() {
    return (
        <AuthProvider>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/builder" element={<Builder />} />
                <Route path="/advisor" element={<Advisor />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/register" element={<Auth isRegister />} />
            </Routes>
            <Footer />
        </AuthProvider>
    )
}
