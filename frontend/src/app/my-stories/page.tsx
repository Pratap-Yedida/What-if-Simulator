'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext-simple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { Story } from '@/types/story';
import { cn, formatRelativeTime, truncateText } from '@/lib/utils';

export default function MyStoriesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchMyStories();
  }, [isAuthenticated, searchTerm, selectedGenre, sortBy, currentPage]);

  const fetchMyStories = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        setStories([]);
        return;
      }

      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch user's stories from API
      const response = await fetch(`${apiUrl}/api/v1/stories?authorId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If API fails, show empty state
        setStories([]);
        setTotalPages(1);
        return;
      }

      const data = await response.json();
      let userStories = data.data || [];
      
      // Filter by search term
      if (searchTerm) {
        userStories = userStories.filter((story: Story) =>
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by genre
      if (selectedGenre) {
        userStories = userStories.filter((story: Story) => story.genre === selectedGenre);
      }
      
      // Sort
      userStories.sort((a: Story, b: Story) => {
        switch (sortBy) {
          case 'updated_at':
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case 'created_at':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
      
      setStories(userStories);
      setTotalPages(Math.ceil(userStories.length / 12));
    } catch (error) {
      console.error('Failed to fetch my stories:', error);
      toast({
        type: 'error',
        title: 'Error loading stories',
        description: 'Failed to load your stories. Please try again.',
      });
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const genres = ['mystery', 'science-fiction', 'fantasy', 'romance', 'thriller', 'horror', 'adventure'];
  const sortOptions = [
    { value: 'updated_at', label: 'Recently Updated' },
    { value: 'created_at', label: 'Recently Created' },
    { value: 'title', label: 'Title (A-Z)' },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Stories</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and edit your interactive stories
              </p>
            </div>
            <Link href="/stories/new">
              <Button>
                <Icon name="plus" className="mr-2 h-4 w-4" />
                Create Story
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search your stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Genre Filter */}
            <div className="sm:w-48">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="story-card">
                <CardHeader>
                  <div className="space-y-2">
                    <div className="skeleton h-6 w-3/4"></div>
                    <div className="skeleton h-4 w-full"></div>
                    <div className="skeleton h-4 w-2/3"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-1/2"></div>
                    <div className="flex gap-2">
                      <div className="skeleton h-6 w-16"></div>
                      <div className="skeleton h-6 w-20"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="book" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No stories yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || selectedGenre 
                ? 'No stories match your filters. Try adjusting your search.'
                : 'Start creating your first interactive story!'
              }
            </p>
            <Link href="/stories/new">
              <Button>
                <Icon name="plus" className="mr-2 h-4 w-4" />
                Create Your First Story
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card key={story.id} className="story-card group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Link href={`/stories/${story.id}/edit`}>
                        {story.title}
                      </Link>
                    </CardTitle>
                    <div className="flex items-center space-x-1 shrink-0">
                      {story.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {story.genre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                      )}
                      {story.is_public ? (
                        <Badge variant="outline" className="text-xs">
                          <Icon name="globe" className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Icon name="lock" className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {story.description ? truncateText(story.description, 120) : 'No description available.'}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Icon name="book" className="h-4 w-4" />
                          <span>{story.stats?.node_count || 0} nodes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icon name="git-branch" className="h-4 w-4" />
                          <span>{story.stats?.branch_count || 0} branches</span>
                        </div>
                      </div>
                      <span className="text-xs">
                        Updated {formatRelativeTime(story.updated_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-2">
                        <Link href={`/stories/${story.id}/edit`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Icon name="edit" className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/stories/${story.id}`}>
                          <Button variant="outline" size="sm">
                            <Icon name="eye" className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-4">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              <Icon name="arrow-left" className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-2">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-8 h-8 rounded text-sm transition-colors',
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Next
              <Icon name="arrow-right" className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

