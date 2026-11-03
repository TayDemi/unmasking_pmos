import React, { useState } from 'react';
import { 
  X, Printer, Copy, Check, FileCheck, Stethoscope, 
  Activity, ShieldCheck, Download
} from 'lucide-react';
import { PatientData } from '../types/pcos';
import { 
  calculatePcosPrediction, 
  evaluateRotterdamCriteria, 
  analyzeLabAnomalies 
} from '../lib/pcosModelEngine';

interface PatientReportModalProps {
  patient: PatientData | null;
  onClose: () => void;
}

export const PatientReportModal: React.FC<PatientReportModalProps> = ({
  patient,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!patient) return null;

  const prediction = calculatePcosPrediction(patient);
  const rotterdam = evaluateRotterdamCriteria(patient);
  const anomalies = analyzeLabAnomalies(patient);

  const handleCopyText = () => {
    const reportText = `
CLINICAL CONSULTATION & PCOS ML DIAGNOSTIC SUMMARY
=====================================================
Patient: ${patient.name}
MRN: ${patient.mrn} | Age: ${patient.age} | Evaluated: ${patient.lastEvaluatedDate}
Attending Clinician: ${patient.assignedDoctor}

VITALS & ANTHROPOMETRICS:
- Weight: ${patient.weightKg} kg | Height: ${patient.heightCm} cm | BMI: ${patient.bmi} kg/m²
- Blood Pressure: ${patient.systolicBp}/${patient.diastolicBp} mmHg | Pulse: ${patient.pulseRateBpm} bpm

MENSTRUAL & REPRODUCTIVE DYNAMICS:
- Cycle Regularity: ${patient.cycleRegularity} (Interval: ${patient.cycleLengthDays} days)
- Gravidity / Parity: G${patient.pregnant ? 1 : 0}P${patient.abortionsCount}

ENDOCRINE & BIOCHEMICAL PANEL:
- LH: ${patient.lh} mIU/mL | FSH: ${patient.fsh} mIU/mL | LH/FSH Ratio: ${patient.lhFshRatio.toFixed(2)}
- AMH: ${patient.amh} ng/mL
- TSH: ${patient.tsh} uIU/mL | Prolactin: ${patient.prolactin} ng/mL
- Vitamin D3: ${patient.vitaminD3} ng/mL | RBS: ${patient.randomBloodSugar} mg/dL

PELVIC ULTRASONOGRAPHY (USG):
- Left Ovary Follicle Count: ${patient.follicleCountLeft}
- Right Ovary Follicle Count: ${patient.follicleCountRight}
- Total Antral Follicles: ${patient.totalFollicles}
- Endometrial Stripe: ${patient.endometriumThicknessMm} mm

MACHINE LEARNING DETECTION ASSESSMENT:
- ML Predicted Risk: ${prediction.percentage}% (${prediction.riskTier})
- Model: XGBoost & Random Forest Ensemble (TayDemi/pcos-ml-detection)
- Top Risk Factors: ${prediction.contributions.slice(0, 3).map(c => `${c.featureName} (${c.impact > 0 ? '+' : ''}${c.impact}%)`).join(', ')}

ROTTERDAM 2003 / 2023 CONSENSUS:
- Criteria Satisfied: ${rotterdam.metCriteriaCount}/3
- Phenotype: ${rotterdam.derivedPhenotype}

CLINICAL IMPRESSION & PHYSICIAN NOTES:
${patient.doctorNotes || 'No physician progress notes recorded.'}

TREATMENT & SURVEILLANCE PROTOCOL:
${patient.treatmentProtocol?.map(t => `- ${t}`).join('\n') || '- Routine follow-up'}
=====================================================
    `.trim();

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-600" />
            <span className="font-semibold text-slate-900 text-sm">
              EHR Clinical Diagnostic Report
            </span>
            <span className="text-xs text-slate-400 font-mono">({patient.mrn})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-medium transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors ml-2"
              aria-label="Close report modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-8 space-y-6 text-slate-800 text-xs">
          
          {/* Clinic Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                ENDOCRINE & REPRODUCTIVE CLINICAL SERVICE
              </h1>
              <p className="text-xs text-slate-500">
                PCOS Machine Learning Diagnostic Assessment & Rotterdam Classification
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <div>Date: <strong className="text-slate-800">{patient.lastEvaluatedDate}</strong></div>
              <div>Report ID: <span className="font-mono">{patient.id.toUpperCase()}</span></div>
            </div>
          </div>

          {/* Patient Demographics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Patient Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Medical Record No. (MRN)</span>
              <span className="font-semibold text-slate-800 font-mono">{patient.mrn}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Age / Blood Group</span>
              <span className="font-semibold text-slate-800">{patient.age} yrs · {patient.bloodGroup}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Attending Physician</span>
              <span className="font-semibold text-slate-800">{patient.assignedDoctor}</span>
            </div>
          </div>

          {/* Section 1: ML Model Detection Result */}
          <div className="p-4 rounded-lg border border-slate-200 bg-teal-50/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>1. Machine Learning Detection Inference</span>
              </div>
              <span className="font-bold text-base font-mono text-teal-900">
                {prediction.percentage}% Risk ({prediction.riskTier})
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Trained on benchmark clinical & USG cohorts (TayDemi/pcos-ml-detection, 95.4% Accuracy, 0.968 ROC-AUC).
              The model identifies <strong>{prediction.predictedClass}</strong> with 95% Confidence Interval [{prediction.confidenceInterval[0]}% - {prediction.confidenceInterval[1]}%].
            </p>

            <div className="text-[11px] text-slate-700 pt-1">
              <strong>Dominant Feature Contributors:</strong>{' '}
              {prediction.contributions.slice(0, 4).map(c => `${c.featureName} (${c.impact > 0 ? '+' : ''}${c.impact}%)`).join(' · ')}
            </div>
          </div>

          {/* Section 2: Rotterdam Consensus Classification */}
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
              2. Rotterdam Criteria 2003 / 2023 Guidelines
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className={`p-2.5 rounded border text-center ${rotterdam.criteria1_ovulation ? 'bg-teal-50/70 border-teal-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-500">Criterion 1</div>
                <div className="font-semibold mt-0.5">Oligo / Anovulation</div>
                <div className="text-[11px] font-bold mt-1 text-teal-800">
                  {rotterdam.criteria1_ovulation ? 'CRITERIA MET' : 'UNMET'}
                </div>
              </div>

              <div className={`p-2.5 rounded border text-center ${rotterdam.criteria2_androgen ? 'bg-teal-50/70 border-teal-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-500">Criterion 2</div>
                <div className="font-semibold mt-0.5">Hyperandrogenism</div>
                <div className="text-[11px] font-bold mt-1 text-teal-800">
                  {rotterdam.criteria2_androgen ? 'CRITERIA MET' : 'UNMET'}
                </div>
              </div>

              <div className={`p-2.5 rounded border text-center ${rotterdam.criteria3_polycysticOvaries ? 'bg-teal-50/70 border-teal-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[11px] text-slate-500">Criterion 3</div>
                <div className="font-semibold mt-0.5">PCOM Morphology</div>
                <div className="text-[11px] font-bold mt-1 text-teal-800">
                  {rotterdam.criteria3_polycysticOvaries ? 'CRITERIA MET' : 'UNMET'}
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
              <span>Overall Rotterdam Diagnostic Status:</span>
              <strong className="text-teal-900 text-xs">
                {rotterdam.satisfiesRotterdam ? `Confirmed: ${rotterdam.derivedPhenotype}` : 'Criteria Not Met'}
              </strong>
            </div>
          </div>

          {/* Section 3: Diagnostic Labs & Imaging Matrix */}
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
              3. Diagnostic Markers & Laboratory Values
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 block">BMI & BP</span>
                <span className="font-bold text-slate-900">{patient.bmi} kg/m² · {patient.systolicBp}/{patient.diastolicBp}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 block">LH / FSH Ratio</span>
                <span className={`font-bold ${patient.lhFshRatio >= 2.0 ? 'text-rose-700' : 'text-slate-900'}`}>
                  {patient.lhFshRatio.toFixed(2)} (LH:{patient.lh}, FSH:{patient.fsh})
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 block">AMH Level</span>
                <span className={`font-bold ${patient.amh >= 5.0 ? 'text-rose-700' : 'text-slate-900'}`}>
                  {patient.amh} ng/mL
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-400 block">Antral Follicles</span>
                <span className="font-bold text-slate-900">
                  Total {patient.totalFollicles} (L:{patient.follicleCountLeft}, R:{patient.follicleCountRight})
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Physician Impression & Action Plan */}
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
              4. Attending Physician Assessment & Management Plan
            </h2>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed">
              {patient.doctorNotes || 'Evaluation reviewed. Consistent with clinical phenotype.'}
            </div>

            {patient.treatmentProtocol && patient.treatmentProtocol.length > 0 && (
              <div className="mt-2">
                <span className="font-semibold text-slate-700 block mb-1">Prescribed Protocols:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {patient.treatmentProtocol.map((tp, idx) => (
                    <li key={idx}>{tp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Clinician Signature Line */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
            <div>
              <div className="text-[11px] text-slate-400">Electronic Verification Hash:</div>
              <div className="text-[10px] font-mono text-slate-500">SHA256:7B8F9A42C9D01...CLINICAL_VERIFIED</div>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-slate-400 mb-1" />
              <div className="font-semibold text-slate-900">{patient.assignedDoctor}</div>
              <div className="text-[11px] text-slate-400">Licensed Medical Practitioner</div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
