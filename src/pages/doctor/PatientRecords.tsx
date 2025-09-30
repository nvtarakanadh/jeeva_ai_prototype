import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Pill, Stethoscope, Calendar, User, Eye, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientRecordsForDoctor, PatientRecord } from '@/services/patientRecordsService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';

const PatientRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [viewingDetails, setViewingDetails] = useState<PatientRecord | null>(null);

  useEffect(() => {
    if (user) {
      loadPatientRecords();
    }
  }, [user]);

  const loadPatientRecords = async () => {
    try {
      setLoading(true);
      
      // Get the doctor's profile ID first
      const { data: doctorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !doctorProfile) {
        setRecords([]);
        return;
      }
      
      // Try the service function first
      try {
        const data = await getPatientRecordsForDoctor(doctorProfile.id);
        setRecords(data);
      } catch (serviceError) {
        
        // Fallback: Direct database query
        
        // Get patient access records
        const { data: accessRecords, error: accessError } = await supabase
          .from('patient_access')
          .select(`
            patient_id,
            access_type,
            status,
            profiles!patient_access_patient_id_fkey (
              id,
              full_name,
              email
            )
          `)
          .eq('doctor_id', doctorProfile.id)
          .eq('status', 'active');


        if (accessError || !accessRecords || accessRecords.length === 0) {
          setRecords([]);
          return;
        }

        const patientIds = accessRecords.map(acc => acc.patient_id);
        const patientMap = new Map();
        accessRecords.forEach(acc => {
          patientMap.set(acc.patient_id, acc.profiles);
        });

        // Get patient profiles to map user_ids
        const { data: patientProfiles, error: profileError2 } = await supabase
          .from('profiles')
          .select('id, user_id')
          .in('id', patientIds);

        if (profileError2 || !patientProfiles) {
          setRecords([]);
          return;
        }

        const patientUserIds = patientProfiles.map(p => p.user_id);

        // Get all records directly
        const allRecords: PatientRecord[] = [];

        // Health records
        const { data: healthRecords } = await supabase
          .from('health_records')
          .select('*')
          .in('user_id', patientUserIds);


        healthRecords?.forEach(record => {
          const patientProfile = patientProfiles.find(p => p.user_id === record.user_id);
          const patient = patientProfile ? patientMap.get(patientProfile.id) : null;
          
          allRecords.push({
            id: record.id,
            patientId: patientProfile?.id || record.user_id,
            patientName: patient?.full_name || 'Unknown Patient',
            patientEmail: patient?.email || '',
            recordType: 'health_record',
            title: record.title,
            description: record.description,
            fileUrl: record.file_url,
            fileName: record.file_name,
            recordDate: new Date(record.service_date),
            createdAt: new Date(record.created_at),
            doctorId: '',
            doctorName: 'Patient Uploaded'
          });
        });

        // Prescriptions
        const { data: prescriptions } = await supabase
          .from('prescriptions')
          .select(`
            *,
            profiles!prescriptions_doctor_id_fkey (
              full_name
            )
          `)
          .in('patient_id', patientIds);


        prescriptions?.forEach(prescription => {
          const patient = patientMap.get(prescription.patient_id);
          allRecords.push({
            id: prescription.id,
            patientId: prescription.patient_id,
            patientName: patient?.full_name || 'Unknown Patient',
            patientEmail: patient?.email || '',
            recordType: 'prescription',
            title: prescription.title,
            description: prescription.description,
            fileUrl: prescription.file_url,
            fileName: prescription.file_name,
            recordDate: new Date(prescription.prescription_date),
            createdAt: new Date(prescription.created_at),
            doctorId: prescription.doctor_id,
            doctorName: prescription.profiles?.full_name || 'Unknown Doctor'
          });
        });

        // Consultation notes
        const { data: consultationNotes } = await supabase
          .from('consultation_notes')
          .select(`
            *,
            profiles!consultation_notes_doctor_id_fkey (
              full_name
            )
          `)
          .in('patient_id', patientIds);


        consultationNotes?.forEach(note => {
          const patient = patientMap.get(note.patient_id);
          allRecords.push({
            id: note.id,
            patientId: note.patient_id,
            patientName: patient?.full_name || 'Unknown Patient',
            patientEmail: patient?.email || '',
            recordType: 'consultation_note',
            title: note.title,
            description: note.description,
            fileUrl: note.file_url,
            fileName: note.file_name,
            recordDate: new Date(note.consultation_date),
            createdAt: new Date(note.created_at),
            doctorId: note.doctor_id,
            doctorName: note.profiles?.full_name || 'Unknown Doctor'
          });
        });

        // Sort by creation date
        const sortedRecords = allRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRecords(sortedRecords);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load patient records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'health_record':
        return <FileText className="h-4 w-4" />;
      case 'prescription':
        return <Pill className="h-4 w-4" />;
      case 'consultation_note':
        return <Stethoscope className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'health_record':
        return 'bg-blue-100 text-blue-800';
      case 'prescription':
        return 'bg-green-100 text-green-800';
      case 'consultation_note':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case 'health_record':
        return 'Health Record';
      case 'prescription':
        return 'Prescription';
      case 'consultation_note':
        return 'Consultation Note';
      default:
        return 'Record';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getFileType = (fileName: string) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(extension || '')) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) return 'image';
    if (['doc', 'docx'].includes(extension || '')) return 'document';
    return 'file';
  };

  const openFileViewer = async (fileUrl: string, fileName: string) => {
    try {
      const fileType = getFileType(fileName);
      
      
      // If it's already a full URL, use it directly
      let displayUrl = fileUrl;
      
      // Check if it's a Supabase storage path and try different bucket names
      if (fileUrl && !fileUrl.startsWith('http')) {
        // Try different possible bucket names
        const possibleBuckets = ['medical-files', 'prescriptions', 'consultation-notes', 'health-records', 'files'];
        
        for (const bucket of possibleBuckets) {
          try {
            const { data, error } = supabase.storage
              .from(bucket)
              .getPublicUrl(fileUrl);
            
            if (!error && data.publicUrl) {
              displayUrl = data.publicUrl;
              break;
            }
          } catch (bucketError) {
          }
        }
      }
      
      setViewingFile({ url: displayUrl, name: fileName, type: fileType });
    } catch (error) {
      // Still try to open with the original URL
      const fileType = getFileType(fileName);
      setViewingFile({ url: fileUrl, name: fileName, type: fileType });
    }
  };

  const openDetailsViewer = (record: PatientRecord) => {
    setViewingDetails(record);
  };

  const FileViewer = () => {
    if (!viewingFile) return null;

    return (
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {viewingFile.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewingFile.type === 'pdf' && (
              <div className="w-full h-[70vh] border rounded-lg">
                <iframe
                  src={viewingFile.url}
                  className="w-full h-full border-0 rounded-lg"
                  title={viewingFile.name}
                  onError={(e) => {
                  }}
                />
              </div>
            )}
            {viewingFile.type === 'image' && (
              <div className="flex items-center justify-center h-[70vh] bg-gray-50 rounded-lg">
                <div className="text-center">
                  <img
                    src={viewingFile.url}
                    alt={viewingFile.name}
                    className="max-w-full max-h-[60vh] object-contain mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">If image doesn't load, try these options:</p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(viewingFile.url, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = viewingFile.url;
                          link.download = viewingFile.name;
                          link.click();
                        }}
                      >
                        Download
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 break-all">
                      URL: {viewingFile.url}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {viewingFile.type === 'document' && (
              <div className="flex items-center justify-center h-[70vh] bg-gray-100 rounded-lg">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">Document Preview</p>
                  <p className="text-sm text-gray-500 mb-4">{viewingFile.name}</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Document preview not available in browser.
                  </p>
                  <Button 
                    onClick={() => window.open(viewingFile.url, '_blank')}
                    variant="outline"
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
            {viewingFile.type === 'file' && (
              <div className="flex items-center justify-center h-[70vh] bg-gray-100 rounded-lg">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium">File Preview</p>
                  <p className="text-sm text-gray-500 mb-4">{viewingFile.name}</p>
                  <p className="text-sm text-gray-400 mb-4">
                    File preview not available in browser.
                  </p>
                  <Button 
                    onClick={() => window.open(viewingFile.url, '_blank')}
                    variant="outline"
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-500 truncate max-w-md">
              URL: {viewingFile.url}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(viewingFile.url, '_blank')}
              >
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingFile.url;
                  link.download = viewingFile.name;
                  link.click();
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const DetailsViewer = () => {
    if (!viewingDetails) return null;


    return (
      <Dialog open={!!viewingDetails} onOpenChange={() => setViewingDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getRecordIcon(viewingDetails.recordType || 'health_record')}
                {viewingDetails.title || 'Untitled Record'}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Record Type</label>
                <p className="text-sm">{getRecordTypeLabel(viewingDetails.recordType || 'health_record')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="text-sm">
                  {viewingDetails.date ? formatDate(new Date(viewingDetails.date)) : 
                   viewingDetails.recordDate ? formatDate(new Date(viewingDetails.recordDate)) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Patient</label>
                <p className="text-sm">{viewingDetails.patientName || 'Unknown Patient'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Doctor</label>
                <p className="text-sm">{viewingDetails.doctorName || 'Unknown Doctor'}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-sm mt-1">{viewingDetails.description || 'No description available'}</p>
            </div>

            {(viewingDetails.recordType === 'prescription' || viewingDetails.type === 'prescription') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Medication</label>
                  <p className="text-sm">{viewingDetails.medication || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dosage</label>
                  <p className="text-sm">{viewingDetails.dosage || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Frequency</label>
                  <p className="text-sm">{viewingDetails.frequency || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm">{viewingDetails.duration || 'N/A'}</p>
                </div>
              </div>
            )}

            {(viewingDetails.recordType === 'consultation_note' || viewingDetails.type === 'consultation_note') && viewingDetails.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-sm mt-1">{viewingDetails.notes}</p>
              </div>
            )}

            {viewingDetails.fileUrl && (
              <div>
                <label className="text-sm font-medium text-gray-500">Attached File</label>
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-blue-600">{viewingDetails.fileName || 'Unknown File'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openFileViewer(viewingDetails.fileUrl!, viewingDetails.fileName || 'Unknown File')}
                  >
                    View File
                  </Button>
                </div>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const filteredRecords = records.filter(record => {
    const patientMatch = selectedPatient === 'all' || record.patientId === selectedPatient;
    const typeMatch = selectedType === 'all' || record.recordType === selectedType;
    return patientMatch && typeMatch;
  });

  const uniquePatients = Array.from(
    new Set(records.map(record => ({ id: record.patientId, name: record.patientName })))
  );

  const healthRecords = filteredRecords.filter(r => r.recordType === 'health_record');
  const prescriptions = filteredRecords.filter(r => r.recordType === 'prescription');
  const consultationNotes = filteredRecords.filter(r => r.recordType === 'consultation_note');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Patient Records</h1>
            <p className="text-muted-foreground">
              View and manage patient medical records with consent
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <PageLoadingSpinner text="Loading patient records..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Records</h1>
          <p className="text-muted-foreground">
            View and manage patient medical records with consent
          </p>
        </div>
      </div>

      {/* File Viewer Modal */}
      <FileViewer />
      
      {/* Details Viewer Modal */}
      <DetailsViewer />


      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Patient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            {uniquePatients.map(patient => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select Record Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="health_record">Health Records</SelectItem>
            <SelectItem value="prescription">Prescriptions</SelectItem>
            <SelectItem value="consultation_note">Consultation Notes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {uniquePatients.length} patients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              Patient uploaded records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Created by doctors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Records Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Records ({filteredRecords.length})</TabsTrigger>
          <TabsTrigger value="health">Health Records ({healthRecords.length})</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions ({prescriptions.length})</TabsTrigger>
          <TabsTrigger value="notes">Consultation Notes ({consultationNotes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No records found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getRecordIcon(record.recordType)}
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <Badge className={getRecordTypeColor(record.recordType)}>
                          {getRecordTypeLabel(record.recordType)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsViewer(record)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {record.fileUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openFileViewer(record.fileUrl!, record.fileName || 'Unknown File')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View File
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{record.patientName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(record.recordDate)}</span>
                        </div>
                        {record.doctorName && (
                          <div className="flex items-center space-x-1">
                            <Stethoscope className="h-4 w-4" />
                            <span>Dr. {record.doctorName}</span>
                          </div>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {record.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {healthRecords.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No health records found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {healthRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <Badge className="bg-blue-100 text-blue-800">Health Record</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsViewer(record)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {record.fileUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openFileViewer(record.fileUrl!, record.fileName || 'Unknown File')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View File
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{record.patientName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(record.recordDate)}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {record.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No prescriptions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Pill className="h-4 w-4" />
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <Badge className="bg-green-100 text-green-800">Prescription</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsViewer(record)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {record.fileUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openFileViewer(record.fileUrl!, record.fileName || 'Unknown File')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View File
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{record.patientName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(record.recordDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Stethoscope className="h-4 w-4" />
                          <span>Dr. {record.doctorName}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {record.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {consultationNotes.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No consultation notes found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {consultationNotes.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="h-4 w-4" />
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <Badge className="bg-purple-100 text-purple-800">Consultation Note</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsViewer(record)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {record.fileUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openFileViewer(record.fileUrl!, record.fileName || 'Unknown File')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View File
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{record.patientName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(record.recordDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Stethoscope className="h-4 w-4" />
                          <span>Dr. {record.doctorName}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {record.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientRecords;
