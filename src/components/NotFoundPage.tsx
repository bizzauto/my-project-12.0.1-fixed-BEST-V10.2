import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="text-center max-w-lg">
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">404</h1>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} className="text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">The page you're looking for doesn't exist or has been moved. Let's get you back on track.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-2 cursor-pointer">
            <Home size={18} /> Go Home
          </button>
          <button onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer">
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Product', path: '/features' },
            { label: 'Pricing', path: '/pricing' },
            { label: 'Support', path: '/contact' },
          ].map((link, i) => (
            <button key={i} onClick={() => navigate(link.path)}
              className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500 transition-colors cursor-pointer">
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
