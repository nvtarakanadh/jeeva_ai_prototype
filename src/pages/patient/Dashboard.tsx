import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, Shield, Upload, Activity, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickStats = [
    { label: 'Health Records', value: '12', icon: FileText, href: '/records' },
    { label: 'AI Insights', value: '8', icon: Brain, href: '/ai-insights' },
    { label: 'Active Consents', value: '3', icon: Shield, href: '/consents' },
  ];

  const recentActivity = [
    { type: 'upload', message: 'Blood test results uploaded', time: '2 hours ago' },
    { type: 'analysis', message: 'AI analysis completed for chest X-ray', time: '1 day ago' },
    { type: 'consent', message: 'Consent approved for Dr. Wilson', time: '2 days ago' },
  ];

  const healthAlerts = [
    { type: 'warning', message: 'High cholesterol levels detected in recent blood work' },
    { type: 'info', message: 'Annual checkup due next month' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's your health overview</p>
      </div>

      {/* Health Alerts */}
      {healthAlerts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-warning-light rounded-lg">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
            <CardDescription>Common tasks to manage your health data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-3" 
              variant="outline"
              onClick={() => navigate('/records')}
            >
              <Upload className="h-4 w-4" />
              Upload New Record
            </Button>
            <Button 
              className="w-full justify-start gap-3" 
              variant="outline"
              onClick={() => navigate('/ai-insights')}
            >
              <Brain className="h-4 w-4" />
              Get AI Analysis
            </Button>
            <Button 
              className="w-full justify-start gap-3" 
              variant="outline"
              onClick={() => navigate('/consents')}
            >
              <Shield className="h-4 w-4" />
              Manage Consents
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest health management activities</CardDescription>
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

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Health Summary</CardTitle>
          <CardDescription>Key insights from your latest health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-accent-light rounded-lg">
              <p className="text-2xl font-bold text-accent">85%</p>
              <p className="text-sm text-muted-foreground">Health Score</p>
            </div>
            <div className="text-center p-4 bg-primary-light rounded-lg">
              <p className="text-2xl font-bold text-primary">120/80</p>
              <p className="text-sm text-muted-foreground">Blood Pressure</p>
            </div>
            <div className="text-center p-4 bg-warning-light rounded-lg">
              <p className="text-2xl font-bold text-warning">220</p>
              <p className="text-sm text-muted-foreground">Cholesterol</p>
            </div>
            <div className="text-center p-4 bg-secondary-light rounded-lg">
              <p className="text-2xl font-bold text-secondary">98</p>
              <p className="text-sm text-muted-foreground">Glucose</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;