import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, FileText, PlusCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickStats = [
    { label: 'Total Patients', value: '24', icon: Users, href: '/doctor/patients' },
    { label: 'Pending Consents', value: '3', icon: Clock, href: '/doctor/consents' },
    { label: 'Active Consents', value: '8', icon: CheckCircle, href: '/doctor/consents' },
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Practice Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Statistics</CardTitle>
          <CardDescription>Overview of your patient care metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary-light rounded-lg">
              <p className="text-2xl font-bold text-primary">95%</p>
              <p className="text-sm text-muted-foreground">Patient Satisfaction</p>
            </div>
            <div className="text-center p-4 bg-accent-light rounded-lg">
              <p className="text-2xl font-bold text-accent">48</p>
              <p className="text-sm text-muted-foreground">Consultations This Month</p>
            </div>
            <div className="text-center p-4 bg-secondary-light rounded-lg">
              <p className="text-2xl font-bold text-secondary">12</p>
              <p className="text-sm text-muted-foreground">Prescriptions Written</p>
            </div>
            <div className="text-center p-4 bg-warning-light rounded-lg">
              <p className="text-2xl font-bold text-warning">3.2</p>
              <p className="text-sm text-muted-foreground">Avg. Response Time (hrs)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorDashboard;