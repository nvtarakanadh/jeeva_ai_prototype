import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConsentRequest, ConsentStatus, RecordType } from '@/types';
import { format } from 'date-fns';
import { Shield, Clock, CheckCircle, XCircle, User, Calendar, Send, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Mock consent requests from doctor's perspective
const mockDoctorConsentRequests: ConsentRequest[] = [
  {
    id: 'doctor-consent-1',
    patientId: 'patient-1',
    requesterId: 'doctor-1',
    requesterName: 'Dr. Sarah Wilson',
    purpose: 'Cardiac consultation and treatment planning',
    requestedDataTypes: ['lab_test', 'imaging', 'prescription'],
    duration: 30,
    status: 'approved',
    requestedAt: new Date('2024-09-18'),
    respondedAt: new Date('2024-09-19'),
    expiresAt: new Date('2024-10-19'),
    message: 'Need access to recent cardiac test results for consultation.'
  },
  {
    id: 'doctor-consent-2',
    patientId: 'patient-2',
    requesterId: 'doctor-1',
    requesterName: 'Dr. Sarah Wilson',
    purpose: 'Diabetes management and monitoring',
    requestedDataTypes: ['lab_test', 'prescription'],
    duration: 60,
    status: 'pending',
    requestedAt: new Date('2024-09-22'),
    message: 'Regular diabetes monitoring requires access to lab results and current medications.'
  },
  {
    id: 'doctor-consent-3',
    patientId: 'patient-3',
    requesterId: 'doctor-1',
    requesterName: 'Dr. Sarah Wilson',
    purpose: 'Second opinion consultation',
    requestedDataTypes: ['imaging', 'consultation'],
    duration: 14,
    status: 'denied',
    requestedAt: new Date('2024-09-20'),
    respondedAt: new Date('2024-09-21')
  },
  {
    id: 'doctor-consent-4',
    patientId: 'patient-4',
    requesterId: 'doctor-1',
    requesterName: 'Dr. Sarah Wilson',
    purpose: 'Annual health assessment',
    requestedDataTypes: ['lab_test', 'vaccination', 'consultation'],
    duration: 30,
    status: 'expired',
    requestedAt: new Date('2024-08-15'),
    respondedAt: new Date('2024-08-16'),
    expiresAt: new Date('2024-09-15')
  }
];

// Mock patient data for display
const mockPatientData = {
  'patient-1': { name: 'John Doe', email: 'john.doe@example.com' },
  'patient-2': { name: 'Sarah Smith', email: 'sarah.smith@example.com' },
  'patient-3': { name: 'Michael Johnson', email: 'michael.j@example.com' },
  'patient-4': { name: 'Emily Brown', email: 'emily.brown@example.com' }
};

const DoctorConsents = () => {
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>(mockDoctorConsentRequests);
  const [filterStatus, setFilterStatus] = useState<ConsentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = consentRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const patientName = mockPatientData[request.patientId as keyof typeof mockPatientData]?.name || '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: ConsentStatus) => {
    const colors = {
      pending: 'bg-warning',
      approved: 'bg-accent',
      denied: 'bg-destructive',
      revoked: 'bg-muted',
      expired: 'bg-muted'
    };
    return colors[status];
  };

  const getStatusIcon = (status: ConsentStatus) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      approved: <CheckCircle className="h-4 w-4" />,
      denied: <XCircle className="h-4 w-4" />,
      revoked: <XCircle className="h-4 w-4" />,
      expired: <Clock className="h-4 w-4" />
    };
    return icons[status];
  };

  const handleResendRequest = async (requestId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Request resent",
        description: "Consent request has been sent to the patient again",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend consent request",
        variant: "destructive"
      });
    }
  };

  const handleExtendAccess = async (requestId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConsentRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              expiresAt: request.expiresAt ? new Date(request.expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000) : undefined 
            }
          : request
      ));
      
      toast({
        title: "Access extended",
        description: "Patient consent has been extended for 30 more days",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extend access",
        variant: "destructive"
      });
    }
  };

  const stats = {
    pending: consentRequests.filter(r => r.status === 'pending').length,
    approved: consentRequests.filter(r => r.status === 'approved').length,
    denied: consentRequests.filter(r => r.status === 'denied').length,
    expired: consentRequests.filter(r => r.status === 'expired').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Consent Management</h1>
        <p className="text-muted-foreground">
          Manage patient consent requests and data access permissions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold text-accent">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Denied</p>
                <p className="text-3xl font-bold text-destructive">{stats.denied}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-3xl font-bold text-muted-foreground">{stats.expired}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: ConsentStatus | 'all') => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Consent Requests */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No consent requests found</p>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const patient = mockPatientData[request.patientId as keyof typeof mockPatientData];
            const isExpiringSoon = request.expiresAt && request.expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
            
            return (
              <Card 
                key={request.id} 
                className={`hover:shadow-medium transition-all ${
                  request.status === 'pending' ? 'border-warning' : 
                  request.status === 'approved' ? 'border-accent' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {patient?.name || 'Unknown Patient'}
                      </CardTitle>
                      <CardDescription>{request.purpose}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpiringSoon && request.status === 'approved' && (
                        <Badge className="bg-warning text-white">
                          Expiring Soon
                        </Badge>
                      )}
                      <Badge className={`${getStatusColor(request.status)} text-white`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.message && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">{request.message}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Requested Data Types:</h4>
                    <div className="flex flex-wrap gap-2">
                      {request.requestedDataTypes.map((type) => (
                        <Badge key={type} variant="outline">
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Requested: {format(request.requestedAt, 'PPP')}
                    </span>
                    {request.respondedAt && (
                      <span>Responded: {format(request.respondedAt, 'PPP')}</span>
                    )}
                    {request.expiresAt && (
                      <span>Expires: {format(request.expiresAt, 'PPP')}</span>
                    )}
                    <span>Duration: {request.duration} days</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendRequest(request.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Resend Request
                      </Button>
                    )}
                    
                    {request.status === 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExtendAccess(request.id)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Extend Access
                      </Button>
                    )}
                    
                    {request.status === 'denied' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendRequest(request.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Request Again
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ABDM Compliance Note */}
      <Card className="border-accent">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <div>
              <h3 className="font-semibold">ABDM Compliance</h3>
              <p className="text-sm text-muted-foreground">
                All consent requests follow Ayushman Bharat Digital Mission guidelines. 
                Patients have full control over their data and can revoke access at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorConsents;