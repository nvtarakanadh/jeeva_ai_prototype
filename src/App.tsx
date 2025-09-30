import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PatientDashboard from "./pages/patient/Dashboard";
import HealthRecords from "./pages/patient/HealthRecords";
import AIInsights from "./pages/patient/AIInsights";
import ConsentManagement from "./pages/patient/ConsentManagement";
import ShareData from "./pages/patient/ShareData";
import Profile from "./pages/patient/Profile";
import Settings from "./pages/patient/Settings";
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorPatients from "./pages/doctor/Patients";
import AddPatient from "./pages/doctor/AddPatient";
import PatientRecords from "./pages/doctor/PatientRecords";
import Prescriptions from "./pages/doctor/Prescriptions";
import ConsultationNotes from "./pages/doctor/ConsultationNotes";
import DoctorConsents from "./pages/doctor/Consents";
import DoctorConsultations from "./pages/doctor/Consultations";
import PatientConsultations from "./pages/patient/Consultations";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import PatientConsultationNotes from "./pages/patient/ConsultationNotes";
import Auth from "./pages/Auth";
import MainLayout from "./layouts/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
              
              {/* Patient Routes */}
              <Route path="/dashboard" element={<MainLayout><PatientDashboard /></MainLayout>} />
              <Route path="/records" element={<MainLayout><HealthRecords /></MainLayout>} />
              <Route path="/ai-insights" element={<MainLayout><AIInsights /></MainLayout>} />
              <Route path="/consents" element={<MainLayout><ConsentManagement /></MainLayout>} />
              <Route path="/consultations" element={<MainLayout><PatientConsultations /></MainLayout>} />
              <Route path="/prescriptions" element={<MainLayout><PatientPrescriptions /></MainLayout>} />
              <Route path="/consultation-notes" element={<MainLayout><PatientConsultationNotes /></MainLayout>} />
              <Route path="/share-data" element={<MainLayout><ShareData /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
              
                      {/* Doctor Routes */}
                      <Route path="/doctor/dashboard" element={<MainLayout><DoctorDashboard /></MainLayout>} />
                      <Route path="/doctor/patients" element={<MainLayout><DoctorPatients /></MainLayout>} />
                      <Route path="/doctor/add-patient" element={<MainLayout><AddPatient /></MainLayout>} />
                      <Route path="/doctor/patient-records" element={<MainLayout><PatientRecords /></MainLayout>} />
                      <Route path="/doctor/prescriptions" element={<MainLayout><Prescriptions /></MainLayout>} />
                      <Route path="/doctor/consultation-notes" element={<MainLayout><ConsultationNotes /></MainLayout>} />
                      <Route path="/doctor/consultations" element={<MainLayout><DoctorConsultations /></MainLayout>} />
                      <Route path="/doctor/consents" element={<MainLayout><DoctorConsents /></MainLayout>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
