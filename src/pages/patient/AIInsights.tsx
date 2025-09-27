import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Activity, AlertTriangle, Lightbulb, TrendingUp, Heart, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { HealthRecord, AIAnalysis, RecordType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const AIInsights = () => {
  const { user, session } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [availableRecords, setAvailableRecords] = useState<HealthRecord[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AIAnalysis | null>(null);

  // Fetch health records and analyses on component mount
  useEffect(() => {
    if (user && session) {
      fetchHealthRecords();
      fetchAnalyses();
      
      // Add mock health records for testing if none exist
      if (availableRecords.length === 0) {
        const mockRecords = [
          {
            id: 'mock-record-1',
            patientId: user.id,
            title: 'Blood Test Results',
            type: 'lab-results' as RecordType,
            description: 'Patient has high blood pressure (150/95 mmHg), elevated cholesterol levels, and reports chest pain during exercise. Blood sugar is normal. Patient is 45 years old, non-smoker, with family history of heart disease.',
            fileUrl: null,
            fileName: 'blood_test_2024.pdf',
            recordDate: new Date(),
            uploadedAt: new Date(),
            uploadedBy: user.id,
            aiAnalysis: null,
          },
          {
            id: 'mock-record-2',
            patientId: user.id,
            title: 'Chest X-Ray',
            type: 'imaging' as RecordType,
            description: 'Chest X-ray shows clear lung fields, no signs of pneumonia or fluid. Heart size appears normal. No fractures or abnormalities detected. Patient reports mild shortness of breath during exercise.',
            fileUrl: null,
            fileName: 'chest_xray_2024.pdf',
            recordDate: new Date(Date.now() - 86400000), // Yesterday
            uploadedAt: new Date(Date.now() - 86400000),
            uploadedBy: user.id,
            aiAnalysis: null,
          },
          {
            id: 'mock-record-3',
            patientId: user.id,
            title: 'Diabetes Checkup',
            type: 'consultation' as RecordType,
            description: 'Annual diabetes checkup. HbA1c level is 7.2% (elevated). Blood glucose levels are well controlled with medication. Patient reports good adherence to diet and exercise. No complications noted.',
            fileUrl: null,
            fileName: 'diabetes_checkup_2024.pdf',
            recordDate: new Date(Date.now() - 172800000), // 2 days ago
            uploadedAt: new Date(Date.now() - 172800000),
            uploadedBy: user.id,
            aiAnalysis: null,
          }
        ];
        setAvailableRecords(mockRecords);
      }
    }
  }, [user, session]);

  const fetchHealthRecords = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRecords: any[] = data?.map(record => ({
        id: record.id,
        patientId: record.user_id,
        title: record.title,
        type: record.record_type as RecordType,
        description: record.description,
        fileUrl: record.file_url,
        fileName: record.file_name,
        recordDate: new Date(record.service_date),
        uploadedAt: new Date(record.created_at),
        uploadedBy: record.user_id,
        aiAnalysis: null,
      })) || [];

      setAvailableRecords(formattedRecords);
    } catch (error: any) {
      console.error('Error fetching records:', error);
    }
  };

  const fetchAnalyses = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select(`
          *,
          health_records!inner(title)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAnalyses: any[] = data?.map(analysis => ({
        id: analysis.id,
        recordId: analysis.record_id,
        summary: analysis.summary,
        keyFindings: analysis.key_findings,
        riskWarnings: analysis.risk_warnings || [],
        recommendations: analysis.recommendations,
        confidence: analysis.confidence_score / 100,
        processedAt: new Date(analysis.created_at),
        recordTitle: analysis.health_records?.title || 'Health Record',
      })) || [];

      setAnalyses(formattedAnalyses);
    } catch (error: any) {
      console.error('Error fetching analyses:', error);
    }
  };

  const testEdgeFunction = async () => {
    console.log('Testing edge function...');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-health-record', {
        body: { 
          testOnly: true
        },
      });
      console.log('Edge function response:', { data, error });
      toast({
        title: "Edge Function Test",
        description: `Response: ${error ? 'Error - ' + error.message : 'Success - ' + JSON.stringify(data)}`,
        variant: error ? "destructive" : "default",
      });
    } catch (err: any) {
      console.error('Edge function test error:', err);
      toast({
        title: "Edge Function Test Failed",
        description: `Error: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const testAIAnalysis = async () => {
    console.log('Testing AI Analysis directly...');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-health-record', {
        body: { 
          text: "Patient has high blood pressure (150/95 mmHg), elevated cholesterol levels, and reports chest pain during exercise. Blood sugar is normal. Patient is 45 years old, non-smoker, with family history of heart disease."
        },
      });
      console.log('AI Analysis response:', { data, error });
      toast({
        title: "AI Analysis Test",
        description: `Response: ${error ? 'Error - ' + error.message : 'Success - Analysis completed!'}`,
        variant: error ? "destructive" : "default",
      });
    } catch (err: any) {
      console.error('AI Analysis test error:', err);
      toast({
        title: "AI Analysis Test Failed",
        description: `Error: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!selectedRecord) {
      toast({
        title: "No record selected",
        description: "Please select a health record to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to analyze records.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting analysis for record:', selectedRecord);
    console.log('Available records:', availableRecords);
    console.log('Session:', session);

    setIsAnalyzing(true);
    setLatestAnalysis(null); // Clear previous analysis

    // Get the selected record details
    const record = availableRecords.find(r => r.id === selectedRecord);
    if (!record) {
      toast({
        title: "Record not found",
        description: "Selected record not found. Please refresh and try again.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
      return;
    }

    try {

      // Prepare text content for analysis
      const textContent = `${record.title}\n\n${record.description}\n\nType: ${record.type}\nDate: ${record.recordDate?.toLocaleDateString()}`;

      // Call the AI analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-health-record', {
        body: { 
          recordId: selectedRecord,
          text: textContent
        },
      });

      console.log('Edge function response:', { data, error });

      if (error) throw error;

      // Store the latest analysis for immediate display
      if (data && data.analysis) {
        const analysisResult: AIAnalysis = {
          id: `temp-${Date.now()}`,
          recordId: selectedRecord,
          summary: data.analysis.summary,
          keyFindings: data.analysis.keyFindings,
          riskWarnings: data.analysis.riskWarnings,
          recommendations: data.analysis.recommendations,
          confidence: data.analysis.confidence / 100, // Convert to decimal
          processedAt: new Date(),
          recordTitle: record.title,
        };
        setLatestAnalysis(analysisResult);

        // Save the analysis to the database
        const { error: saveError } = await supabase
          .from('ai_analyses')
          .insert({
            user_id: session.user.id,
            record_id: selectedRecord,
            summary: data.analysis.summary,
            key_findings: data.analysis.keyFindings,
            risk_warnings: data.analysis.riskWarnings,
            recommendations: data.analysis.recommendations,
            confidence_score: data.analysis.confidence * 100, // Convert to percentage
          });

        if (saveError) {
          console.error('Error saving analysis:', saveError);
          // Don't throw error, just log it - we'll still show the results
          console.log('Analysis completed but not saved to database');
        }
      }

      // Refresh analyses
      await fetchAnalyses();
      setSelectedRecord('');

      toast({
        title: "Analysis complete",
        description: `AI analysis for ${record.title} has been completed.`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        data: error.data
      });
      
      let errorMessage = "There was an error analyzing your record. Please try again.";
      
      // Handle specific error types
      if (error.message && error.message.includes('Gemini API error')) {
        errorMessage = "AI analysis service is temporarily unavailable. Please try again later.";
      } else if (error.message && error.message.includes('Edge Function returned a non-2xx status code')) {
        errorMessage = "Analysis service is temporarily unavailable. Please try again in a few minutes.";
      } else if (error.message && error.message.includes('Missing required environment variables')) {
        errorMessage = "AI service configuration error. Please contact support.";
      } else if (error.message && error.message.includes('Unauthorized')) {
        errorMessage = "Authentication error. Please log out and log back in.";
      } else if (error.message && error.message.includes('Health record not found')) {
        errorMessage = "Selected health record not found. Please refresh and try again.";
      }
      
      toast({
        title: "Analysis failed",
        description: `${errorMessage} (Error: ${error.message || 'Unknown error'})`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Health Insights</h1>
        <p className="text-muted-foreground">
          Get AI-powered analysis of your medical records and health data
        </p>
      </div>

      {/* AI Analysis Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis Tool
          </CardTitle>
          <CardDescription>
            Select a health record to get AI-powered insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Record to Analyze</label>
            <Select value={selectedRecord} onValueChange={setSelectedRecord}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a health record to analyze" />
              </SelectTrigger>
              <SelectContent>
                {availableRecords.length === 0 ? (
                  <SelectItem value="no-records" disabled>
                    No health records available
                  </SelectItem>
                ) : (
                  availableRecords.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      {record.title} - {record.recordDate.toLocaleDateString()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAnalyze}
              disabled={!selectedRecord || isAnalyzing || availableRecords.length === 0}
              className="flex-1"
            >
              <Brain className="h-4 w-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Record'}
            </Button>
            <Button 
              onClick={testEdgeFunction} 
              variant="outline"
              className="px-4"
            >
              Test Function
            </Button>
            <Button 
              onClick={testAIAnalysis} 
              variant="outline"
              className="px-4"
            >
              Test AI
            </Button>
          </div>

          {isAnalyzing && (
            <div className="bg-blue-50 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-medium">AI Analysis in Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Processing your health data for insights...
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{availableRecords.length}</p>
              <p className="text-sm text-muted-foreground">Health Records</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border">
              <Brain className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{analyses.length}</p>
              <p className="text-sm text-muted-foreground">AI Analyses</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border">
              <Heart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">
                {analyses.length > 0 ? Math.round(analyses.reduce((acc, a) => acc + a.confidence, 0) / analyses.length * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Analysis Results</h2>
        {analyses.length === 0 && !latestAnalysis ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No analyses yet</p>
              <p className="text-muted-foreground">Use the AI tool above to analyze your health records</p>
            </CardContent>
          </Card>
        ) : (
          (analyses.length > 0 ? analyses : latestAnalysis ? [latestAnalysis] : []).map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{(analysis as any).recordTitle || 'Health Record Analysis'}</CardTitle>
                    <CardDescription>
                      Analyzed on {analysis.processedAt.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={getConfidenceColor(analysis.confidence)}>
                    {getConfidenceLabel(analysis.confidence)} Confidence ({Math.round(analysis.confidence * 100)}%)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Summary
                  </h4>
                  <p className="text-muted-foreground">{analysis.summary}</p>
                </div>

                {/* Key Findings */}
                {analysis.keyFindings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Key Findings
                    </h4>
                    <ul className="space-y-1">
                      {analysis.keyFindings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                          <span className="text-sm">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Warnings */}
                {analysis.riskWarnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Warnings
                    </h4>
                    <ul className="space-y-1">
                      {analysis.riskWarnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                          <span className="text-sm">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>Disclaimer:</strong> This AI analysis is for educational purposes only and should not replace professional medical advice. 
                    Always consult with a healthcare provider for medical decisions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AIInsights;