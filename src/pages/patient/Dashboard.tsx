import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, Shield, Upload, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHealthRecordSummary } from '@/services/healthRecordsService';
import { getAIInsightSummary } from '@/services/aiInsightsService';
import { getRecentActivity, formatTimeAgo } from '@/services/activityService';
import { getHealthAlerts } from '@/services/healthAlertsService';
import { getPatientConsentRequests } from '@/services/consentService';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [healthRecords, setHealthRecords] = useState({ totalRecords: 0, recentRecords: [] });
  const [aiInsights, setAiInsights] = useState({ totalInsights: 0, recentInsights: [], averageConfidence: 0 });
  const [activeConsents, setActiveConsents] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [healthAlerts, setHealthAlerts] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Load all data in parallel
        const [
          healthRecordsData,
          aiInsightsData,
          consentRequestsData,
          activityData,
          alertsData
        ] = await Promise.all([
          getHealthRecordSummary(user.id),
          getAIInsightSummary(user.id),
          getPatientConsentRequests(user.id),
          getRecentActivity(user.id),
          getHealthAlerts(user.id)
        ]);

        setHealthRecords(healthRecordsData);
        setAiInsights(aiInsightsData);
        setActiveConsents(consentRequestsData.filter(consent => consent.status === 'approved').length);
        setRecentActivity(activityData);
        setHealthAlerts(alertsData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  const quickStats = [
    { label: 'Health Records', value: healthRecords.totalRecords.toString(), icon: FileText, href: '/records' },
    { label: 'AI Insights', value: aiInsights.totalInsights.toString(), icon: Brain, href: '/ai-insights' },
    { label: 'Active Consents', value: activeConsents.toString(), icon: Shield, href: '/consents' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Here's your health overview</p>
      </div>

      {/* Health Alerts */}
      {!loading && healthAlerts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthAlerts.map((alert, index) => (
              <div key={alert.id || index} className={`flex items-start gap-3 p-3 rounded-lg ${
                alert.type === 'warning' ? 'bg-warning-light' : 
                alert.type === 'error' ? 'bg-red-50' : 
                alert.type === 'success' ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                <AlertCircle className={`h-4 w-4 mt-0.5 ${
                  alert.type === 'warning' ? 'text-warning' : 
                  alert.type === 'error' ? 'text-red-500' : 
                  alert.type === 'success' ? 'text-green-500' : 'text-blue-500'
                }`} />
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
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-lg">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold">{stat.value}</p>
                    )}
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading activity...</span>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                    <div className="p-2 bg-accent-light rounded-lg">
                      <Activity className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading health summary...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-accent-light rounded-lg">
                <p className="text-2xl font-bold text-accent">
                  {aiInsights.averageConfidence > 0 ? `${Math.round(aiInsights.averageConfidence * 100)}%` : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">AI Confidence</p>
              </div>
              <div className="text-center p-4 bg-primary-light rounded-lg">
                <p className="text-2xl font-bold text-primary">{healthRecords.totalRecords}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div className="text-center p-4 bg-warning-light rounded-lg">
                <p className="text-2xl font-bold text-warning">{aiInsights.totalInsights}</p>
                <p className="text-sm text-muted-foreground">AI Insights</p>
              </div>
              <div className="text-center p-4 bg-secondary-light rounded-lg">
                <p className="text-2xl font-bold text-secondary">{activeConsents}</p>
                <p className="text-sm text-muted-foreground">Active Consents</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboard;