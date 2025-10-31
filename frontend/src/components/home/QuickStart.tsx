'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function QuickStart() {
  const quickActions = [
    {
      title: 'Create New Story',
      description: 'Start a new interactive story from scratch',
      href: '/stories/new',
      icon: 'plus',
      color: 'blue',
    },
    {
      title: 'Try Story Simulator',
      description: 'Generate "What if" prompts for your story',
      href: '/simulator',
      icon: 'zap',
      color: 'purple',
    },
    {
      title: 'Browse Templates',
      description: 'Use pre-made story templates to get started',
      href: '/templates',
      icon: 'copy',
      color: 'green',
    },
    {
      title: 'Join Collaboration',
      description: 'Contribute to community stories',
      href: '/collaborate',
      icon: 'users',
      color: 'orange',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Start
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Jump right into creating your next interactive story
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action) => (
          <Card key={action.href} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-${action.color}-100 dark:bg-${action.color}-900 group-hover:scale-110 transition-transform`}>
                <Icon name={action.icon as any} className={`h-8 w-8 text-${action.color}-600 dark:text-${action.color}-400`} />
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {action.description}
              </p>
              <Link href={action.href}>
                <Button className="w-full">
                  Get Started
                  <Icon name="arrow-right" className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Your Recent Activity
        </h3>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Icon name="clock" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No recent activity yet. Start creating to see your progress here!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
