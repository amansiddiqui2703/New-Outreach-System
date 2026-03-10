import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col items-center py-16 px-4">
            <div className="max-w-3xl w-full bg-white dark:bg-surface-900 rounded-3xl shadow-xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8 pb-8 border-b border-surface-200 dark:border-surface-800">
                    <div className="w-12 h-12 bg-accent-100 text-accent-600 dark:bg-accent-500/20 dark:text-accent-400 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Terms of Service</h1>
                        <p className="text-surface-500">Effective Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="prose prose-surface dark:prose-invert max-w-none space-y-6 text-surface-600 dark:text-surface-400">
                    <p>
                        <strong>Note to Admin:</strong> Replace this entire section with your official Terms of Service text.
                    </p>

                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
                    </p>

                    <h2 className="text-xl font-bold text-surface-900 dark:text-white mt-8 mb-4">2. Account Responsibilities</h2>
                    <p>
                        You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
                    </p>
                </div>

                <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 text-center">
                    <Link to="/" className="text-primary-500 font-medium hover:underline">
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
