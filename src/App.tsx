import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Prices from './pages/Prices';
import About from './pages/About';
import Contact from './pages/Contact';

import { AdminProvider } from './context/AdminContext';
import { ToastProvider } from './context/ToastContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import ProtectedRoute from './admin/ProtectedRoute';
import { AdminLayoutSkeleton, DashboardSkeleton, SeoSkeleton, GallerySkeleton, AnalyticsSkeleton } from './admin/components/skeletons';

// Code-split admin chunk
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Login = lazy(() => import('./admin/pages/Login'));
const Dashboard = lazy(() => import('./admin/pages/Dashboard'));
const SeoEditor = lazy(() => import('./admin/pages/SeoEditor'));
const GalleryManager = lazy(() => import('./admin/pages/GalleryManager'));
const Analytics = lazy(() => import('./admin/pages/Analytics'));
const NotFound = lazy(() => import('./admin/pages/NotFound'));

import './i18n';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <FloatingButtons />
    </>
  );
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Admin */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminLayoutSkeleton />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AdminLayoutSkeleton />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<Suspense fallback={<DashboardSkeleton />}><Dashboard /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<AnalyticsSkeleton />}><Analytics /></Suspense>} />
          <Route path="seo" element={<Suspense fallback={<SeoSkeleton />}><SeoEditor /></Suspense>} />
          <Route path="gallery" element={<Suspense fallback={<GallerySkeleton />}><GalleryManager /></Suspense>} />
          <Route path="*" element={<Suspense fallback={null}><NotFound /></Suspense>} />
        </Route>

        {/* Public */}
        <Route
          path="/*"
          element={
            <PublicLayout>
              <AnimatedPage>
                <Routes>
                  <Route path="/"         element={<Home />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/gallery"  element={<Gallery />} />
                  <Route path="/prices"   element={<Prices />} />
                  <Route path="/about"    element={<About />} />
                  <Route path="/contact"  element={<Contact />} />
                </Routes>
              </AnimatedPage>
            </PublicLayout>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <AdminProvider>
            <BrowserRouter>
              <AnalyticsProvider>
                <ScrollToTop />
                <AppRoutes />
              </AnalyticsProvider>
            </BrowserRouter>
          </AdminProvider>
        </ToastProvider>
      </MotionConfig>
    </HelmetProvider>
  );
}
