import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RecordType } from '@/types';
import { UserPlus, Send, Search, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AddPatient = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'search' | 'request'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [requestData, setRequestData] = useState({
    purpose: '',
    message: '',
    duration: 30,
    requestedDataTypes: [] as RecordType[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDataTypes: RecordType[] = ['lab_test', 'prescription', 'imaging', 'consultation', 'vaccination'];

  // No mock data - search real users from Supabase

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('🔍 Searching for patients with query:', searchQuery);
      
      // Search in profiles table for users with role 'patient'
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);

      if (error) {
        console.error('❌ Error searching patients:', error);
        toast({
          title: "Search Error",
          description: "Failed to search for patients. Please try again.",
          variant: "destructive"
        });
        setSearchResults([]);
        return;
      }

      console.log('📊 Search results:', profiles);

      if (profiles && profiles.length > 0) {
        // Convert profiles to search result format
        const results = profiles.map((profile, index) => ({
          id: profile.user_id || `patient-${index}`,
          name: profile.full_name || 'Unknown Patient',
          email: profile.email || '',
          phone: profile.phone || '',
          age: profile.date_of_birth ? 
            new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 0,
          abdmId: 'Not Available' // ABDM ID not available in current schema
        }));
        
        setSearchResults(results);
        
        if (results.length === 0) {
          toast({
            title: "No Results",
            description: "No patients found matching your search criteria",
            variant: "destructive"
          });
        }
      } else {
        setSearchResults([]);
        toast({
          title: "No Results",
          description: "No patients found matching your search criteria",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error searching patients:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for patients. Please try again.",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setMode('request');
  };

  const handleDataTypeToggle = (dataType: RecordType) => {
    setRequestData(prev => ({
      ...prev,
      requestedDataTypes: prev.requestedDataTypes.includes(dataType)
        ? prev.requestedDataTypes.filter(t => t !== dataType)
        : [...prev.requestedDataTypes, dataType]
    }));
  };

  const handleSubmitRequest = async () => {
    if (!requestData.purpose || requestData.requestedDataTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a purpose and select at least one data type",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate request submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Consent request sent",
        description: `Request sent to ${selectedPatient.name}. You'll be notified when they respond.`,
      });

      // Reset form and navigate back
      setSelectedPatient(null);
      setRequestData({
        purpose: '',
        message: '',
        duration: 30,
        requestedDataTypes: []
      });
      setMode('search');
      setSearchQuery('');
      setSearchResults([]);
      
      navigate('/doctor/consents');
    } catch (error) {
      toast({
        title: "Request failed",
        description: "Failed to send consent request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Patient to Your Care</h1>
        <p className="text-muted-foreground">
          Search for patients and request access to their health records
        </p>
      </div>

      {mode === 'search' ? (
        <>
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search for Patients
              </CardTitle>
              <CardDescription>
                Search by name, email, phone number, or ABDM ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter patient name, email, phone, or ABDM ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  variant="medical"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {isSearching && (
                <div className="bg-primary-light p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <div>
                      <p className="font-medium">Searching patient database...</p>
                      <p className="text-sm text-muted-foreground">
                        Looking across ABDM network for matching patients
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {searchResults.length} patient(s) matching your search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                          {patient.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold">{patient.name}</h3>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{patient.age} years</span>
                            <span>ABDM: {patient.abdmId}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ABDM Integration Info */}
          <Card className="border-accent">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-light rounded-lg">
                  <UserPlus className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">ABDM Network Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Search across the Ayushman Bharat Digital Mission network to find registered patients
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Consent Request Form */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Request Patient Consent
                </CardTitle>
                <CardDescription>
                  Send consent request to {selectedPatient?.name}
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setMode('search');
                  setSelectedPatient(null);
                }}
              >
                Back to Search
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Patient Info */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Selected Patient:</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  {selectedPatient?.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium">{selectedPatient?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPatient?.email}</p>
                </div>
              </div>
            </div>

            {/* Request Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Access *</Label>
                <Input
                  id="purpose"
                  placeholder="e.g., Cardiac consultation and treatment planning"
                  value={requestData.purpose}
                  onChange={(e) => setRequestData(prev => ({ ...prev, purpose: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message to Patient</Label>
                <Textarea
                  id="message"
                  placeholder="Optional message explaining why you need access to their records..."
                  value={requestData.message}
                  onChange={(e) => setRequestData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Access Duration (days)</Label>
                <Select 
                  value={requestData.duration.toString()} 
                  onValueChange={(value) => setRequestData(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Requested Data Types *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableDataTypes.map((dataType) => (
                    <div key={dataType} className="flex items-center space-x-2">
                      <Checkbox
                        id={dataType}
                        checked={requestData.requestedDataTypes.includes(dataType)}
                        onCheckedChange={() => handleDataTypeToggle(dataType)}
                      />
                      <label htmlFor={dataType} className="text-sm font-medium capitalize">
                        {dataType.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
                {requestData.requestedDataTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {requestData.requestedDataTypes.map((type) => (
                      <Badge key={type} variant="outline">
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={handleSubmitRequest}
              disabled={isSubmitting || !requestData.purpose || requestData.requestedDataTypes.length === 0}
              className="w-full"
              variant="medical"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Consent Request
                </>
              )}
            </Button>

            <div className="bg-accent-light p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">Patient Notification</p>
                  <p className="text-sm text-muted-foreground">
                    The patient will receive a notification about your consent request and can approve or deny access to their health data.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddPatient;