'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-simple';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  What-If Stories
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Welcome, {user?.displayName || user?.username}!
              </span>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => router.push('/stories/create')}>
                  Create New Story
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/stories')}>
                  Browse Stories
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/simulator')}>
                  Open Simulator
                </Button>
              </div>
            </Card>

            {/* Recent Stories */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Recent Stories
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No stories yet. Create your first story to get started!
              </p>
            </Card>

            {/* Statistics */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Your Statistics
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Stories Created:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Branches:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Simulations Run:</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Welcome Message */}
          <div className="mt-8">
            <Card className="p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to What-If Stories!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                You're now logged in and ready to start creating amazing interactive stories.
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => router.push('/stories/create')}>
                  Create Your First Story
                </Button>
                <Button variant="outline" onClick={() => router.push('/simulator')}>
                  Try the Simulator
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
