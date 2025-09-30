import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// No mock data - using real Supabase data
import { format } from 'date-fns';
import { User, Search, FileText, Brain, Clock, Eye, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  lastVisit: Date;
  condition: string;
  consentStatus: 'active' | 'pending' | 'expired';
  recordCount: number;
}

// No mock data - all data comes from Supabase

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  // DATABASE FETCH - SUPABASE
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          setPatients([]);
          return;
        }
        
        if (!user) {
          setPatients([]);
          return;
        }
        
        // Get all profiles first
        const { data: allProfiles, error: allError } = await supabase
          .from('profiles')
          .select('*');

        if (allError) {
          console.error('Error fetching profiles:', allError);
          setPatients([]);
          return;
        }

        if (allProfiles && allProfiles.length > 0) {
          // Filter for patients (exclude doctors)
          const patientProfiles = allProfiles.filter(profile => 
            profile.role !== 'doctor' && profile.role !== 'admin'
          );
          
          // Convert to Patient format and get record counts
          const patientData: Patient[] = await Promise.all(
            patientProfiles.map(async (profile, index) => {
              // Get record count for this patient
              let recordCount = 0;
              try {
                const { data: healthRecords } = await supabase
                  .from('health_records')
                  .select('id')
                  .eq('user_id', profile.user_id);
                
                const { data: prescriptions } = await supabase
                  .from('prescriptions')
                  .select('id')
                  .eq('patient_id', profile.id);
                
                const { data: consultationNotes } = await supabase
                  .from('consultation_notes')
                  .select('id')
                  .eq('patient_id', profile.id);
                
                recordCount = (healthRecords?.length || 0) + 
                             (prescriptions?.length || 0) + 
                             (consultationNotes?.length || 0);
              } catch (error) {
                console.warn(`Error getting record count for patient ${profile.id}:`, error);
              }

              return {
                id: profile.user_id || profile.id || `patient-${index}`,
                name: profile.full_name || 'Unknown Patient',
                email: profile.email || '',
                age: profile.date_of_birth ? 
                  new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 25,
                gender: profile.gender || 'Unknown',
                lastVisit: new Date(profile.updated_at || profile.created_at || new Date()),
                condition: 'General Checkup',
                consentStatus: 'active' as const,
                recordCount: recordCount
              };
            })
          );
          
          setPatients(patientData);
        } else {
          setPatients([]);
        }
      } catch (error) {
        console.error('Error:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // SIMPLE SEARCH: Filter patients based on search term
  const searchSuggestions = searchTerm.trim() 
    ? patients.filter(patient => 
        (patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
      ) 
    : [];
  
  // SIMPLE DROPDOWN LOGIC
  const shouldShowDropdown = searchTerm.trim().length > 0 && patients.length > 0;

  const getConsentStatusColor = (status: string) => {
    const colors = {
      active: 'bg-accent',
      pending: 'bg-warning',
      expired: 'bg-destructive'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const viewPatientRecords = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.trim().length > 0);
  };

  const selectPatient = (patient: Patient) => {
    setSearchTerm(patient.name);
    setShowDropdown(false);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Patients</h1>
          <p className="text-muted-foreground">Manage and view your patient records</p>
        </div>
        <Button 
          variant="medical" 
          onClick={() => navigate('/doctor/add-patient')}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            
            {/* SIMPLE SEARCH DROPDOWN */}
            {shouldShowDropdown && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border-2 border-blue-500 rounded-md shadow-xl max-h-60 overflow-y-auto">
                <div className="p-2 bg-blue-100 text-blue-800 text-xs font-bold">
                  Found {searchSuggestions.length} patients
                </div>
                {searchSuggestions.map((patient, index) => (
                  <div
                    key={patient.id || index}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                    onClick={() => selectPatient(patient)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{patient.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-600">{patient.email || 'No email'}</p>
                        <p className="text-xs text-blue-600">{patient.condition || 'General Checkup'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}


            {/* No results */}
            {showDropdown && searchSuggestions.length === 0 && searchTerm.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="px-4 py-3 text-sm text-gray-500">
                  No patients found matching "{searchTerm}"
                  {patients.length === 0 && (
                    <div className="mt-2 text-xs text-blue-600">
                      No patients in database. Click "Add Test Patients" to create sample data.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Patient Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <p className="text-3xl font-bold">{loading ? '...' : patients.length}</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Consents</p>
                <p className="text-3xl font-bold text-accent">
                  {loading ? '...' : patients.filter(p => p.consentStatus === 'active').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Consents</p>
                <p className="text-3xl font-bold text-warning">
                  {loading ? '...' : patients.filter(p => p.consentStatus === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold">
                  {loading ? '...' : patients.reduce((sum, p) => sum + p.recordCount, 0)}
                </p>
              </div>
              <Brain className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">Loading patients...</p>
              <p className="text-muted-foreground">Fetching data from database</p>
            </CardContent>
          </Card>
        ) : patients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No patients found</p>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search or add a new patient' : 'No patients registered yet. Add a new patient to get started.'}
              </p>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> If you're not seeing patients, you may need to:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 text-left max-w-md mx-auto">
                  <li>• Log in as a doctor to access patient data</li>
                  <li>• Check if Row Level Security policies allow doctor access</li>
                  <li>• Ensure patient profiles exist in the database</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          patients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-medium transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      {getInitials(patient.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{patient.name}</h3>
                      <p className="text-muted-foreground">{patient.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{patient.age} years • {patient.gender}</span>
                        <span>Last visit: {format(patient.lastVisit, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{patient.condition}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getConsentStatusColor(patient.consentStatus)} text-white`}>
                          {patient.consentStatus}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {patient.recordCount} records
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewPatientRecords(patient.id)}
                        disabled={patient.consentStatus !== 'active'}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Records
                      </Button>
                      {patient.consentStatus === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/doctor/consents')}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Request Access
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Patient Records View Modal/Details */}
      {selectedPatient && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Patient Records</CardTitle>
                <CardDescription>
                  Viewing records for {patients.find(p => p.id === selectedPatient)?.name}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Health Records</p>
                <p className="text-muted-foreground">
                  Patient health records will be displayed here once they are uploaded and shared.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This feature requires the patient to upload and share their health records with you.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorPatients;