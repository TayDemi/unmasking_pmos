/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DiagnosticWorkspace } from './components/DiagnosticWorkspace';
import { ModelTransparencyView } from './components/ModelTransparencyView';
import { BatchScreeningView } from './components/BatchScreeningView';
import { PatientReportModal } from './components/PatientReportModal';
import { INITIAL_PATIENTS } from './data/mockPatients';
import { PatientData } from './types/pcos';
import { ShieldAlert, Info } from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<PatientData[]>(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(INITIAL_PATIENTS[0].id);
  const [activeTab, setActiveTab] = useState<'cohort' | 'workspace' | 'model' | 'batch'>('cohort');
  const [reportModalPatient, setReportModalPatient] = useState<PatientData | null>(null);

  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setActiveTab('workspace');
  };

  const handleUpdatePatient = (updated: PatientData) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleUpdateStatus = (patientId: string, status: PatientData['triageStatus']) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          triageStatus: status,
          lastEvaluatedDate: new Date().toISOString().slice(0, 10)
        };
      }
      return p;
    }));
  };

  const handleNewEvaluation = () => {
    const newId = `pt-case-${Date.now().toString().slice(-4)}`;
    const newPatient: PatientData = {
      id: newId,
      name: 'New Patient Case',
      age: 25,
      mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
      registeredDate: new Date().toISOString().slice(0, 10),
      lastEvaluatedDate: new Date().toISOString().slice(0, 10),
      triageStatus: 'pending',
      assignedDoctor: 'Attending Clinician',
      weightKg: 65,
      heightCm: 165,
      bmi: 23.9,
      bloodGroup: 'O+',
      pulseRateBpm: 72,
      systolicBp: 120,
      diastolicBp: 80,
      cycleRegularity: 'Regular',
      cycleLengthDays: 28,
      marriageStatusYears: 0,
      pregnant: false,
      abortionsCount: 0,
      fsh: 5.5,
      lh: 6.0,
      lhFshRatio: 1.09,
      amh: 3.2,
      tsh: 2.0,
      prolactin: 14.0,
      vitaminD3: 30.0,
      progesterone: 1.0,
      randomBloodSugar: 90,
      follicleCountLeft: 6,
      follicleCountRight: 6,
      totalFollicles: 12,
      avgFollicleSizeLeftMm: 5.0,
      avgFollicleSizeRightMm: 5.0,
      endometriumThicknessMm: 7.5,
      weightGain: false,
      excessHairGrowth: false,
      skinDarkening: false,
      hairLoss: false,
      pimplesOrAcne: false,
      highFastFoodDiet: false,
      regularExercise: true,
      doctorNotes: 'Initial intake baseline consultation.',
      phenotypeClassification: 'None',
      treatmentProtocol: []
    };

    setPatients(prev => [newPatient, ...prev]);
    setSelectedPatientId(newId);
    setActiveTab('workspace');
  };

  const handleImportToCohort = (newPatients: PatientData[]) => {
    setPatients(prev => [...newPatients, ...prev]);
    setActiveTab('cohort');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Clinical Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewEvaluation={handleNewEvaluation}
        patientCount={patients.length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'cohort' && (
          <DashboardView
            patients={patients}
            onSelectPatient={handleSelectPatient}
            onOpenReport={(p) => setReportModalPatient(p)}
            onUpdateStatus={handleUpdateStatus}
            onNewEvaluation={handleNewEvaluation}
          />
        )}

        {activeTab === 'workspace' && currentPatient && (
          <DiagnosticWorkspace
            currentPatient={currentPatient}
            allPatients={patients}
            onSelectPatient={setSelectedPatientId}
            onUpdatePatient={handleUpdatePatient}
            onOpenReport={(p) => setReportModalPatient(p)}
          />
        )}

        {activeTab === 'model' && (
          <ModelTransparencyView />
        )}

        {activeTab === 'batch' && (
          <BatchScreeningView
            onSelectPatient={handleSelectPatient}
            onImportToCohort={handleImportToCohort}
          />
        )}
      </main>

      {/* Clinical Disclaimer Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Clinical Decision Support based on{' '}
              <a 
                href="https://github.com/TayDemi/pcos-ml-detection" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-slate-800"
              >
                TayDemi/pcos-ml-detection
              </a>
              {' '}and Rotterdam 2003 / 2023 International Consensus.
            </span>
          </div>

          <div className="text-slate-400 text-[11px]">
            For healthcare professional evaluation only · Not a substitute for clinical judgment
          </div>
        </div>
      </footer>

      {/* Printable EHR Report Modal */}
      {reportModalPatient && (
        <PatientReportModal
          patient={reportModalPatient}
          onClose={() => setReportModalPatient(null)}
        />
      )}
    </div>
  );
}
