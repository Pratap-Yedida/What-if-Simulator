'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext-simple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toaster';
import { Story } from '@/types/story';
import { cn, formatRelativeTime, truncateText } from '@/lib/utils';

export default function StoriesPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock data for development
  const mockStories: Story[] = [
    {
      id: '1',
      title: 'The Mystery of Blackwood Manor',
      description: 'A detective investigates strange occurrences at an old Victorian mansion.',
      author_id: 'user-1',
      author: { id: 'user-1', username: 'mystery_writer', email: 'mystery@example.com', subscriptionTier: 'premium' },
      genre: 'mystery',
      tone: 'suspenseful',
      audience_age: '16-18',
      is_public: true,
      is_collaborative: false,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      stats: {
        node_count: 24,
        branch_count: 18,
        collaborator_count: 1,
        view_count: 342,
        like_count: 27,
        last_activity: new Date().toISOString(),
      },
    },
    {
      id: '2',
      title: 'Starship Odyssey',
      description: 'A space exploration adventure where every decision shapes the fate of humanity.',
      author_id: 'user-2',
      author: { id: 'user-2', username: 'sci_fi_author', email: 'scifi@example.com', subscriptionTier: 'free' },
      genre: 'science-fiction',
      tone: 'optimistic',
      audience_age: 'all-ages',
      is_public: true,
      is_collaborative: true,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      stats: {
        node_count: 45,
        branch_count: 32,
        collaborator_count: 3,
        view_count: 1205,
        like_count: 89,
        last_activity: new Date().toISOString(),
      },
    },
    {
      id: '3',
      title: 'The Dragon\'s Choice',
      description: 'A young knight must make impossible decisions in a world where dragons rule.',
      author_id: 'user-3',
      author: { id: 'user-3', username: 'fantasy_lover', email: 'fantasy@example.com', subscriptionTier: 'professional' },
      genre: 'fantasy',
      tone: 'epic',
      audience_age: '13-15',
      is_public: true,
      is_collaborative: false,
      created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      stats: {
        node_count: 67,
        branch_count: 54,
        collaborator_count: 1,
        view_count: 2156,
        like_count: 156,
        last_activity: new Date().toISOString(),
      },
    },
  ];

  useEffect(() => {
    fetchStories();
  }, [searchTerm, selectedGenre, sortBy, currentPage]);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Filter and sort mock data
      let filteredStories = mockStories;
      
      if (searchTerm) {
        filteredStories = filteredStories.filter(story =>
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.author?.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (selectedGenre) {
        filteredStories = filteredStories.filter(story => story.genre === selectedGenre);
      }
      
      // Sort
      filteredStories.sort((a, b) => {
        switch (sortBy) {
          case 'updated_at':
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case 'created_at':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'views':
            return (b.stats?.view_count || 0) - (a.stats?.view_count || 0);
          case 'likes':
            return (b.stats?.like_count || 0) - (a.stats?.like_count || 0);
          default:
            return 0;
        }
      });
      
      setStories(filteredStories);
      setTotalPages(Math.ceil(filteredStories.length / 12)); // 12 stories per page
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      toast({
        type: 'error',
        title: 'Error loading stories',
        description: 'Failed to load stories. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const genres = ['mystery', 'science-fiction', 'fantasy', 'romance', 'thriller', 'horror', 'adventure'];
  const sortOptions = [
    { value: 'updated_at', label: 'Recently Updated' },
    { value: 'created_at', label: 'Recently Created' },
    { value: 'title', label: 'Title (A-Z)' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'likes', label: 'Most Liked' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stories</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Discover interactive stories from our community
              </p>
            </div>
            {isAuthenticated && (
              <Link href="/stories/new">
                <Button>
                  <Icon name="plus" className="mr-2 h-4 w-4" />
                  Create Story
                </Button>
              </Link>
            )}
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
                placeholder="Search stories, authors, or keywords..."
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
            <Icon name="search" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No stories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || selectedGenre 
                ? 'Try adjusting your search or filters'
                : 'Be the first to create a story!'
              }
            </p>
            {isAuthenticated && (
              <Link href="/stories/new">
                <Button>
                  <Icon name="plus" className="mr-2 h-4 w-4" />
                  Create First Story
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card key={story.id} className="story-card group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Link href={`/stories/${story.id}`}>
                        {story.title}
                      </Link>
                    </CardTitle>
                    <div className="flex items-center space-x-1 shrink-0">
                      {story.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {story.genre.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                      )}
                      {story.is_collaborative && (
                        <Badge variant="outline" className="text-xs">
                          <Icon name="users" className="h-3 w-3 mr-1" />
                          Collab
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
                    {/* Author and Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Icon name="user" className="h-4 w-4" />
                        <span>{story.author?.username}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Icon name="eye" className="h-4 w-4" />
                          <span>{story.stats?.view_count || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icon name="heart" className="h-4 w-4" />
                          <span>{story.stats?.like_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Node and Branch Count */}
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
                        <Link href={`/stories/${story.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Icon name="book" className="mr-2 h-4 w-4" />
                            Read
                          </Button>
                        </Link>
                        {isAuthenticated && story.author_id === user?.id && (
                          <Link href={`/stories/${story.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Icon name="edit" className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
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
