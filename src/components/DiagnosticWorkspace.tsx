import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, 
  FileText, Save, RefreshCw, ChevronDown, User, HeartPulse, 
  Stethoscope, ShieldAlert, Zap
} from 'lucide-react';
import { PatientData } from '../types/pcos';
import { 
  calculatePcosPrediction, 
  evaluateRotterdamCriteria, 
  analyzeLabAnomalies 
} from '../lib/pcosModelEngine';
import { generateClinicalSynthesis } from '../lib/geminiAssistant';

interface DiagnosticWorkspaceProps {
  currentPatient: PatientData;
  allPatients: PatientData[];
  onSelectPatient: (patientId: string) => void;
  onUpdatePatient: (updated: PatientData) => void;
  onOpenReport: (patient: PatientData) => void;
}

export const DiagnosticWorkspace: React.FC<DiagnosticWorkspaceProps> = ({
  currentPatient,
  allPatients,
  onSelectPatient,
  onUpdatePatient,
  onOpenReport
}) => {
  const [formData, setFormData] = useState<PatientData>(currentPatient);
  const [activeFormTab, setActiveFormTab] = useState<'vitals' | 'menstrual' | 'labs' | 'usg' | 'symptoms'>('vitals');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Sync internal form when prop changes
  useEffect(() => {
    setFormData(currentPatient);
    setAiSummary('');
  }, [currentPatient.id]);

  // Recalculate BMI and LH/FSH dynamically when inputs change
  const handleNumericChange = (field: keyof PatientData, value: number) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-recalculate BMI if height or weight changed
      if (field === 'weightKg' || field === 'heightCm') {
        const heightM = next.heightCm / 100;
        if (heightM > 0) {
          next.bmi = Number((next.weightKg / (heightM * heightM)).toFixed(1));
        }
      }

      // Auto-recalculate LH/FSH ratio
      if (field === 'lh' || field === 'fsh') {
        if (next.fsh > 0) {
          next.lhFshRatio = Number((next.lh / next.fsh).toFixed(2));
        }
      }

      // Auto-recalculate Total Follicles
      if (field === 'follicleCountLeft' || field === 'follicleCountRight') {
        next.totalFollicles = (next.follicleCountLeft || 0) + (next.follicleCountRight || 0);
      }

      return next;
    });
  };

  const handleBooleanToggle = (field: keyof PatientData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Run Real-Time ML Engine
  const prediction = calculatePcosPrediction(formData);
  const rotterdam = evaluateRotterdamCriteria(formData);
  const anomalies = analyzeLabAnomalies(formData);

  const handleSaveChanges = () => {
    onUpdatePatient({
      ...formData,
      lastEvaluatedDate: new Date().toISOString().slice(0, 10)
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleGenerateAiConsult = async () => {
    setIsGeneratingAi(true);
    try {
      const result = await generateClinicalSynthesis(formData, prediction, rotterdam, anomalies);
      setAiSummary(result);
    } catch (err) {
      console.error('Error generating synthesis:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const toggleTreatment = (treatment: string) => {
    setFormData(prev => {
      const list = prev.treatmentProtocol || [];
      const exists = list.includes(treatment);
      return {
        ...prev,
        treatmentProtocol: exists ? list.filter(t => t !== treatment) : [...list, treatment]
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Patient Case Selector Header Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="patient-case-select" className="sr-only">Select patient case</label>
              <select
                id="patient-case-select"
                value={formData.id}
                onChange={(e) => onSelectPatient(e.target.value)}
                className="text-base font-semibold text-slate-900 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                {allPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn}) · Age {p.age}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none -ml-1" />
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>MRN: <strong className="text-slate-700 font-mono">{formData.mrn}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Physician: {formData.assignedDoctor}</span>
              <span aria-hidden="true">·</span>
              <span>Last evaluated: {formData.lastEvaluatedDate}</span>
            </div>
          </div>
        </div>

        {/* Status Dropdown & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">Triage:</span>
            <select
              value={formData.triageStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, triageStatus: e.target.value as any }))}
              aria-label="Patient triage status"
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="pending">Pending Triage</option>
              <option value="in_review">In Review</option>
              <option value="confirmed_pcos">Confirmed PCOS</option>
              <option value="further_workup">Further Workup</option>
              <option value="ruled_out">Ruled Out</option>
            </select>
          </div>

          <button
            onClick={handleSaveChanges}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-medium transition-colors shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savedFeedback ? 'Saved!' : 'Save Evaluation'}</span>
          </button>

          <button
            onClick={() => onOpenReport(formData)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Consultation Letter</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Clinical Data Forms, Right Real-time ML & Rotterdam Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Clinical Parameters Input (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            {/* Category Tab Bar (Functional segmented buttons) */}
            <div className="border-b border-slate-200 bg-slate-50 p-1 flex gap-1 overflow-x-auto text-xs font-medium">
              <button
                onClick={() => setActiveFormTab('vitals')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFormTab === 'vitals'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-slate-500" />
                <span>1. Vitals & Body</span>
              </button>

              <button
                onClick={() => setActiveFormTab('menstrual')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFormTab === 'menstrual'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>2. Menstrual Cycle</span>
              </button>

              <button
                onClick={() => setActiveFormTab('labs')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFormTab === 'labs'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                <span>3. Endocrine Labs</span>
                {anomalies.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </button>

              <button
                onClick={() => setActiveFormTab('usg')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFormTab === 'usg'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                <span>4. Ultrasound (USG)</span>
              </button>

              <button
                onClick={() => setActiveFormTab('symptoms')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeFormTab === 'symptoms'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-slate-500" />
                <span>5. Clinical Signs</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5">
              {/* 1. Demographics & Vitals */}
              {activeFormTab === 'vitals' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Age (Years)</label>
                      <input
                        type="number"
                        min="12"
                        max="65"
                        value={formData.age}
                        onChange={(e) => handleNumericChange('age', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="30"
                        max="200"
                        value={formData.weightKg}
                        onChange={(e) => handleNumericChange('weightKg', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        min="100"
                        max="220"
                        value={formData.heightCm}
                        onChange={(e) => handleNumericChange('heightCm', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Calculated BMI (kg/m²)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          readOnly
                          value={formData.bmi}
                          className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm font-semibold text-slate-800"
                        />
                        <span className="text-[11px] whitespace-nowrap text-slate-500">
                          {formData.bmi >= 30 ? 'Obese' : formData.bmi >= 25 ? 'Overweight' : 'Normal'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Systolic BP (mmHg)</label>
                      <input
                        type="number"
                        min="80"
                        max="220"
                        value={formData.systolicBp}
                        onChange={(e) => handleNumericChange('systolicBp', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Diastolic BP (mmHg)</label>
                      <input
                        type="number"
                        min="50"
                        max="140"
                        value={formData.diastolicBp}
                        onChange={(e) => handleNumericChange('diastolicBp', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Pulse Rate (bpm)</label>
                      <input
                        type="number"
                        min="40"
                        max="160"
                        value={formData.pulseRateBpm}
                        onChange={(e) => handleNumericChange('pulseRateBpm', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData(p => ({ ...p, bloodGroup: e.target.value as any }))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Menstrual & Reproductive Dynamics */}
              {activeFormTab === 'menstrual' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Cycle Regularity</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, cycleRegularity: 'Regular' }))}
                          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium border transition-colors ${
                            formData.cycleRegularity === 'Regular'
                              ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs font-semibold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Regular (21–35 days)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, cycleRegularity: 'Irregular' }))}
                          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium border transition-colors ${
                            formData.cycleRegularity === 'Irregular'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-2xs font-semibold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Irregular / Oligomenorrhea
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Rotterdam Criterion 1 (Ovulatory dysfunction)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Average Cycle Interval (Days): <span className="font-semibold text-slate-900">{formData.cycleLengthDays} days</span>
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="90"
                        value={formData.cycleLengthDays}
                        onChange={(e) => handleNumericChange('cycleLengthDays', Number(e.target.value))}
                        className="w-full accent-teal-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                        <span>20d (Frequent)</span>
                        <span>28d (Normal)</span>
                        <span>&gt;35d (Oligomenorrhea)</span>
                        <span>&gt;90d (Amenorrhea)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Years Married / Cohabiting</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.marriageStatusYears}
                        onChange={(e) => handleNumericChange('marriageStatusYears', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Prior Abortions / Miscarriages</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.abortionsCount}
                        onChange={(e) => handleNumericChange('abortionsCount', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Endocrine & Biochemical Labs */}
              {activeFormTab === 'labs' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        LH (Luteinizing Hormone, mIU/mL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="60"
                        value={formData.lh}
                        onChange={(e) => handleNumericChange('lh', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className="text-[11px] text-slate-400">Ref: 2.0 - 10.0 mIU/mL</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        FSH (Follicle-Stimulating, mIU/mL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="40"
                        value={formData.fsh}
                        onChange={(e) => handleNumericChange('fsh', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className="text-[11px] text-slate-400">Ref: 3.5 - 12.5 mIU/mL</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        LH / FSH Ratio (Calculated)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          readOnly
                          value={formData.lhFshRatio}
                          className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm font-semibold text-slate-800"
                        />
                        <span className={`text-[11px] font-medium whitespace-nowrap ${
                          formData.lhFshRatio >= 2.0 ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          {formData.lhFshRatio >= 2.0 ? 'Elevated (≥2.0)' : 'Physiologic'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        AMH (Anti-Müllerian, ng/mL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.2"
                        max="35"
                        value={formData.amh}
                        onChange={(e) => handleNumericChange('amh', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className={`text-[11px] ${formData.amh >= 5.0 ? 'text-rose-600 font-medium' : 'text-slate-400'}`}>
                        Normal: 1.5 - 4.0 ng/mL
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        TSH (Thyrotropin, uIU/mL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="25"
                        value={formData.tsh}
                        onChange={(e) => handleNumericChange('tsh', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className={`text-[11px] ${formData.tsh > 4.5 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                        Ref: 0.4 - 4.0 uIU/mL
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Prolactin (PRL, ng/mL)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="100"
                        value={formData.prolactin}
                        onChange={(e) => handleNumericChange('prolactin', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className={`text-[11px] ${formData.prolactin > 25 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                        Ref: 2.0 - 20.0 ng/mL
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Vitamin D3 (25-OH, ng/mL)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="5"
                        max="120"
                        value={formData.vitaminD3}
                        onChange={(e) => handleNumericChange('vitaminD3', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className="text-[11px] text-slate-400">Optimum: &gt; 30.0 ng/mL</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Random Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="350"
                        value={formData.randomBloodSugar}
                        onChange={(e) => handleNumericChange('randomBloodSugar', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className="text-[11px] text-slate-400">Normal: 70 - 125 mg/dL</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Pelvic Ultrasonography (USG) */}
              {activeFormTab === 'usg' && (
                <div className="space-y-4">
                  <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-md text-xs text-teal-900 mb-3">
                    <strong>Rotterdam PCOM Definition:</strong> ≥12 follicles (2–9 mm diameter) in either ovary or ovarian volume &gt;10 mL (or ≥20 follicles with modern high-frequency transducers).
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Follicle Count (Left Ovary)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={formData.follicleCountLeft}
                        onChange={(e) => handleNumericChange('follicleCountLeft', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className={`text-[11px] ${formData.follicleCountLeft >= 12 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                        {formData.follicleCountLeft >= 12 ? 'PCOM Criteria Met (≥12)' : 'Normal (<12)'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Follicle Count (Right Ovary)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={formData.follicleCountRight}
                        onChange={(e) => handleNumericChange('follicleCountRight', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className={`text-[11px] ${formData.follicleCountRight >= 12 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                        {formData.follicleCountRight >= 12 ? 'PCOM Criteria Met (≥12)' : 'Normal (<12)'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Total Antral Follicles
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={formData.totalFollicles}
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm font-semibold text-slate-800"
                      />
                      <span className="text-[11px] text-slate-500">
                        Top ML predictor weight
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Endometrium Thickness (mm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="30"
                        value={formData.endometriumThicknessMm}
                        onChange={(e) => handleNumericChange('endometriumThicknessMm', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                      <span className="text-[11px] text-slate-400">Ref: 4 - 12 mm</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Avg Follicle Size Left (mm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="25"
                        value={formData.avgFollicleSizeLeftMm}
                        onChange={(e) => handleNumericChange('avgFollicleSizeLeftMm', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Avg Follicle Size Right (mm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="25"
                        value={formData.avgFollicleSizeRightMm}
                        onChange={(e) => handleNumericChange('avgFollicleSizeRightMm', Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Clinical Symptoms & Hyperandrogenism */}
              {activeFormTab === 'symptoms' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500 mb-2">
                    Check all positive physical examination markers reported by the patient:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('excessHairGrowth')}
                      className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                        formData.excessHairGrowth
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.excessHairGrowth}
                        readOnly
                        aria-label="Clinical hirsutism"
                        className="mt-0.5 rounded text-teal-600 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-semibold">Clinical Hirsutism (Excess Hair)</div>
                        <div className="text-[11px] text-slate-500">Coarse hair on upper lip, chin, chest, abdomen</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('skinDarkening')}
                      className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                        formData.skinDarkening
                          ? 'bg-purple-50/70 border-purple-300 text-purple-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.skinDarkening}
                        readOnly
                        aria-label="Acanthosis Nigricans"
                        className="mt-0.5 rounded text-teal-600 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-semibold">Acanthosis Nigricans (Skin Darkening)</div>
                        <div className="text-[11px] text-slate-500">Hyperpigmented velvety patches (insulin resistance)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('pimplesOrAcne')}
                      className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                        formData.pimplesOrAcne
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.pimplesOrAcne}
                        readOnly
                        aria-label="Severe persistent acne"
                        className="mt-0.5 rounded text-teal-600 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-semibold">Severe / Cystic Acne</div>
                        <div className="text-[11px] text-slate-500">Treatment-resistant facial or mandibular acne</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('hairLoss')}
                      className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                        formData.hairLoss
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.hairLoss}
                        readOnly
                        aria-label="Androgenic alopecia"
                        className="mt-0.5 rounded text-teal-600 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-semibold">Androgenic Alopecia (Hair Thinning)</div>
                        <div className="text-[11px] text-slate-500">Vertex or crown hair density reduction</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('weightGain')}
                      className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                        formData.weightGain
                          ? 'bg-blue-50/70 border-blue-300 text-blue-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.weightGain}
                        readOnly
                        aria-label="Rapid weight gain"
                        className="mt-0.5 rounded text-teal-600 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-semibold">Rapid Recent Weight Gain</div>
                        <div className="text-[11px] text-slate-500">Unexplained difficulty with weight control</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBooleanToggle('highFastFoodDiet')}
                      className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 ${
                        formData.highFastFoodDiet
                          ? 'bg-orange-50/70 border-orange-300 text-orange-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.highFastFoodDiet}
                        readOnly
                        aria-label="High glycemic diet"
                        className="mt-0.5 rounded text-teal-600 border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-semibold">High Glycemic / Fast Food Diet</div>
                        <div className="text-[11px] text-slate-500">Frequent intake of refined carbohydrates</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clinician Decision & Care Protocol Station */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Physician Diagnosis & Clinical Notes</h2>
                <p className="text-xs text-slate-500">Official sign-off & care pathway management</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Classification:</span>
                <select
                  value={formData.phenotypeClassification || 'None'}
                  onChange={(e) => setFormData(p => ({ ...p, phenotypeClassification: e.target.value as any }))}
                  aria-label="Phenotype classification"
                  className="text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
                >
                  <option value="None">None / Ruled Out</option>
                  <option value="None / Insufficient Criteria">None / Insufficient Criteria</option>
                  <option value="Phenotype A (Full)">Phenotype A (Full: Oligo + Hyperandrogen + PCOM)</option>
                  <option value="Phenotype B (Non-PCO)">Phenotype B (Oligo + Hyperandrogen)</option>
                  <option value="Phenotype C (Ovulatory)">Phenotype C (Ovulatory + Hyperandrogen + PCOM)</option>
                  <option value="Phenotype D (Non-Hyperandrogenic)">Phenotype D (Oligo + PCOM)</option>
                </select>
              </div>
            </div>

            {/* Notes textarea */}
            <div>
              <label htmlFor="physician-clinical-notes" className="block text-xs font-medium text-slate-700 mb-1">
                Attending Physician Assessment & Progress Note
              </label>
              <textarea
                id="physician-clinical-notes"
                rows={3}
                value={formData.doctorNotes || ''}
                onChange={(e) => setFormData(p => ({ ...p, doctorNotes: e.target.value }))}
                placeholder="Enter clinical examination observations, pelvic ultrasound notes, and differential exclusions..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
              />
            </div>

            {/* Clinical Care Protocols Checklist */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Recommended Management Protocols
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  'Lifestyle & 150min/wk Exercise',
                  'Metformin ER (Insulin Sensitizer)',
                  'Combined Oral Contraceptives',
                  'Myo-Inositol & D-Chiro (40:1)',
                  'Spironolactone (Anti-androgen)',
                  'Endometrial Ultrasound Surveillance',
                  'Oral Glucose Tolerance Test (OGTT)'
                ].map(item => {
                  const active = (formData.treatmentProtocol || []).includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleTreatment(item)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                        active
                          ? 'bg-teal-50 text-teal-900 border-teal-300 font-medium'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time ML Inference, Explainability & Rotterdam Check (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Real-time ML Prediction Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ML Model Detection
                </span>
                <div className="text-xs text-slate-400 mt-0.5">XGBoost & Random Forest Ensemble</div>
              </div>

              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                prediction.percentage >= 68
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : prediction.percentage >= 38
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {prediction.riskTier}
              </span>
            </div>

            {/* Probability Gauge */}
            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-bold tracking-tight text-slate-900 font-mono">
                  {prediction.percentage}%
                </span>
                <span className="text-xs text-slate-500 ml-2">probability of PCOS</span>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span>95% CI: [{prediction.confidenceInterval[0]}% – {prediction.confidenceInterval[1]}%]</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  prediction.percentage >= 68
                    ? 'bg-rose-500'
                    : prediction.percentage >= 38
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${prediction.percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Low (&lt;38%)</span>
              <span>Borderline (38–67%)</span>
              <span>High Risk (≥68%)</span>
            </div>
          </div>

          {/* Explainable AI (SHAP-style Feature Contributions) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Feature Importance Attribution
                </h3>
                <p className="text-[11px] text-slate-400">Top patient factors influencing model output</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">SHAP-Derived</span>
            </div>

            <div className="space-y-2.5">
              {prediction.contributions.slice(0, 5).map((contrib, idx) => {
                const isPositive = contrib.impact > 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{contrib.featureName}</span>
                      <span className={`font-mono font-semibold ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isPositive ? `+${contrib.impact}%` : `${contrib.impact}%`}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                      {isPositive ? (
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, contrib.impact * 3)}%` }}
                        />
                      ) : (
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.abs(contrib.impact) * 3)}%` }}
                        />
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="font-mono text-slate-600">{contrib.valueDisplay}</span>
                      <span className="truncate max-w-[200px] text-slate-400">{contrib.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rotterdam Consensus Criteria Evaluator (2003 / 2023) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Rotterdam Diagnostic Criteria
                </h3>
                <p className="text-[11px] text-slate-400">Requires ≥2 of 3 features</p>
              </div>
              <div className={`text-xs font-semibold px-2 py-0.5 rounded ${
                rotterdam.satisfiesRotterdam 
                  ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {rotterdam.metCriteriaCount}/3 Met
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {/* Criterion 1 */}
              <div className="flex items-start gap-2.5 p-2 rounded bg-slate-50 border border-slate-100">
                <div className="mt-0.5">
                  {rotterdam.criteria1_ovulation ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 block" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-slate-800">1. Oligo- or Anovulation</div>
                  <div className="text-[11px] text-slate-500">
                    {rotterdam.criteria1_ovulation 
                      ? `Positive: ${formData.cycleRegularity} cycle (${formData.cycleLengthDays}d interval)` 
                      : 'Negative: Regular 21–35d menstrual rhythm'}
                  </div>
                </div>
              </div>

              {/* Criterion 2 */}
              <div className="flex items-start gap-2.5 p-2 rounded bg-slate-50 border border-slate-100">
                <div className="mt-0.5">
                  {rotterdam.criteria2_androgen ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 block" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-slate-800">2. Clinical / Biochemical Hyperandrogenism</div>
                  <div className="text-[11px] text-slate-500">
                    {rotterdam.criteria2_androgen
                      ? 'Positive: Cutaneous signs or elevated LH/FSH ratio'
                      : 'Negative: No clinical or biochemical androgen excess'}
                  </div>
                </div>
              </div>

              {/* Criterion 3 */}
              <div className="flex items-start gap-2.5 p-2 rounded bg-slate-50 border border-slate-100">
                <div className="mt-0.5">
                  {rotterdam.criteria3_polycysticOvaries ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 block" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-slate-800">3. Polycystic Ovarian Morphology (PCOM)</div>
                  <div className="text-[11px] text-slate-500">
                    {rotterdam.criteria3_polycysticOvaries
                      ? `Positive: L:${formData.follicleCountLeft}, R:${formData.follicleCountRight} (≥12 follicles)`
                      : `Negative: Antral count below diagnostic threshold (<12 per ovary)`}
                  </div>
                </div>
              </div>
            </div>

            {/* Phenotype result */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Consensus Phenotype:</span>
              <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {rotterdam.derivedPhenotype}
              </span>
            </div>
          </div>

          {/* Differential Diagnosis & Lab Alerts */}
          {anomalies.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Lab Anomalies & Differential Exclusions</span>
              </div>
              <div className="space-y-1.5">
                {anomalies.map((anom, idx) => (
                  <div key={idx} className="p-2 rounded bg-amber-50/60 border border-amber-200 text-xs">
                    <div className="flex justify-between font-medium text-amber-900">
                      <span>{anom.marker}: {anom.value} {anom.unit}</span>
                      <span className="text-[11px] text-amber-700 font-mono">Ref: {anom.normalRange}</span>
                    </div>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      {anom.clinicalSignificance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Clinical Assistant (Gemini API Integration) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  AI Clinical Consultation
                </h3>
              </div>
              <button
                onClick={handleGenerateAiConsult}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>{aiSummary ? 'Regenerate' : 'Generate Synthesis'}</span>
                  </>
                )}
              </button>
            </div>

            {aiSummary ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-line font-sans">
                {aiSummary}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-md text-center text-xs text-slate-500">
                Click <strong>Generate Synthesis</strong> to synthesize Rotterdam findings, ML predictions, and differential exclusions into a formal endocrinology consult note.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
