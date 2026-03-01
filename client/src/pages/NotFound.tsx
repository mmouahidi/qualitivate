import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <div className="relative inline-flex items-center justify-center mb-8">
                    <div className="absolute inset-0 bg-primary-500 rounded-full blur-[50px] opacity-20 animate-pulse"></div>
                    <AlertCircle className="w-32 h-32 text-primary-500 relative z-10 drop-shadow-lg" strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Page not found</h1>
                <p className="text-lg text-text-secondary mb-8">
                    Sorry, we couldn't find the page you're looking for.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/dashboard" className="btn-primary">
                        Go back home
                    </Link>
                    <button onClick={() => window.history.back()} className="btn-secondary">
                        Go back previous page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;

