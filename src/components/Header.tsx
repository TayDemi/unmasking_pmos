import React from 'react';
import { Activity, Users, Stethoscope, Sliders, UploadCloud, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'cohort' | 'workspace' | 'model' | 'batch';
  setActiveTab: (tab: 'cohort' | 'workspace' | 'model' | 'batch') => void;
  onNewEvaluation: () => void;
  patientCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewEvaluation,
  patientCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinical System Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 tracking-tight text-base">
                    PCOS-ML
                  </span>
                  <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Clinical Studio
                  </span>
                </div>
                <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
                  <span>Diagnostic Decision Support</span>
                  <span aria-hidden="true">·</span>
                  <span>Rotterdam 2003 / 2023 Criteria</span>
                </div>
              </div>
            </div>

            <a
              href="https://github.com/TayDemi/pcos-ml-detection"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors ml-2 pl-3 border-l border-slate-200"
              title="View original model repository on GitHub"
            >
              <span>TayDemi/pcos-ml-detection</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          {/* Navigation Tabs (Functional interactive segmented control) */}
          <nav className="flex items-center p-1 bg-slate-100 rounded-lg text-sm font-medium">
            <button
              onClick={() => setActiveTab('cohort')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'cohort'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Patient Cohort</span>
              <span className="text-xs text-slate-400 ml-1 font-mono">({patientCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'workspace'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-slate-500" />
              <span>Diagnostic Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('model')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'model'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Model Transparency</span>
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'batch'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <span>Batch CSV</span>
            </button>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Model Ready (95.4% Acc)</span>
            </div>
            <button
              onClick={onNewEvaluation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <span>+ New Patient Case</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
