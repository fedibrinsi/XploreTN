import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ExploreActivities from "./pages/ExploreActivities";
import ExperienceDetails from "./pages/ExperienceDetails";
import BookingPage from "./pages/BookingPage";
import HostExperience from "./pages/HostExperience";
import UserProfile from "./pages/UserProfile";
import CuratorDashboard from "./pages/CuratorDashboard";
import MessagingInterface from "./pages/MessagingInterface";
import AuthPage from "./pages/AuthPage";
import HousingPage from "./pages/Housing";
import HousingSearchPage from "./pages/HousingSearch";
import ExplorePage from "./pages/ExplorePage";
import MessagingApp from "./pages/Messaging";
import DiscoveryPage from "./components/DiscoveryPage";

function App() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isLoggedIn = Boolean(token);
  const isTourist = role === "TOURISTE";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExploreActivities />} />
          <Route path="experience/:id" element={<ExperienceDetails />} />
          <Route path="booking/:id" element={<BookingPage />} />
          <Route path="host" element={<HostExperience />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="dashboard" element={<CuratorDashboard />} />
          <Route path="housing" element={<HousingPage />} />
          <Route path="housingSearch" element={<HousingSearchPage />} />
          <Route path="/explorePage" element={<ExplorePage />} />
        </Route>
        <Route path="auth" element={<AuthPage />} />
        <Route path="/messaging" element={<MessagingApp />} />
        <Route path="messages" element={<MessagingInterface />} />
        //! For testing only: remove before production
        <Route
          path="/discovery"
          element={
            <DiscoveryPage isLoggedIn={isLoggedIn} isTourist={isTourist} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
