import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <img
                    src="/images/404-illustration.png"
                    alt="404 Page Not Found"
                    className="w-64 md:w-80 h-auto mx-auto mb-8 drop-shadow-lg"
                />
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

