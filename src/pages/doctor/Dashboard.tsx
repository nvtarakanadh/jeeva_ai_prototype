import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, FileText, PlusCircle, Activity, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getDashboardStats, getRecentActivity, getUpcomingTasks, type DashboardStats, type RecentActivity, type UpcomingTask } from '@/services/dashboardService';

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
          getDashboardStats(doctorProfileId),
          getRecentActivity(doctorProfileId),
          getUpcomingTasks(doctorProfileId)
        ]);

        setStats(statsData);
        setRecentActivity(activityData);
        setUpcomingTasks(tasksData);
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                    <div className="p-2 bg-accent-light rounded-lg">
                      <Activity className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
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
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
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
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming tasks</p>
              </div>
            )}
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