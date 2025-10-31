'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Icon mapping for commonly used icons
// In a real app, you might use a library like Lucide React or Heroicons
const iconMap = {
  // Navigation
  'home': '🏠',
  'user': '👤',
  'settings': '⚙️',
  'search': '🔍',
  'menu': '☰',
  'close': '✖️',
  'arrow-right': '→',
  'arrow-left': '←',
  'arrow-up': '↑',
  'arrow-down': '↓',
  
  // Actions
  'plus': '+',
  'edit': '✏️',
  'delete': '🗑️',
  'save': '💾',
  'copy': '📋',
  'share': '📤',
  'download': '📥',
  'upload': '📤',
  'refresh': '🔄',
  
  // Authentication
  'log-in': '🔑',
  'log-out': '🚪',
  'user-plus': '👤+',
  'lock': '🔒',
  'unlock': '🔓',
  
  // Story/Content
  'book': '📖',
  'pen': '✍️',
  'story': '📚',
  'branch': '🌳',
  'git-branch': '🌿',
  'timeline': '📅',
  'play': '▶️',
  'pause': '⏸️',
  'stop': '⏹️',
  
  // Interface
  'heart': '❤️',
  'star': '⭐',
  'bookmark': '🔖',
  'tag': '🏷️',
  'flag': '🚩',
  'bell': '🔔',
  'mail': '📧',
  'phone': '📱',
  
  // Status
  'check': '✅',
  'x': '❌',
  'warning': '⚠️',
  'info': 'ℹ️',
  'help': '❓',
  'loading': '⏳',
  
  // UI Elements
  'eye': '👁️',
  'eye-off': '🙈',
  'calendar': '📅',
  'clock': '🕐',
  'map': '🗺️',
  'image': '🖼️',
  'video': '🎥',
  'music': '🎵',
  
  // Features
  'zap': '⚡',
  'users': '👥',
  'globe': '🌐',
  'database': '🗄️',
  'server': '🖥️',
  'code': '💻',
  'terminal': '⌨️',
  'dashboard': '📊',
  'chart': '📈',
  'filter': '🔍',
  'sort': '🔀',
};

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: keyof typeof iconMap;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function Icon({ name, size = 'md', className, ...props }: IconProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={name}
      {...props}
    >
      {iconMap[name] || '?'}
    </span>
  );
}

export { Icon };
