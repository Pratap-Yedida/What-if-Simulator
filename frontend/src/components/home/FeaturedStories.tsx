'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatRelativeTime, truncateText } from '@/lib/utils';

interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  author: string;
  updated_at: string;
  node_count: number;
  is_public: boolean;
}

interface FeaturedStoriesProps {
  stories: Story[];
}

export function FeaturedStories({ stories }: FeaturedStoriesProps) {
  if (stories.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="book" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No stories yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Be the first to create an interactive story!
        </p>
        <Link href="/stories/new" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <Icon name="plus" className="mr-2 h-4 w-4" />
          Create your first story
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stories.map((story) => (
        <Card key={story.id} className="story-card">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-lg line-clamp-2">
                <Link 
                  href={`/stories/${story.id}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {story.title}
                </Link>
              </CardTitle>
              <Badge variant="secondary" className="ml-2 shrink-0">
                {story.genre}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {story.description ? truncateText(story.description, 120) : 'No description available.'}
            </p>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Icon name="user" className="h-4 w-4" />
                  <span>{story.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="git-branch" className="h-4 w-4" />
                  <span>{story.node_count} nodes</span>
                </div>
              </div>
              {story.is_public && (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center">
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <Icon name="clock" className="h-4 w-4" />
              <span>Updated {formatRelativeTime(story.updated_at)}</span>
            </div>
            <Link
              href={`/stories/${story.id}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Read
              <Icon name="arrow-right" className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
