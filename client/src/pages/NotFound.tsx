import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Sparkles, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
          <h2 className="text-xl font-bold">Orbit Trajectory Lost</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The page or task you are looking for does not exist in this sector.
          </p>
        </div>

        <Link to="/dashboard">
          <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
            Return to Mission Control
          </Button>
        </Link>
      </div>
    </div>
  );
};
