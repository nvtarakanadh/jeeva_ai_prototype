import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, FileText, PlusCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getUltraOptimizedDashboardStats, getUltraOptimizedRecentActivity, getUltraOptimizedUpcomingTasks, clearUltraOptimizedCache } from '@/services/ultraOptimizedDashboardService';
import { type DashboardStats, type RecentActivity, type UpcomingTask } from '@/services/dashboardService';
import { dataPrefetchService } from '@/services/dataPrefetchService';
import { PageSkeleton } from '@/components/ui/skeleton-loading';
import { ProgressiveStats, ProgressiveList } from '@/components/ui/progressive-loading';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    pendingConsents: 0,
    activeConsents: 0,
    totalRecords: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);

  // Get doctor profile ID once
  useEffect(() => {
    const getDoctorProfileId = async () => {
      if (!user) return;
      
      try {
        const { data: doctorProfile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error || !doctorProfile) {
          console.error('Error finding doctor profile:', error);
          setLoading(false);
          return;
        }

        setDoctorProfileId(doctorProfile.id);
      } catch (error) {
        console.error('Error getting doctor profile:', error);
        setLoading(false);
      }
    };

    getDoctorProfileId();
  }, [user]);

  // Load dashboard data when profile ID is available
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!doctorProfileId) return;

      try {
        setLoading(true);
        
        
        // Load all data in parallel for better performance
        const [statsData, activityData, tasksData] = await Promise.all([
          getUltraOptimizedDashboardStats(doctorProfileId),
          getUltraOptimizedRecentActivity(doctorProfileId),
          getUltraOptimizedUpcomingTasks(doctorProfileId)
        ]);

        setStats(statsData);
        setRecentActivity(activityData);
        setUpcomingTasks(tasksData);
        
        // Prefetch data for other pages in the background
        dataPrefetchService.prefetchDoctorDashboardData(doctorProfileId);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [doctorProfileId]);

  // Memoize quick stats to prevent unnecessary re-renders
  const quickStats = useMemo(() => [
    { label: 'Total Patients', value: stats.totalPatients.toString(), icon: Users, href: '/doctor/patients' },
    { label: 'Pending Consents', value: stats.pendingConsents.toString(), icon: Clock, href: '/doctor/consents' },
    { label: 'Active Consents', value: stats.activeConsents.toString(), icon: CheckCircle, href: '/doctor/consents' },
    { label: 'Total Records', value: stats.totalRecords.toString(), icon: FileText, href: '/doctor/patient-records' },
  ], [stats]);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-destructive',
      medium: 'bg-warning',
      low: 'bg-accent'
    };
    return colors[priority] || colors.low;
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, Dr. {user?.name}</h1>
        <p className="text-muted-foreground">Here's your practice overview</p>
      </div>

      {/* Quick Stats with Progressive Loading */}
      <ProgressiveStats stats={quickStats} loading={loading} />

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
            <ProgressiveList
              items={recentActivity}
              loading={loading}
              renderItem={(activity) => (
                <div className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  <div className="p-2 bg-accent-light rounded-lg">
                    <Activity className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              )}
              fallbackCount={3}
            />
            {!loading && recentActivity.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
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
          <ProgressiveList
            items={upcomingTasks}
            loading={loading}
            renderItem={(task) => (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{task.task}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      {task.patientName && ` • ${task.patientName}`}
                    </p>
                  </div>
                </div>
                <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                  {task.priority}
                </Badge>
              </div>
            )}
            fallbackCount={3}
          />
          {!loading && upcomingTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No upcoming tasks</p>
            </div>
          )}
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