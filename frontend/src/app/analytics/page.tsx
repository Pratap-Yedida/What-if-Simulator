'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext-simple';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';

export default function AnalyticsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }

    // Check if user is admin
    const adminCheck = user?.subscriptionTier === 'enterprise' || user?.username === 'admin';
    setIsAdmin(adminCheck);
    setIsLoading(false);
  }, [isAuthenticated, user]);

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/v1/analytics/export?type=user&format=json', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();
      
      // Create download link
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        type: 'success',
        title: 'Export successful',
        description: 'Your analytics data has been downloaded.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        type: 'error',
        title: 'Export failed',
        description: 'Failed to export analytics data. Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loading-spinner h-8 w-8 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track your activity and engagement with detailed insights
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button onClick={handleExportData} variant="outline">
                <Icon name="download" className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              
              {isAdmin && (
                <Button variant="outline">
                  <Icon name="settings" className="mr-2 h-4 w-4" />
                  Admin Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard isAdmin={isAdmin} />
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Icon name="info" className="h-5 w-5" />
              <span>About Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p>
                Our analytics system tracks your activity to help you understand your writing patterns 
                and improve your storytelling experience. All data is collected anonymously and used 
                solely to enhance your experience.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    What We Track
                  </h4>
                  <ul className="space-y-1">
                    <li>• Stories created and edited</li>
                    <li>• Nodes and branches added</li>
                    <li>• Prompts generated</li>
                    <li>• Session duration and frequency</li>
                    <li>• Feature usage patterns</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Privacy & Security
                  </h4>
                  <ul className="space-y-1">
                    <li>• Data is encrypted in transit and at rest</li>
                    <li>• No personal content is stored in analytics</li>
                    <li>• You can export or delete your data anytime</li>
                    <li>• Analytics are aggregated and anonymized</li>
                    <li>• GDPR and CCPA compliant</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
