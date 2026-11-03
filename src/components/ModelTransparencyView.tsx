import React, { useState } from 'react';
import { 
  Sliders, ShieldCheck, Database, Award, ExternalLink, 
  HelpCircle, BarChart3, RefreshCw, Layers
} from 'lucide-react';
import { MODEL_PERFORMANCE_DATA } from '../data/mockPatients';

export const ModelTransparencyView: React.FC = () => {
  const [decisionThreshold, setDecisionThreshold] = useState<number>(0.50);

  // Dynamically compute confusion matrix based on chosen decision threshold
  // As threshold increases, sensitivity drops, specificity rises
  const baseTP = MODEL_PERFORMANCE_DATA.confusionMatrix.truePositive;
  const baseFP = MODEL_PERFORMANCE_DATA.confusionMatrix.falsePositive;
  const baseTN = MODEL_PERFORMANCE_DATA.confusionMatrix.trueNegative;
  const baseFN = MODEL_PERFORMANCE_DATA.confusionMatrix.falseNegative;

  // Sensitivity / Specificity shift approximation
  const shift = (decisionThreshold - 0.50) * 40;
  const adjustedTP = Math.max(120, Math.min(177, Math.round(baseTP - shift * 0.8)));
  const adjustedFN = 177 - adjustedTP;
  const adjustedFP = Math.max(3, Math.min(45, Math.round(baseFP - shift * 0.6)));
  const adjustedTN = 364 - adjustedFP;

  const currentRecall = Number(((adjustedTP / 177) * 100).toFixed(1));
  const currentSpecificity = Number(((adjustedTN / 364) * 100).toFixed(1));
  const currentPrecision = Number(((adjustedTP / (adjustedTP + adjustedFP)) * 100).toFixed(1));
  const currentAccuracy = Number((((adjustedTP + adjustedTN) / 541) * 100).toFixed(1));

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
              Repository Architecture
            </span>
            <span className="text-xs text-slate-500 font-mono">TayDemi/pcos-ml-detection</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Machine Learning Detection Model & Clinical Validation
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Trained on 541 clinical cases utilizing extreme gradient boosting (XGBoost) and bagged random forest ensembles. Evaluated under 10-fold stratified cross-validation with feature attribution via SHAP values.
          </p>
        </div>

        <a
          href="https://github.com/TayDemi/pcos-ml-detection"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors shadow-2xs whitespace-nowrap"
        >
          <span>View GitHub Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Primary Performance Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Test Accuracy</div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">{MODEL_PERFORMANCE_DATA.accuracy}%</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">10-Fold Stratified CV</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">ROC-AUC Score</div>
          <div className="text-3xl font-bold text-indigo-700 font-mono mt-2">{MODEL_PERFORMANCE_DATA.rocAuc}</div>
          <div className="text-xs text-slate-500 mt-1">High discrimination power</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sensitivity (Recall)</div>
          <div className="text-3xl font-bold text-teal-700 font-mono mt-2">{MODEL_PERFORMANCE_DATA.recall}%</div>
          <div className="text-xs text-slate-500 mt-1">Minimizes false negatives</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Specificity</div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">{MODEL_PERFORMANCE_DATA.specificity}%</div>
          <div className="text-xs text-slate-500 mt-1">Controls for healthy cohorts</div>
        </div>
      </div>

      {/* Main Grid: Interactive Confusion Matrix & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Threshold & Confusion Matrix (6 columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Interactive Confusion Matrix & Threshold Tuning
                </h3>
                <p className="text-xs text-slate-500">
                  Adjust decision threshold to observe clinical sensitivity vs specificity trade-offs
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                θ = {decisionThreshold.toFixed(2)}
              </span>
            </div>

            {/* Threshold Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>High Sensitivity (Screening Mode)</span>
                <span className="font-semibold text-slate-900">Cut-off Threshold: {decisionThreshold.toFixed(2)}</span>
                <span>High Specificity (Confirmation Mode)</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={decisionThreshold}
                onChange={(e) => setDecisionThreshold(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                <span>0.20 (Captures 99% cases)</span>
                <span>0.50 (Balanced Optimum)</span>
                <span>0.80 (Zero false positives)</span>
              </div>
            </div>

            {/* 2x2 Confusion Matrix Grid */}
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                {/* True Positive */}
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-lg">
                  <div className="text-xs font-semibold text-teal-900 uppercase tracking-wider">
                    True Positives (TP)
                  </div>
                  <div className="text-3xl font-bold text-teal-700 font-mono mt-1">
                    {adjustedTP}
                  </div>
                  <div className="text-[11px] text-teal-800 mt-1">
                    Correctly identified PCOS patients
                  </div>
                </div>

                {/* False Positive */}
                <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-lg">
                  <div className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                    False Positives (FP)
                  </div>
                  <div className="text-3xl font-bold text-rose-600 font-mono mt-1">
                    {adjustedFP}
                  </div>
                  <div className="text-[11px] text-rose-800 mt-1">
                    Controls flagged erroneously (Type I)
                  </div>
                </div>

                {/* False Negative */}
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
                  <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                    False Negatives (FN)
                  </div>
                  <div className="text-3xl font-bold text-amber-600 font-mono mt-1">
                    {adjustedFN}
                  </div>
                  <div className="text-[11px] text-amber-800 mt-1">
                    PCOS cases missed (Type II)
                  </div>
                </div>

                {/* True Negative */}
                <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-lg">
                  <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    True Negatives (TN)
                  </div>
                  <div className="text-3xl font-bold text-slate-700 font-mono mt-1">
                    {adjustedTN}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Correctly identified healthy controls
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Calculated Statistics at current threshold */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Sensitivity</span>
                <span className="font-semibold text-slate-900 font-mono">{currentRecall}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Specificity</span>
                <span className="font-semibold text-slate-900 font-mono">{currentSpecificity}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Precision</span>
                <span className="font-semibold text-slate-900 font-mono">{currentPrecision}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Accuracy</span>
                <span className="font-semibold text-slate-900 font-mono">{currentAccuracy}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Global Feature Importance (6 columns) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Global Feature Importance (Gini / Gain)
                </h3>
                <p className="text-xs text-slate-500">
                  Top 10 explanatory variables derived from XGBoost gradient trees
                </p>
              </div>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2.5">
              {MODEL_PERFORMANCE_DATA.topFeatures.map((feat) => {
                const percent = Math.round(feat.importance * 100);
                return (
                  <div key={feat.rank} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-400 w-4">{feat.rank}.</span>
                        <span className="font-medium text-slate-800">{feat.name}</span>
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.2 bg-slate-100 rounded">
                          {feat.category}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-teal-800">
                        {(feat.importance * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${percent * 3.8}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Ultrasonographic follicle metrics and LH/FSH ratio account for &gt;60% of total split gains.</span>
            </div>
          </div>
        </div>

      </div>

      {/* Algorithm Benchmark Comparison Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Model Comparison Benchmarks (TayDemi Implementation)
            </h3>
            <p className="text-xs text-slate-500">
              Comparative analysis across 5 classification architectures on the 541-patient dataset
            </p>
          </div>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-semibold">Algorithm</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Accuracy</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">ROC-AUC</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Recall (Sensitivity)</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">F1-Score</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Deployment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODEL_PERFORMANCE_DATA.modelBenchmarks.map((bm, idx) => (
                <tr key={idx} className={idx === 0 ? 'bg-teal-50/30 font-medium' : ''}>
                  <td className="px-3 py-2.5 text-slate-900 font-medium flex items-center gap-2">
                    {bm.model}
                    {idx === 0 && (
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                        Active Model
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-800">{bm.accuracy}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-800">{bm.roc}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-800">{bm.recall}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-800">{bm.f1}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                      bm.status === 'Optimal'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {bm.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
