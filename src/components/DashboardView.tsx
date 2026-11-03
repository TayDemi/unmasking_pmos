import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ChevronRight, FileText, CheckCircle2, 
  AlertCircle, Clock, FileSpreadsheet, Plus, HelpCircle
} from 'lucide-react';
import { PatientData } from '../types/pcos';
import { calculatePcosPrediction, evaluateRotterdamCriteria } from '../lib/pcosModelEngine';

interface DashboardViewProps {
  patients: PatientData[];
  onSelectPatient: (patientId: string) => void;
  onOpenReport: (patient: PatientData) => void;
  onUpdateStatus: (patientId: string, status: PatientData['triageStatus']) => void;
  onNewEvaluation: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  onSelectPatient,
  onOpenReport,
  onUpdateStatus,
  onNewEvaluation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Calculate stats & predictions for each patient
  const patientEvaluations = useMemo(() => {
    return patients.map(pt => {
      const prediction = calculatePcosPrediction(pt);
      const rotterdam = evaluateRotterdamCriteria(pt);
      return {
        patient: pt,
        prediction,
        rotterdam
      };
    });
  }, [patients]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    const total = patientEvaluations.length;
    const highRisk = patientEvaluations.filter(e => e.prediction.riskTier === 'High Risk').length;
    const confirmed = patientEvaluations.filter(e => e.patient.triageStatus === 'confirmed_pcos').length;
    const pending = patientEvaluations.filter(e => e.patient.triageStatus === 'pending' || e.patient.triageStatus === 'in_review').length;
    const ruledOut = patientEvaluations.filter(e => e.patient.triageStatus === 'ruled_out').length;
    const avgConfidence = total > 0 
      ? Math.round(patientEvaluations.reduce((acc, curr) => acc + curr.prediction.percentage, 0) / total)
      : 0;

    return { total, highRisk, confirmed, pending, ruledOut, avgConfidence };
  }, [patientEvaluations]);

  // Filtered patients
  const filtered = useMemo(() => {
    return patientEvaluations.filter(({ patient, prediction, rotterdam }) => {
      // Search text
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        patient.name.toLowerCase().includes(q) ||
        patient.mrn.toLowerCase().includes(q) ||
        patient.assignedDoctor.toLowerCase().includes(q);

      // Status filter
      const matchesStatus = statusFilter === 'all' || patient.triageStatus === statusFilter;

      // Risk filter
      let matchesRisk = true;
      if (riskFilter === 'high') matchesRisk = prediction.riskTier === 'High Risk';
      else if (riskFilter === 'borderline') matchesRisk = prediction.riskTier === 'Borderline / Moderate';
      else if (riskFilter === 'low') matchesRisk = prediction.riskTier === 'Low Risk / Normal';
      else if (riskFilter === 'rotterdam_met') matchesRisk = rotterdam.satisfiesRotterdam;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [patientEvaluations, searchQuery, statusFilter, riskFilter]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(f => f.patient.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const exportSelectedCsv = () => {
    const targetPatients = selectedIds.length > 0 
      ? patientEvaluations.filter(e => selectedIds.includes(e.patient.id))
      : patientEvaluations;

    const headers = [
      'MRN', 'Name', 'Age', 'BMI', 'Cycle Regularity', 'Cycle Length (d)',
      'LH (mIU/mL)', 'FSH (mIU/mL)', 'LH/FSH Ratio', 'AMH (ng/mL)',
      'Follicles Left', 'Follicles Right', 'Total Follicles',
      'Hirsutism', 'Acanthosis', 'Acne', 'ML Probability (%)',
      'ML Risk Tier', 'Rotterdam Satisfied', 'Phenotype', 'Triage Status'
    ];

    const rows = targetPatients.map(({ patient, prediction, rotterdam }) => [
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
      patient.excessHairGrowth ? 'Yes' : 'No',
      patient.skinDarkening ? 'Yes' : 'No',
      patient.pimplesOrAcne ? 'Yes' : 'No',
      prediction.percentage,
      prediction.riskTier,
      rotterdam.satisfiesRotterdam ? 'Yes' : 'No',
      `"${rotterdam.derivedPhenotype}"`,
      patient.triageStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PCOS_Cohort_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cohort Screened</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 tracking-tight">{stats.total}</div>
          <div className="mt-1 text-xs text-slate-500">Active patient records</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-rose-700 uppercase tracking-wider">High Risk Cases</div>
          <div className="mt-2 text-2xl font-semibold text-rose-600 tracking-tight">
            {stats.highRisk}
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              ({stats.total > 0 ? Math.round((stats.highRisk / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">ML probability ≥ 68%</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-teal-700 uppercase tracking-wider">Confirmed PCOS</div>
          <div className="mt-2 text-2xl font-semibold text-teal-700 tracking-tight">{stats.confirmed}</div>
          <div className="mt-1 text-xs text-slate-500">Physician confirmed</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Pending Review</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600 tracking-tight">{stats.pending}</div>
          <div className="mt-1 text-xs text-slate-500">Requires clinical triage</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs col-span-2 md:col-span-1">
          <div className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Mean Model Risk</div>
          <div className="mt-2 text-2xl font-semibold text-indigo-900 tracking-tight">{stats.avgConfidence}%</div>
          <div className="mt-1 text-xs text-slate-500">XGBoost & RF Ensemble</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, MRN, or physician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter patients by clinical status"
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Clinical Statuses</option>
              <option value="pending">Pending Triage</option>
              <option value="in_review">In Review</option>
              <option value="confirmed_pcos">Confirmed PCOS</option>
              <option value="further_workup">Further Workup Needed</option>
              <option value="ruled_out">Ruled Out / Negative</option>
            </select>
          </div>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            aria-label="Filter patients by ML risk classification"
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All ML Risk Tiers</option>
            <option value="high">High Risk (≥68%)</option>
            <option value="borderline">Borderline / Moderate (38–67%)</option>
            <option value="low">Low Risk (&lt;38%)</option>
            <option value="rotterdam_met">Rotterdam Criteria Met (≥2/3)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportSelectedCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors"
            title="Export filtered or selected rows as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>

          <button
            onClick={onNewEvaluation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Patient Case</span>
          </button>
        </div>
      </div>

      {/* Cohort Results Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th scope="col" className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={handleToggleSelectAll}
                    aria-label="Select all patients in cohort"
                    className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                </th>
                <th scope="col" className="px-3 py-3 font-semibold">Patient / MRN</th>
                <th scope="col" className="px-3 py-3 font-semibold">ML Detection Risk</th>
                <th scope="col" className="px-3 py-3 font-semibold">Rotterdam Criteria</th>
                <th scope="col" className="px-3 py-3 font-semibold">Key Biomarkers</th>
                <th scope="col" className="px-3 py-3 font-semibold">Clinical Signs</th>
                <th scope="col" className="px-3 py-3 font-semibold">Triage Status</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">No patient records match the current filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search keywords or status filter</p>
                  </td>
                </tr>
              ) : (
                filtered.map(({ patient, prediction, rotterdam }) => {
                  const isSelected = selectedIds.includes(patient.id);

                  return (
                    <tr 
                      key={patient.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-teal-50/30' : ''}`}
                    >
                      <td className="px-3 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(patient.id)}
                          aria-label={`Select patient ${patient.name}`}
                          className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                      </td>

                      {/* Patient Name & MRN */}
                      <td className="px-3 py-3.5">
                        <button
                          onClick={() => onSelectPatient(patient.id)}
                          className="text-left font-semibold text-slate-900 hover:text-teal-700 transition-colors group flex items-center gap-1"
                        >
                          <span>{patient.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-teal-600 transition-opacity" />
                        </button>
                        <div className="text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{patient.mrn}</span>
                          <span aria-hidden="true">·</span>
                          <span>Age {patient.age}</span>
                          <span aria-hidden="true">·</span>
                          <span>BMI {patient.bmi}</span>
                        </div>
                      </td>

                      {/* ML Prediction Risk */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                prediction.percentage >= 68
                                  ? 'bg-rose-500'
                                  : prediction.percentage >= 38
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${prediction.percentage}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-900 font-mono">
                            {prediction.percentage}%
                          </span>
                        </div>
                        <div className="text-[11px] mt-0.5 font-medium">
                          {prediction.percentage >= 68 ? (
                            <span className="text-rose-700">High Risk PCOS</span>
                          ) : prediction.percentage >= 38 ? (
                            <span className="text-amber-700">Borderline / Suspected</span>
                          ) : (
                            <span className="text-emerald-700">Low Risk / Negative</span>
                          )}
                        </div>
                      </td>

                      {/* Rotterdam Criteria */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${rotterdam.satisfiesRotterdam ? 'text-teal-700' : 'text-slate-600'}`}>
                            {rotterdam.metCriteriaCount}/3 Met
                          </span>
                          {rotterdam.satisfiesRotterdam && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[160px]" title={rotterdam.derivedPhenotype}>
                          {rotterdam.derivedPhenotype.replace('Phenotype ', 'Pheno ')}
                        </div>
                      </td>

                      {/* Key Biomarkers */}
                      <td className="px-3 py-3.5">
                        <div className="text-slate-700 space-y-0.5">
                          <div>
                            <span className="text-slate-400">Follicles: </span>
                            <span className={`font-medium ${patient.totalFollicles >= 20 ? 'text-rose-700 font-semibold' : ''}`}>
                              {patient.totalFollicles} (L:{patient.follicleCountLeft}, R:{patient.follicleCountRight})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">LH/FSH: </span>
                            <span className={`font-medium ${patient.lhFshRatio >= 2.0 ? 'text-rose-700 font-semibold' : ''}`}>
                              {patient.lhFshRatio.toFixed(2)}
                            </span>
                            <span className="text-slate-400 ml-2">AMH: </span>
                            <span className={`font-medium ${patient.amh >= 5.0 ? 'text-amber-700 font-semibold' : ''}`}>
                              {patient.amh} ng/mL
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Clinical Signs */}
                      <td className="px-3 py-3.5">
                        <div className="text-slate-600 flex flex-wrap gap-1 text-[11px]">
                          {patient.excessHairGrowth && (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Hirsutism</span>
                          )}
                          {patient.skinDarkening && (
                            <span className="text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">Acanthosis</span>
                          )}
                          {patient.cycleRegularity === 'Irregular' && (
                            <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">Irreg Cycle</span>
                          )}
                          {!patient.excessHairGrowth && !patient.skinDarkening && patient.cycleRegularity === 'Regular' && (
                            <span className="text-slate-400 italic">None reported</span>
                          )}
                        </div>
                      </td>

                      {/* Triage Status Selector */}
                      <td className="px-3 py-3.5">
                        <select
                          value={patient.triageStatus}
                          onChange={(e) => onUpdateStatus(patient.id, e.target.value as PatientData['triageStatus'])}
                          aria-label={`Triage status for ${patient.name}`}
                          className={`text-xs font-medium rounded px-2 py-1 border transition-colors focus:outline-none ${
                            patient.triageStatus === 'confirmed_pcos'
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
                              : patient.triageStatus === 'ruled_out'
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : patient.triageStatus === 'further_workup'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : patient.triageStatus === 'in_review'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="pending">Pending Triage</option>
                          <option value="in_review">In Review</option>
                          <option value="confirmed_pcos">Confirmed PCOS</option>
                          <option value="further_workup">Further Workup</option>
                          <option value="ruled_out">Ruled Out</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectPatient(patient.id)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-xs font-medium transition-colors"
                            title="Open deep clinical evaluation workspace"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => onOpenReport(patient)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Generate & print formal EHR consultation note"
                            aria-label={`Generate report for ${patient.name}`}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{patients.length}</span> patient cases
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Triage status changes are preserved in active session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
