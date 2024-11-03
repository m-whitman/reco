// src/components/ui/input.js
import React from 'react';

export function Input({ className, ...props }) {
  return (
    <input
      className={`px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}