import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockHealthRecords } from '@/services/mockData';
import { format } from 'date-fns';
import { User, Search, FileText, Brain, Clock, Eye, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 38,
    gender: 'Male',
    lastVisit: new Date('2024-09-20'),
    condition: 'Hypertension',
    consentStatus: 'active',
    recordCount: 12
  },
  {
    id: 'patient-2',
    name: 'Sarah Smith',
    email: 'sarah.smith@example.com',
    age: 45,
    gender: 'Female',
    lastVisit: new Date('2024-09-18'),
    condition: 'Diabetes Type 2',
    consentStatus: 'active',
    recordCount: 8
  },
  {
    id: 'patient-3',
    name: 'Michael Johnson',
    email: 'michael.j@example.com',
    age: 52,
    gender: 'Male',
    lastVisit: new Date('2024-09-15'),
    condition: 'Cardiac Monitoring',
    consentStatus: 'pending',
    recordCount: 5
  },
  {
    id: 'patient-4',
    name: 'Emily Brown',
    email: 'emily.brown@example.com',
    age: 29,
    gender: 'Female',
    lastVisit: new Date('2024-09-10'),
    condition: 'Annual Checkup',
    consentStatus: 'active',
    recordCount: 3
  }
];

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const filteredPatients = mockPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    // In a real app, this would navigate to patient-specific records view
    setSelectedPatient(patientId);
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
            <Input
              placeholder="Search patients by name, email, or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                <p className="text-3xl font-bold">{mockPatients.length}</p>
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
                  {mockPatients.filter(p => p.consentStatus === 'active').length}
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
                  {mockPatients.filter(p => p.consentStatus === 'pending').length}
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
                  {mockPatients.reduce((sum, p) => sum + p.recordCount, 0)}
                </p>
              </div>
              <Brain className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No patients found</p>
              <p className="text-muted-foreground">Try adjusting your search or add a new patient</p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
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
                  Viewing records for {mockPatients.find(p => p.id === selectedPatient)?.name}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockHealthRecords.filter(r => r.patientId === selectedPatient).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{record.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(record.recordDate, 'MMM dd, yyyy')} • {record.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {record.aiAnalysis && (
                      <Badge className="bg-accent text-white">
                        <Brain className="h-3 w-3 mr-1" />
                        AI Analyzed
                      </Badge>
                    )}
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorPatients;