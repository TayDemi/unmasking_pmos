export interface PatientData {
  id: string;
  name: string;
  age: number;
  mrn: string; // Medical Record Number
  registeredDate: string;
  lastEvaluatedDate: string;
  triageStatus: 'pending' | 'in_review' | 'confirmed_pcos' | 'ruled_out' | 'further_workup';
  assignedDoctor: string;

  // Demographics & Vitals
  weightKg: number;
  heightCm: number;
  bmi: number;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  pulseRateBpm: number;
  systolicBp: number;
  diastolicBp: number;

  // Menstrual & Reproductive
  cycleRegularity: 'Regular' | 'Irregular';
  cycleLengthDays: number;
  marriageStatusYears: number;
  pregnant: boolean;
  abortionsCount: number;

  // Endocrine & Hormonal Labs
  fsh: number; // mIU/mL (Follicle-Stimulating Hormone)
  lh: number;  // mIU/mL (Luteinizing Hormone)
  lhFshRatio: number;
  amh: number; // ng/mL (Anti-Müllerian Hormone)
  tsh: number; // uIU/mL (Thyroid-Stimulating Hormone)
  prolactin: number; // ng/mL (PRL)
  vitaminD3: number; // ng/mL
  progesterone: number; // ng/mL
  randomBloodSugar: number; // mg/dL
  hba1c?: number; // %

  // Pelvic Ultrasonography (USG)
  follicleCountLeft: number;
  follicleCountRight: number;
  totalFollicles: number;
  avgFollicleSizeLeftMm: number;
  avgFollicleSizeRightMm: number;
  endometriumThicknessMm: number;

  // Clinical Symptoms & Hyperandrogenism
  weightGain: boolean;
  excessHairGrowth: boolean; // Hirsutism
  skinDarkening: boolean;    // Acanthosis Nigricans
  hairLoss: boolean;         // Androgenic Alopecia
  pimplesOrAcne: boolean;
  highFastFoodDiet: boolean;
  regularExercise: boolean;

  // Clinical Review
  doctorNotes?: string;
  phenotypeClassification?: 'Phenotype A (Full)' | 'Phenotype B (Non-PCO)' | 'Phenotype C (Ovulatory)' | 'Phenotype D (Non-Hyperandrogenic)' | 'None' | 'None / Insufficient Criteria';
  treatmentProtocol?: string[];
}

export interface ModelPrediction {
  probability: number; // 0.00 to 1.00
  percentage: number;  // 0 to 100
  riskTier: 'High Risk' | 'Borderline / Moderate' | 'Low Risk / Normal';
  predictedClass: 'PCOS Positive' | 'PCOS Negative';
  confidenceInterval: [number, number];
  modelUsed: 'Random Forest' | 'XGBoost' | 'Ensemble Voting';
  contributions: FeatureContribution[];
}

export interface FeatureContribution {
  featureName: string;
  category: 'ultrasound' | 'hormonal' | 'metabolic' | 'symptoms';
  valueDisplay: string;
  impact: number; // positive = increased risk, negative = reduced risk
  description: string;
}

export interface RotterdamEvaluation {
  criteria1_ovulation: boolean; // Oligo- or anovulation (irregular cycle or >35 days)
  criteria2_androgen: boolean;  // Clinical (hirsutism, acne, alopecia) or biochemical (LH/FSH, etc.)
  criteria3_polycysticOvaries: boolean; // Follicles >= 12 (or >= 20 on high-res) or ovarian volume
  metCriteriaCount: number;
  satisfiesRotterdam: boolean; // At least 2 of 3 met
  derivedPhenotype: 'Phenotype A (Full)' | 'Phenotype B (Non-PCO)' | 'Phenotype C (Ovulatory)' | 'Phenotype D (Non-Hyperandrogenic)' | 'None / Insufficient Criteria';
  notes: string[];
}

export interface LabAnomaly {
  marker: string;
  value: number | string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'elevated' | 'critical_high' | 'low' | 'critical_low';
  clinicalSignificance: string;
}

export interface ModelPerformanceStat {
  accuracy: number;
  rocAuc: number;
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
  totalTrainingSamples: number;
  crossValidationFolds: number;
}
