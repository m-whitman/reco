import React from 'react';

export function Button({ children, className, ...props }) {
  return (
    <button
      className={`px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}