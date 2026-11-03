import React, { useState } from 'react';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, 
  Download, RefreshCw, ChevronRight, Play 
} from 'lucide-react';
import { PatientData } from '../types/pcos';
import { calculatePcosPrediction, evaluateRotterdamCriteria } from '../lib/pcosModelEngine';

interface BatchScreeningViewProps {
  onSelectPatient: (patientId: string) => void;
  onImportToCohort: (patients: PatientData[]) => void;
}

export const BatchScreeningView: React.FC<BatchScreeningViewProps> = ({
  onSelectPatient,
  onImportToCohort
}) => {
  const [batchRows, setBatchRows] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Generate synthetic batch cohort
  const generateSampleCohort = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const syntheticBatch = [
        {
          id: 'batch-01',
          name: 'Nadia Petrova',
          age: 27,
          mrn: 'BATCH-201',
          registeredDate: '2026-11-03',
          lastEvaluatedDate: '2026-11-03',
          triageStatus: 'pending',
          assignedDoctor: 'Dr. Sarah Lin, MD',
          weightKg: 74,
          heightCm: 165,
          bmi: 27.2,
          bloodGroup: 'A+',
          pulseRateBpm: 75,
          systolicBp: 126,
          diastolicBp: 82,
          cycleRegularity: 'Irregular',
          cycleLengthDays: 45,
          marriageStatusYears: 2,
          pregnant: false,
          abortionsCount: 0,
          fsh: 4.5,
          lh: 12.1,
          lhFshRatio: 2.69,
          amh: 8.4,
          tsh: 2.1,
          prolactin: 15.0,
          vitaminD3: 20.0,
          progesterone: 0.5,
          randomBloodSugar: 110,
          follicleCountLeft: 16,
          follicleCountRight: 18,
          totalFollicles: 34,
          avgFollicleSizeLeftMm: 4.2,
          avgFollicleSizeRightMm: 4.5,
          endometriumThicknessMm: 9.8,
          weightGain: true,
          excessHairGrowth: true,
          skinDarkening: true,
          hairLoss: false,
          pimplesOrAcne: true,
          highFastFoodDiet: true,
          regularExercise: false
        },
        {
          id: 'batch-02',
          name: 'Camilla Rossi',
          age: 25,
          mrn: 'BATCH-202',
          registeredDate: '2026-11-03',
          lastEvaluatedDate: '2026-11-03',
          triageStatus: 'pending',
          assignedDoctor: 'Dr. Michael Chen, MD',
          weightKg: 55,
          heightCm: 168,
          bmi: 19.5,
          bloodGroup: 'O+',
          pulseRateBpm: 68,
          systolicBp: 112,
          diastolicBp: 70,
          cycleRegularity: 'Regular',
          cycleLengthDays: 28,
          marriageStatusYears: 0,
          pregnant: false,
          abortionsCount: 0,
          fsh: 6.2,
          lh: 5.8,
          lhFshRatio: 0.94,
          amh: 2.5,
          tsh: 1.8,
          prolactin: 12.5,
          vitaminD3: 35.0,
          progesterone: 7.2,
          randomBloodSugar: 82,
          follicleCountLeft: 4,
          follicleCountRight: 5,
          totalFollicles: 9,
          avgFollicleSizeLeftMm: 7.0,
          avgFollicleSizeRightMm: 7.5,
          endometriumThicknessMm: 7.5,
          weightGain: false,
          excessHairGrowth: false,
          skinDarkening: false,
          hairLoss: false,
          pimplesOrAcne: false,
          highFastFoodDiet: false,
          regularExercise: true
        },
        {
          id: 'batch-03',
          name: 'Amara Okafor',
          age: 30,
          mrn: 'BATCH-203',
          registeredDate: '2026-11-03',
          lastEvaluatedDate: '2026-11-03',
          triageStatus: 'pending',
          assignedDoctor: 'Dr. Fiona O\'Connor, MD',
          weightKg: 82,
          heightCm: 162,
          bmi: 31.2,
          bloodGroup: 'B+',
          pulseRateBpm: 80,
          systolicBp: 132,
          diastolicBp: 86,
          cycleRegularity: 'Irregular',
          cycleLengthDays: 60,
          marriageStatusYears: 5,
          pregnant: false,
          abortionsCount: 1,
          fsh: 3.8,
          lh: 10.5,
          lhFshRatio: 2.76,
          amh: 10.2,
          tsh: 2.3,
          prolactin: 17.0,
          vitaminD3: 15.0,
          progesterone: 0.4,
          randomBloodSugar: 130,
          follicleCountLeft: 19,
          follicleCountRight: 21,
          totalFollicles: 40,
          avgFollicleSizeLeftMm: 4.1,
          avgFollicleSizeRightMm: 4.3,
          endometriumThicknessMm: 11.2,
          weightGain: true,
          excessHairGrowth: true,
          skinDarkening: true,
          hairLoss: true,
          pimplesOrAcne: true,
          highFastFoodDiet: true,
          regularExercise: false
        },
        {
          id: 'batch-04',
          name: 'Freja Lindqvist',
          age: 22,
          mrn: 'BATCH-204',
          registeredDate: '2026-11-03',
          lastEvaluatedDate: '2026-11-03',
          triageStatus: 'pending',
          assignedDoctor: 'Dr. Sarah Lin, MD',
          weightKg: 52,
          heightCm: 170,
          bmi: 18.0,
          bloodGroup: 'AB-',
          pulseRateBpm: 70,
          systolicBp: 110,
          diastolicBp: 72,
          cycleRegularity: 'Regular',
          cycleLengthDays: 31,
          marriageStatusYears: 0,
          pregnant: false,
          abortionsCount: 0,
          fsh: 5.5,
          lh: 9.8,
          lhFshRatio: 1.78,
          amh: 5.8,
          tsh: 1.9,
          prolactin: 13.0,
          vitaminD3: 28.0,
          progesterone: 4.5,
          randomBloodSugar: 86,
          follicleCountLeft: 13,
          follicleCountRight: 14,
          totalFollicles: 27,
          avgFollicleSizeLeftMm: 4.8,
          avgFollicleSizeRightMm: 5.0,
          endometriumThicknessMm: 8.0,
          weightGain: false,
          excessHairGrowth: true,
          skinDarkening: false,
          hairLoss: false,
          pimplesOrAcne: true,
          highFastFoodDiet: false,
          regularExercise: true
        },
        {
          id: 'batch-05',
          name: 'Fatima Zahra',
          age: 33,
          mrn: 'BATCH-205',
          registeredDate: '2026-11-03',
          lastEvaluatedDate: '2026-11-03',
          triageStatus: 'pending',
          assignedDoctor: 'Dr. Michael Chen, MD',
          weightKg: 70,
          heightCm: 160,
          bmi: 27.3,
          bloodGroup: 'O-',
          pulseRateBpm: 66,
          systolicBp: 120,
          diastolicBp: 78,
          cycleRegularity: 'Irregular',
          cycleLengthDays: 50,
          marriageStatusYears: 8,
          pregnant: false,
          abortionsCount: 0,
          fsh: 5.6,
          lh: 6.0,
          lhFshRatio: 1.07,
          amh: 3.0,
          tsh: 7.8, // Hypothyroid!
          prolactin: 28.0,
          vitaminD3: 18.0,
          progesterone: 0.8,
          randomBloodSugar: 95,
          follicleCountLeft: 6,
          follicleCountRight: 7,
          totalFollicles: 13,
          avgFollicleSizeLeftMm: 5.2,
          avgFollicleSizeRightMm: 5.5,
          endometriumThicknessMm: 6.8,
          weightGain: true,
          excessHairGrowth: false,
          skinDarkening: false,
          hairLoss: true,
          pimplesOrAcne: false,
          highFastFoodDiet: false,
          regularExercise: false
        }
      ];

      // Process evaluations for all rows
      const evaluated = syntheticBatch.map(pt => ({
        patient: pt,
        prediction: calculatePcosPrediction(pt as PatientData),
        rotterdam: evaluateRotterdamCriteria(pt as PatientData)
      }));

      setBatchRows(evaluated);
      setIsProcessing(false);
      setImportStatus('Successfully loaded and evaluated 5 patient cases.');
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('CSV file is empty or contains only header.');
          setIsProcessing(false);
          return;
        }

        // Parse CSV rows into Patient objects
        const parsedPatients: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 5) continue;

          const p: PatientData = {
            id: `upload-${Date.now()}-${i}`,
            name: cols[1] || `Patient Case ${i}`,
            mrn: cols[0] || `MRN-${1000 + i}`,
            age: Number(cols[2]) || 25,
            registeredDate: new Date().toISOString().slice(0, 10),
            lastEvaluatedDate: new Date().toISOString().slice(0, 10),
            triageStatus: 'pending',
            assignedDoctor: 'Attending Clinician',
            bmi: Number(cols[3]) || 24,
            weightKg: 65,
            heightCm: 165,
            bloodGroup: 'O+',
            pulseRateBpm: 72,
            systolicBp: 120,
            diastolicBp: 80,
            cycleRegularity: cols[4]?.toLowerCase().includes('irreg') ? 'Irregular' : 'Regular',
            cycleLengthDays: Number(cols[5]) || 30,
            marriageStatusYears: 1,
            pregnant: false,
            abortionsCount: 0,
            lh: Number(cols[6]) || 6,
            fsh: Number(cols[7]) || 5,
            lhFshRatio: Number(cols[8]) || 1.2,
            amh: Number(cols[9]) || 3.0,
            tsh: 2.0,
            prolactin: 14.0,
            vitaminD3: 25.0,
            progesterone: 1.0,
            randomBloodSugar: 95,
            follicleCountLeft: Number(cols[10]) || 6,
            follicleCountRight: Number(cols[11]) || 6,
            totalFollicles: (Number(cols[10]) || 6) + (Number(cols[11]) || 6),
            avgFollicleSizeLeftMm: 4.5,
            avgFollicleSizeRightMm: 4.5,
            endometriumThicknessMm: 8.0,
            weightGain: false,
            excessHairGrowth: cols[12]?.toLowerCase() === 'yes',
            skinDarkening: cols[13]?.toLowerCase() === 'yes',
            hairLoss: false,
            pimplesOrAcne: false,
            highFastFoodDiet: false,
            regularExercise: true
          };

          parsedPatients.push({
            patient: p,
            prediction: calculatePcosPrediction(p),
            rotterdam: evaluateRotterdamCriteria(p)
          });
        }

        setBatchRows(parsedPatients);
        setImportStatus(`Successfully parsed and evaluated ${parsedPatients.length} patient cases from CSV.`);
      } catch (err) {
        console.error(err);
        alert('Error parsing CSV file format.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImportToCohort = () => {
    if (batchRows.length === 0) return;
    const patients = batchRows.map(r => r.patient);
    onImportToCohort(patients);
    setImportStatus(`Added ${patients.length} cases to primary patient cohort.`);
  };

  const downloadResultsCsv = () => {
    if (batchRows.length === 0) return;

    const headers = [
      'MRN', 'Name', 'Age', 'BMI', 'Cycle Regularity', 'Cycle Length',
      'LH', 'FSH', 'LH/FSH', 'AMH', 'Follicles L', 'Follicles R', 'Total Follicles',
      'ML Probability (%)', 'Risk Tier', 'Rotterdam Satisfied', 'Phenotype Classification'
    ];

    const rows = batchRows.map(({ patient, prediction, rotterdam }) => [
      patient.mrn,
      `"${patient.name}"`,
      patient.age,
      patient.bmi,
      patient.cycleRegularity,
      patient.cycleLengthDays,
      patient.lh,
      patient.fsh,
      patient.lhFshRatio.toFixed(2),
      patient.amh,
      patient.follicleCountLeft,
      patient.follicleCountRight,
      patient.totalFollicles,
      prediction.percentage,
      prediction.riskTier,
      rotterdam.satisfiesRotterdam ? 'Yes' : 'No',
      `"${rotterdam.derivedPhenotype}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PCOS_Model_Inference_Batch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Upload & Action Header */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Batch Patient Screening Engine (CSV Import)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Run ML model detection and Rotterdam criteria classification across multiple patient cases simultaneously.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-medium transition-colors shadow-2xs">
              <UploadCloud className="w-4 h-4" />
              <span>Upload Patient CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={generateSampleCohort}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-slate-500" />
              <span>Load 5-Patient Batch Sample</span>
            </button>
          </div>

          {batchRows.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleImportToCohort}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-xs font-medium transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Merge Into Primary Cohort</span>
              </button>

              <button
                onClick={downloadResultsCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Inference CSV</span>
              </button>
            </div>
          )}
        </div>

        {importStatus && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs text-teal-900 flex items-center justify-between">
            <span>{importStatus}</span>
            <button onClick={() => setImportStatus(null)} className="text-teal-700 hover:text-teal-900">×</button>
          </div>
        )}
      </div>

      {/* Batch Results Table */}
      {batchRows.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Batch Inference Output ({batchRows.length} Cases)
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>
                High Risk Cases: <strong className="text-rose-600">{batchRows.filter(r => r.prediction.percentage >= 68).length}</strong>
              </span>
              <span>
                Rotterdam Criteria Met: <strong className="text-teal-700">{batchRows.filter(r => r.rotterdam.satisfiesRotterdam).length}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th scope="col" className="px-3 py-3 font-semibold">Patient / MRN</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Age & BMI</th>
                  <th scope="col" className="px-3 py-3 font-semibold">ML Probability</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Rotterdam Status</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Total Follicles</th>
                  <th scope="col" className="px-3 py-3 font-semibold">LH/FSH</th>
                  <th scope="col" className="px-3 py-3 font-semibold">AMH</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Phenotype</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchRows.map(({ patient, prediction, rotterdam }) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      <div>{patient.name}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{patient.mrn}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <div>Age {patient.age}</div>
                      <div className="text-[11px] text-slate-400">BMI {patient.bmi}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{prediction.percentage}%</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          prediction.percentage >= 68
                            ? 'bg-rose-50 text-rose-800'
                            : prediction.percentage >= 38
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {prediction.riskTier}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-800 font-medium">
                      {rotterdam.metCriteriaCount}/3 Met
                    </td>
                    <td className="px-3 py-3 font-mono">
                      <span className={patient.totalFollicles >= 20 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {patient.totalFollicles}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono">
                      <span className={patient.lhFshRatio >= 2.0 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                        {patient.lhFshRatio.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-700">
                      {patient.amh} ng/mL
                    </td>
                    <td className="px-3 py-3 text-slate-600 text-[11px]">
                      {rotterdam.derivedPhenotype}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => onSelectPatient(patient.id)}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-xs font-medium transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white border border-dashed border-slate-300 rounded-lg text-center space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No Batch File Loaded</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload your laboratory or clinic dataset in CSV format, or load the pre-configured 5-patient test sample to test bulk model inference.
          </p>
          <button
            onClick={generateSampleCohort}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Load Sample Batch Data</span>
          </button>
        </div>
      )}
    </div>
  );
};
