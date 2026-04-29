import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AdminDashboardPage } from './pages/admin';
import { LoginPage, RegisterPage } from './pages/auth';
import {
  HomePage,
  HotelDetailPage,
  BookingPage,
  BookingServicesPage,
  PaymentPage,
  BookingConfirmationPage,
  BookingThankYouPage,
  ProfilePage,
  ServicesPage,
  ServiceOrderPage,
  ServiceOrderConfirmationPage,
  InfosPage,
} from './pages/client';
import {
  HostShell,
  HostDashboardPage,
  HostHebergementsPage,
  HostHebergementDetailPage,
  HostChambresPage,
  HostServicesPage,
  HostReservationsPage,
  HostAvisPage,
} from './pages/host';
import { RequireAdmin } from './components/RequireAdmin';
import { SiteFooter } from './components/SiteFooter';

function AnimatedRoutes() {
  const location = useLocation();
  const transitionKey = `${location.pathname}${location.search}${location.hash}`;
  return (
    <div key={transitionKey} className="ql-page-transition">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/etablissement/:id" element={<HotelDetailPage />} />
        <Route path="/reservation" element={<BookingPage />} />
        <Route path="/reservation/services" element={<BookingServicesPage />} />
        <Route path="/paiement" element={<PaymentPage />} />
        <Route path="/reservation/confirmee" element={<BookingConfirmationPage />} />
        <Route path="/reservation/fin" element={<BookingThankYouPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/commande" element={<ServiceOrderPage />} />
        <Route path="/services/commande/confirmee" element={<ServiceOrderConfirmationPage />} />
        <Route path="/infos" element={<InfosPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          }
        />

        <Route path="/host" element={<HostShell />}>
          <Route index element={<HostDashboardPage />} />
          <Route path="hebergements" element={<HostHebergementsPage />} />
          <Route path="hebergements/:id" element={<HostHebergementDetailPage />} />
          <Route path="chambres" element={<HostChambresPage />} />
          <Route path="services" element={<HostServicesPage />} />
          <Route path="reservations" element={<HostReservationsPage />} />
          <Route path="avis" element={<HostAvisPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AnimatedRoutes />
      <SiteFooter />
    </>
  );
}
