'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  template_text: string;
  parameters: string[];
  effectiveness_score: number;
  usage_count: number;
  tags: string[];
  is_premium: boolean;
  author?: string;
  created_at: string;
}

interface TemplateLibraryProps {
  onUseTemplate: (template: Template) => void;
}

export function TemplateLibrary({ onUseTemplate }: TemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'effectiveness' | 'usage' | 'recent'>('effectiveness');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock templates data
  const mockTemplates: Template[] = [
    {
      id: 'tpl_001',
      name: 'Character Trait Reversal',
      category: 'logical',
      description: 'Explores what happens when a character acts opposite to their established traits',
      template_text: 'What if {character} acted completely opposite to their {trait} nature when {event}?',
      parameters: ['character', 'trait', 'event'],
      effectiveness_score: 0.92,
      usage_count: 156,
      tags: ['character-development', 'personality', 'conflict'],
      is_premium: false,
      author: 'community',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tpl_002',
      name: 'Genre Collision',
      category: 'creative',
      description: 'Blends unexpected genre elements to create surprising story directions',
      template_text: 'What if this {genre} story suddenly became about {different_genre_element}?',
      parameters: ['genre', 'different_genre_element'],
      effectiveness_score: 0.88,
      usage_count: 89,
      tags: ['genre-bending', 'surprise', 'creativity'],
      is_premium: true,
      author: 'AI Story Lab',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tpl_003',
      name: 'Moral Dilemma Framework',
      category: 'character-driven',
      description: 'Creates challenging ethical choices that test character values',
      template_text: 'What if {character} had to choose between {value1} and {value2}, knowing that {consequence}?',
      parameters: ['character', 'value1', 'value2', 'consequence'],
      effectiveness_score: 0.94,
      usage_count: 203,
      tags: ['ethics', 'moral-choice', 'character-growth'],
      is_premium: false,
      author: 'StoryMaster',
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tpl_004',
      name: 'Reality Questioning',
      category: 'thematic',
      description: 'Challenges fundamental assumptions about the story world',
      template_text: 'What if everything the characters believed about {fundamental_assumption} was completely wrong?',
      parameters: ['fundamental_assumption'],
      effectiveness_score: 0.86,
      usage_count: 67,
      tags: ['reality', 'truth', 'revelation'],
      is_premium: true,
      author: 'Narrative Dynamics',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'tpl_005',
      name: 'Power Reversal',
      category: 'procedural',
      description: 'Flips power dynamics to create interesting conflicts',
      template_text: 'What if {powerful_character} suddenly lost their {power_source} while {weak_character} gained {new_ability}?',
      parameters: ['powerful_character', 'power_source', 'weak_character', 'new_ability'],
      effectiveness_score: 0.81,
      usage_count: 124,
      tags: ['power-dynamics', 'role-reversal', 'conflict'],
      is_premium: false,
      author: 'community',
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const categories = ['all', 'logical', 'creative', 'character-driven', 'thematic', 'procedural'];

  // Filter and sort templates
  const filteredTemplates = mockTemplates
    .filter(template => {
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'effectiveness':
          return b.effectiveness_score - a.effectiveness_score;
        case 'usage':
          return b.usage_count - a.usage_count;
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const getEffectivenessColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEffectivenessLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Good';
    if (score >= 0.7) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="copy" className="h-5 w-5" />
              <span>Template Library</span>
              <Badge variant="outline">{filteredTemplates.length}</Badge>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="outline">
              <Icon name="plus" className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search templates by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="effectiveness">Sort by Effectiveness</option>
                <option value="usage">Sort by Usage</option>
                <option value="recent">Sort by Recent</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Template Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name
                  </label>
                  <Input placeholder="My Custom Template" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Text
                </label>
                <textarea
                  placeholder="What if {parameter1} did {action} because of {parameter2}?"
                  className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{parameter_name}'} to create fillable slots in your template
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input placeholder="Describe what this template is useful for..." />
              </div>

              <div className="flex justify-end space-x-2">
                <Button onClick={() => setShowCreateForm(false)} variant="outline">
                  Cancel
                </Button>
                <Button>
                  <Icon name="save" className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Icon name="search" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No templates available in this category'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{template.name}</span>
                      {template.is_premium && (
                        <Badge variant="outline" className="text-xs text-purple-600">
                          Premium
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      <span className="text-xs text-gray-500">by {template.author}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-sm font-medium', getEffectivenessColor(template.effectiveness_score))}>
                      {getEffectivenessLabel(template.effectiveness_score)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(template.effectiveness_score * 100).toFixed(0)}% effective
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {template.template_text}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Icon name="settings" className="h-3 w-3" />
                      <span>Parameters: {template.parameters.join(', ')}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Icon name="users" className="h-3 w-3" />
                        <span>{template.usage_count} uses</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon name="clock" className="h-3 w-3" />
                        <span>{Math.floor((Date.now() - new Date(template.created_at).getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => onUseTemplate(template)}
                        size="sm"
                      >
                        <Icon name="zap" className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      {filteredTemplates.length >= 10 && (
        <div className="text-center">
          <Button variant="outline">Load More Templates</Button>
        </div>
      )}
    </div>
  );
}

