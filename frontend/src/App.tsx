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

function App() {
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
          <Route path="auth" element={<AuthPage />} />
          <Route path="housing" element={<HousingPage />} />
          <Route path="housingSearch" element={<HousingSearchPage />} />
          <Route path="/explorePage" element={<ExplorePage />} />
        </Route>
        <Route path="messages" element={<MessagingInterface />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
