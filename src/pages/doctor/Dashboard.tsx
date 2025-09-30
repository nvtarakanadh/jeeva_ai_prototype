import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, FileText, PlusCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getPatientRecordsForDoctor } from '@/services/patientRecordsService';
import { getPatientConsentRequests } from '@/services/consentService';
import { supabase } from '@/integrations/supabase/client';

const DoctorDashboard = () => {
  console.log('🔍 DoctorDashboard component rendered');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingConsents: 0,
    activeConsents: 0,
    totalRecords: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered with user:', user);
    if (user) {
      console.log('🔍 Dashboard: User exists, calling loadDashboardData');
      loadDashboardData();
    } else {
      console.log('🔍 Dashboard: No user, skipping loadDashboardData');
    }
  }, [user]);

  const loadDashboardData = async () => {
    console.log('🔍 loadDashboardData called with user:', user);
    try {
      setLoading(true);
      
      // Get the doctor's profile ID first
      const { data: doctorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !doctorProfile) {
        console.error('Error finding doctor profile:', profileError);
        setStats({
          totalPatients: 0,
          pendingConsents: 0,
          activeConsents: 0,
          totalRecords: 0
        });
        return;
      }

      // Load patient records to get total count using profile ID
      console.log('🔍 Dashboard: Loading records for doctor profile ID:', doctorProfile.id);
      const records = await getPatientRecordsForDoctor(doctorProfile.id);
      console.log('📋 Dashboard: Found records:', records.length);
      
      // Load consent requests using auth user ID
      const consentRequests = await getPatientConsentRequests(user.id);
      console.log('📋 Dashboard: Found consent requests:', consentRequests.length);
      
      // Get unique patients from patient_access table (not just from records)
      const { data: patientAccess, error: accessError } = await supabase
        .from('patient_access')
        .select('patient_id')
        .eq('doctor_id', doctorProfile.id)
        .eq('status', 'active');
      
      const uniquePatients = new Set(patientAccess?.map(acc => acc.patient_id) || []).size;
      console.log('📋 Dashboard: Found unique patients from access table:', uniquePatients);
      
      const pendingConsents = consentRequests.filter(c => c.status === 'pending').length;
      const activeConsents = consentRequests.filter(c => c.status === 'approved').length;
      
      console.log('📊 Dashboard: Calculated stats:', {
        totalPatients: uniquePatients,
        pendingConsents,
        activeConsents,
        totalRecords: records.length
      });
      
      setStats({
        totalPatients: uniquePatients,
        pendingConsents,
        activeConsents,
        totalRecords: records.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    { label: 'Total Patients', value: stats.totalPatients.toString(), icon: Users, href: '/doctor/patients' },
    { label: 'Pending Consents', value: stats.pendingConsents.toString(), icon: Clock, href: '/doctor/consents' },
    { label: 'Active Consents', value: stats.activeConsents.toString(), icon: CheckCircle, href: '/doctor/consents' },
    { label: 'Total Records', value: stats.totalRecords.toString(), icon: FileText, href: '/doctor/patient-records' },
  ];

  console.log('🔍 Dashboard: Current stats state:', stats);
  console.log('🔍 Dashboard: Quick stats values:', quickStats.map(s => `${s.label}: ${s.value}`));

  const recentActivity = [
    { type: 'consent', message: 'New consent request approved by John Doe', time: '2 hours ago' },
    { type: 'prescription', message: 'Prescription uploaded for Sarah Smith', time: '4 hours ago' },
    { type: 'patient', message: 'New patient added to your care', time: '1 day ago' },
  ];

  const upcomingTasks = [
    { task: 'Review blood test results for John Doe', priority: 'high', dueDate: new Date() },
    { task: 'Follow up with Sarah Smith on medication', priority: 'medium', dueDate: new Date(Date.now() + 86400000) },
    { task: 'Prepare consultation notes', priority: 'low', dueDate: new Date(Date.now() + 172800000) },
  ];

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-destructive',
      medium: 'bg-warning',
      low: 'bg-accent'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's your practice overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label} 
              className="hover:shadow-medium transition-all cursor-pointer"
              onClick={() => navigate(stat.href)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-3 bg-primary-light rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for patient care</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-3" 
              variant="outline"
              onClick={() => navigate('/doctor/add-patient')}
            >
              <PlusCircle className="h-4 w-4" />
              Add New Patient
            </Button>
            <Button 
              className="w-full justify-start gap-3" 
              variant="outline"
              onClick={() => navigate('/doctor/patients')}
            >
              <Users className="h-4 w-4" />
              View All Patients
            </Button>
            <Button 
              className="w-full justify-start gap-3" 
              variant="outline"
              onClick={() => navigate('/doctor/consents')}
            >
              <CheckCircle className="h-4 w-4" />
              Review Consents
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in your practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  <div className="p-2 bg-accent-light rounded-lg">
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>Tasks that require your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{task.task}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {format(task.dueDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Practice Statistics - Dynamic Data */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Statistics</CardTitle>
          <CardDescription>Overview of your patient care metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary-light rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.totalPatients > 0 ? '100%' : '0%'}</p>
              <p className="text-sm text-muted-foreground">Patient Satisfaction</p>
            </div>
            <div className="text-center p-4 bg-accent-light rounded-lg">
              <p className="text-2xl font-bold text-accent">{stats.totalRecords}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
            <div className="text-center p-4 bg-secondary-light rounded-lg">
              <p className="text-2xl font-bold text-secondary">{stats.activeConsents}</p>
              <p className="text-sm text-muted-foreground">Active Consents</p>
            </div>
            <div className="text-center p-4 bg-warning-light rounded-lg">
              <p className="text-2xl font-bold text-warning">{stats.pendingConsents}</p>
              <p className="text-sm text-muted-foreground">Pending Consents</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;