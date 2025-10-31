'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext-simple';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { FeaturedStories } from '@/components/home/FeaturedStories';
import { QuickStart } from '@/components/home/QuickStart';
import { SimulatorPreview } from '@/components/home/SimulatorPreview';
import { Icon } from '@/components/ui/Icon';

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

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedStories();
  }, []);

  const fetchFeaturedStories = async () => {
    try {
      const response = await fetch('/api/v1/stories?limit=6&sortBy=updated_at&sortOrder=DESC');
      if (response.ok) {
        const data = await response.json();
        setFeaturedStories(data.stories || []);
      }
    } catch (error) {
      console.error('Failed to fetch featured stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/stories?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-balance">
              Create Interactive Stories with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                What-If Scenarios
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto text-balance">
              Explore infinite narrative possibilities with AI-powered story branching, 
              collaborative editing, and intelligent prompt generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                      <Icon name="dashboard" className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/stories/new">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                      <Icon name="plus" className="mr-2 h-5 w-5" />
                      Create Story
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                      <Icon name="user-plus" className="mr-2 h-5 w-5" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                      <Icon name="log-in" className="mr-2 h-5 w-5" />
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              type="search"
              placeholder="Search stories by title, genre, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Icon name="search" className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Powerful Storytelling Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="zap" className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Powered Prompts</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate infinite "What if" scenarios with our intelligent prompt engine that adapts to your story's context.
              </p>
            </Card>

            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="users" className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Collaborative Editing</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Work together with other writers in real-time, each contributing unique perspectives to the narrative.
              </p>
            </Card>

            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="git-branch" className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Branching Narratives</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create complex story trees with multiple paths, decisions, and outcomes that readers can explore.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      {isAuthenticated && <QuickStart />}

      {/* Simulator Preview */}
      <SimulatorPreview />

      {/* Featured Stories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Stories
            </h2>
            <Link href="/stories">
              <Button variant="outline">
                View All Stories
                <Icon name="arrow-right" className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4">
                    <div className="skeleton h-6 w-3/4"></div>
                    <div className="skeleton h-4 w-full"></div>
                    <div className="skeleton h-4 w-2/3"></div>
                    <div className="flex gap-2">
                      <div className="skeleton h-6 w-16"></div>
                      <div className="skeleton h-6 w-20"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <FeaturedStories stories={featuredStories} />
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your Story?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of writers exploring new narrative possibilities with our AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/stories/new">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Icon name="plus" className="mr-2 h-5 w-5" />
                    Create Your First Story
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <Icon name="user-plus" className="mr-2 h-5 w-5" />
                      Sign Up Free
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline" className="border-gray-300 text-gray-300 hover:bg-gray-800">
                      <Icon name="play" className="mr-2 h-5 w-5" />
                      Try Demo
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
