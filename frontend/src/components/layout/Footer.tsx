'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { href: '/features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/demo', label: 'Demo' },
        { href: '/changelog', label: 'Changelog' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { href: '/docs', label: 'Documentation' },
        { href: '/guides', label: 'Writing Guides' },
        { href: '/templates', label: 'Story Templates' },
        { href: '/community', label: 'Community' },
      ],
    },
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About' },
        { href: '/blog', label: 'Blog' },
        { href: '/careers', label: 'Careers' },
        { href: '/contact', label: 'Contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms of Service' },
        { href: '/security', label: 'Security' },
        { href: '/cookies', label: 'Cookie Policy' },
      ],
    },
  ];

  const socialLinks = [
    { href: 'https://twitter.com/whatifstories', label: 'Twitter', icon: 'globe' },
    { href: 'https://github.com/whatifstories', label: 'GitHub', icon: 'code' },
    { href: 'https://discord.gg/whatifstories', label: 'Discord', icon: 'users' },
    { href: 'mailto:hello@whatifstories.com', label: 'Email', icon: 'mail' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Icon name="book" className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">What-If Stories</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Create interactive stories with AI-powered branching narratives and collaborative editing.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={link.label}
                >
                  <Icon name={link.icon as any} className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-2">Stay updated</h4>
              <p className="text-gray-400 text-sm">
                Get the latest updates on new features and writing tips.
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="mb-4 md:mb-0">
            <p>&copy; {currentYear} What-If Stories. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-6">
            <span>Made with ❤️ for storytellers</span>
            <div className="flex items-center space-x-1">
              <Icon name="globe" className="h-4 w-4" />
              <span>English</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
