import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';

const BookDemo: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock submission
        setTimeout(() => setSubmitted(true), 1000);
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            <header className="bg-white border-b border-border py-4">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <Logo size="lg" />
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-soft overflow-hidden">
                    <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        {submitted ? (
                            <div className="text-center animate-fade-in-up">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h2 className="text-3xl font-bold text-text-primary mb-4">Request Received!</h2>
                                <p className="text-text-secondary mb-8">Thanks for your interest. Our team will contact you shortly to schedule your personalized demo.</p>
                                <Link to="/" className="btn-primary">Back to Home</Link>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold text-text-primary mb-4">Book a Demo</h1>
                                <p className="text-text-secondary mb-8">See how Qualitivate can transform your organization's quality culture. Fill out the form and we'll be in touch.</p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="label-soft">Full Name</label>
                                        <input type="text" required className="input-soft" placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label className="label-soft">Work Email</label>
                                        <input type="email" required className="input-soft" placeholder="john@company.com" />
                                    </div>
                                    <div>
                                        <label className="label-soft">Company Name</label>
                                        <input type="text" required className="input-soft" placeholder="Acme Inc." />
                                    </div>
                                    <button type="submit" className="btn-primary w-full mt-4">Schedule Demo</button>
                                </form>
                            </>
                        )}
                    </div>
                    <div className="bg-primary-900 hidden md:flex flex-col justify-center p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500 rounded-full blur-[100px] opacity-20"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500 rounded-full blur-[100px] opacity-20"></div>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-6">why leading companies choose Qualitivate?</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-accent-400 mt-1">★</span>
                                    <p className="text-primary-100">"The insights we've gained have been transformative for our process."</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-accent-400 mt-1">★</span>
                                    <p className="text-primary-100">"Simple to use, powerful results. Exactly what we needed."</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDemo;

