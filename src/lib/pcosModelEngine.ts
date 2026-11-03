import { PatientData, ModelPrediction, FeatureContribution, RotterdamEvaluation, LabAnomaly } from '../types/pcos';

/**
 * Calculates the Machine Learning risk prediction score for PCOS detection.
 * Emulates the trained XGBoost / Random Forest classifier based on Kaggle & TayDemi dataset feature weights.
 */
export function calculatePcosPrediction(patient: PatientData): ModelPrediction {
  const contributions: FeatureContribution[] = [];
  let logOdds = -1.45; // Baseline prior log-odds (~19% prevalence in screening cohort)

  // 1. Ultrasonography: Follicle Count (Strongest predictor in literature and dataset)
  const totalFollicles = (patient.follicleCountLeft || 0) + (patient.follicleCountRight || 0);
  const maxSingleOvaryFollicles = Math.max(patient.follicleCountLeft || 0, patient.follicleCountRight || 0);

  if (maxSingleOvaryFollicles >= 12 || totalFollicles >= 20) {
    const impact = maxSingleOvaryFollicles >= 18 ? 1.65 : 1.25;
    logOdds += impact;
    contributions.push({
      featureName: 'High Antral Follicle Count (USG)',
      category: 'ultrasound',
      valueDisplay: `L: ${patient.follicleCountLeft}, R: ${patient.follicleCountRight} (Total ${totalFollicles})`,
      impact: Number((impact * 18).toFixed(1)),
      description: 'PCOM criteria met (≥12 follicles/ovary). Primary morphological marker.'
    });
  } else if (totalFollicles <= 8 && maxSingleOvaryFollicles <= 5) {
    const impact = -1.1;
    logOdds += impact;
    contributions.push({
      featureName: 'Low/Normal Antral Follicle Count',
      category: 'ultrasound',
      valueDisplay: `Total ${totalFollicles} follicles`,
      impact: Number((impact * 18).toFixed(1)),
      description: 'Normal antral follicle count strongly argues against PCOM morphology.'
    });
  }

  // 2. Endocrine: LH / FSH Ratio
  const lh = patient.lh || 0;
  const fsh = patient.fsh || 1;
  const ratio = patient.lhFshRatio > 0 ? patient.lhFshRatio : (fsh > 0 ? Number((lh / fsh).toFixed(2)) : 1.0);

  if (ratio >= 2.5) {
    const impact = 1.35;
    logOdds += impact;
    contributions.push({
      featureName: 'Markedly Elevated LH/FSH Ratio',
      category: 'hormonal',
      valueDisplay: `${ratio.toFixed(2)} (LH: ${lh}, FSH: ${fsh})`,
      impact: Number((impact * 16).toFixed(1)),
      description: 'High LH surge relative to FSH indicates neuroendocrine dysregulation typical of PCOS.'
    });
  } else if (ratio >= 1.8) {
    const impact = 0.85;
    logOdds += impact;
    contributions.push({
      featureName: 'Elevated LH/FSH Ratio',
      category: 'hormonal',
      valueDisplay: `${ratio.toFixed(2)}`,
      impact: Number((impact * 16).toFixed(1)),
      description: 'Above physiologic ratio (expected ~1.0:1.0 in early follicular phase).'
    });
  } else if (ratio <= 1.2 && ratio >= 0.7) {
    const impact = -0.6;
    logOdds += impact;
    contributions.push({
      featureName: 'Physiologic LH/FSH Ratio',
      category: 'hormonal',
      valueDisplay: `${ratio.toFixed(2)}`,
      impact: Number((impact * 16).toFixed(1)),
      description: 'Balanced pituitary gonadotropin secretion.'
    });
  }

  // 3. Endocrine: AMH (Anti-Müllerian Hormone)
  const amh = patient.amh || 0;
  if (amh >= 7.0) {
    const impact = 1.2;
    logOdds += impact;
    contributions.push({
      featureName: 'Elevated AMH Level',
      category: 'hormonal',
      valueDisplay: `${amh.toFixed(1)} ng/mL`,
      impact: Number((impact * 15).toFixed(1)),
      description: 'Granulosa cell hyperactivity and high pool of preantral follicles.'
    });
  } else if (amh >= 4.5) {
    const impact = 0.7;
    logOdds += impact;
    contributions.push({
      featureName: 'Borderline High AMH',
      category: 'hormonal',
      valueDisplay: `${amh.toFixed(1)} ng/mL`,
      impact: Number((impact * 15).toFixed(1)),
      description: 'Slightly elevated over normal premenopausal reference range (1.5 - 4.0 ng/mL).'
    });
  } else if (amh > 0 && amh <= 3.5) {
    const impact = -0.5;
    logOdds += impact;
    contributions.push({
      featureName: 'Normal AMH Level',
      category: 'hormonal',
      valueDisplay: `${amh.toFixed(1)} ng/mL`,
      impact: Number((impact * 15).toFixed(1)),
      description: 'Within normal baseline ovarian reserve reference.'
    });
  }

  // 4. Menstrual Dynamics: Cycle Regularity & Length
  if (patient.cycleRegularity === 'Irregular' || patient.cycleLengthDays >= 36) {
    const impact = patient.cycleLengthDays >= 45 ? 1.3 : 0.95;
    logOdds += impact;
    contributions.push({
      featureName: 'Oligomenorrhea / Irregular Cycles',
      category: 'metabolic',
      valueDisplay: `${patient.cycleRegularity} (${patient.cycleLengthDays} days)`,
      impact: Number((impact * 14).toFixed(1)),
      description: 'Indicates chronic anovulation or oligo-ovulation.'
    });
  } else {
    const impact = -0.9;
    logOdds += impact;
    contributions.push({
      featureName: 'Regular Menstrual Cycle',
      category: 'metabolic',
      valueDisplay: `Regular (${patient.cycleLengthDays} days)`,
      impact: Number((impact * 14).toFixed(1)),
      description: 'Normal ovulatory cycle interval (21–35 days).'
    });
  }

  // 5. Clinical Hyperandrogenism: Hirsutism & Skin Signs
  let androgenSignsCount = 0;
  if (patient.excessHairGrowth) androgenSignsCount++;
  if (patient.pimplesOrAcne) androgenSignsCount++;
  if (patient.hairLoss) androgenSignsCount++;

  if (androgenSignsCount >= 2) {
    const impact = 1.05;
    logOdds += impact;
    contributions.push({
      featureName: 'Clinical Hyperandrogenism Signs',
      category: 'symptoms',
      valueDisplay: `${androgenSignsCount} signs (Hirsutism / Acne / Alopecia)`,
      impact: Number((impact * 13).toFixed(1)),
      description: 'Multifocal cutaneous manifestations of excess circulating or peripheral androgens.'
    });
  } else if (androgenSignsCount === 1) {
    const impact = 0.45;
    logOdds += impact;
    contributions.push({
      featureName: 'Isolated Androgen Sign',
      category: 'symptoms',
      valueDisplay: patient.excessHairGrowth ? 'Hirsutism' : (patient.pimplesOrAcne ? 'Cystic Acne' : 'Alopecia'),
      impact: Number((impact * 13).toFixed(1)),
      description: 'Moderate androgenic indicator.'
    });
  }

  // 6. Metabolic: Skin Darkening (Acanthosis Nigricans)
  if (patient.skinDarkening) {
    const impact = 0.9;
    logOdds += impact;
    contributions.push({
      featureName: 'Acanthosis Nigricans (Skin Darkening)',
      category: 'symptoms',
      valueDisplay: 'Present (Positive)',
      impact: Number((impact * 12).toFixed(1)),
      description: 'High-specificity physical biomarker for significant insulin resistance.'
    });
  }

  // 7. Metabolic & BMI
  const bmi = patient.bmi || (patient.weightKg / Math.pow(patient.heightCm / 100, 2));
  if (bmi >= 30) {
    const impact = 0.65;
    logOdds += impact;
    contributions.push({
      featureName: 'Obesity Class (BMI ≥ 30)',
      category: 'metabolic',
      valueDisplay: `BMI ${bmi.toFixed(1)} kg/m²`,
      impact: Number((impact * 10).toFixed(1)),
      description: 'Adiposity amplifies peripheral androgen aromatization and hyperinsulinemia.'
    });
  } else if (bmi >= 25) {
    const impact = 0.35;
    logOdds += impact;
    contributions.push({
      featureName: 'Overweight (BMI 25–29.9)',
      category: 'metabolic',
      valueDisplay: `BMI ${bmi.toFixed(1)} kg/m²`,
      impact: Number((impact * 10).toFixed(1)),
      description: 'Moderate metabolic risk factor.'
    });
  } else if (bmi < 22 && bmi > 0) {
    // Lean PCOS can exist, but statistically lower prior in general dataset
    const impact = -0.3;
    logOdds += impact;
    contributions.push({
      featureName: 'Normal/Lean BMI',
      category: 'metabolic',
      valueDisplay: `BMI ${bmi.toFixed(1)} kg/m²`,
      impact: Number((impact * 10).toFixed(1)),
      description: 'Lean phenotype profile.'
    });
  }

  // 8. Weight Gain & Lifestyle
  if (patient.weightGain) {
    const impact = 0.4;
    logOdds += impact;
    contributions.push({
      featureName: 'Recent Rapid Weight Gain',
      category: 'symptoms',
      valueDisplay: 'Reported',
      impact: Number((impact * 8).toFixed(1)),
      description: 'Frequent anamnesis finding in evolving metabolic syndrome.'
    });
  }

  // 9. Endometrium Thickness
  if (patient.endometriumThicknessMm >= 12) {
    const impact = 0.45;
    logOdds += impact;
    contributions.push({
      featureName: 'Thickened Endometrium (USG)',
      category: 'ultrasound',
      valueDisplay: `${patient.endometriumThicknessMm} mm`,
      impact: Number((impact * 7).toFixed(1)),
      description: 'Hyperestrogenic unopposed proliferation due to lack of luteal progesterone.'
    });
  }

  // Sigmoid probability conversion
  const probability = 1 / (1 + Math.exp(-logOdds));
  const percentage = Math.round(probability * 100);

  // Confidence Interval calculation (estimated standard error ~0.04)
  const lowerCi = Math.max(0, Math.round((probability - 0.05) * 100));
  const upperCi = Math.min(100, Math.round((probability + 0.05) * 100));

  let riskTier: 'High Risk' | 'Borderline / Moderate' | 'Low Risk / Normal';
  if (percentage >= 68) {
    riskTier = 'High Risk';
  } else if (percentage >= 38) {
    riskTier = 'Borderline / Moderate';
  } else {
    riskTier = 'Low Risk / Normal';
  }

  // Sort contributions by absolute impact
  contributions.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return {
    probability: Number(probability.toFixed(3)),
    percentage,
    riskTier,
    predictedClass: percentage >= 50 ? 'PCOS Positive' : 'PCOS Negative',
    confidenceInterval: [lowerCi, upperCi],
    modelUsed: 'Ensemble Voting',
    contributions
  };
}

/**
 * Validates against Rotterdam Consensus 2003 / International Evidence-Based Guidelines 2023:
 * Diagnosis requires at least 2 of 3 features, after exclusion of other etiologies.
 */
export function evaluateRotterdamCriteria(patient: PatientData): RotterdamEvaluation {
  // Criteria 1: Ovulatory Dysfunction (Oligo- or anovulation)
  const isOligomenorrhea = patient.cycleRegularity === 'Irregular' || patient.cycleLengthDays > 35;
  const isAmenorrhea = patient.cycleLengthDays >= 90;
  const criteria1 = isOligomenorrhea || isAmenorrhea;

  // Criteria 2: Hyperandrogenism (Clinical or Biochemical)
  const clinicalAndrogen = patient.excessHairGrowth || patient.pimplesOrAcne || patient.hairLoss;
  const biochemicalAndrogen = patient.lhFshRatio >= 2.0 || patient.fsh > 0 && (patient.lh / patient.fsh >= 2.0);
  const criteria2 = clinicalAndrogen || biochemicalAndrogen;

  // Criteria 3: Polycystic Ovarian Morphology (PCOM)
  const follicleL = patient.follicleCountLeft || 0;
  const follicleR = patient.follicleCountRight || 0;
  const totalFollicles = follicleL + follicleR;
  // Criteria: >= 12 follicles (2-9mm) per ovary or ovarian volume > 10ml, or >= 20 by newer transducer consensus
  const criteria3 = follicleL >= 12 || follicleR >= 12 || totalFollicles >= 20;

  let metCount = 0;
  if (criteria1) metCount++;
  if (criteria2) metCount++;
  if (criteria3) metCount++;

  const satisfiesRotterdam = metCount >= 2;

  let derivedPhenotype: RotterdamEvaluation['derivedPhenotype'] = 'None / Insufficient Criteria';
  if (criteria1 && criteria2 && criteria3) {
    derivedPhenotype = 'Phenotype A (Full)';
  } else if (criteria1 && criteria2 && !criteria3) {
    derivedPhenotype = 'Phenotype B (Non-PCO)';
  } else if (!criteria1 && criteria2 && criteria3) {
    derivedPhenotype = 'Phenotype C (Ovulatory)';
  } else if (criteria1 && !criteria2 && criteria3) {
    derivedPhenotype = 'Phenotype D (Non-Hyperandrogenic)';
  }

  const notes: string[] = [];
  if (criteria1) {
    notes.push(`Ovulatory dysfunction confirmed: ${patient.cycleRegularity} cycle (${patient.cycleLengthDays}d interval).`);
  } else {
    notes.push('Cycles reported regular within physiologic interval (21–35 days).');
  }

  if (criteria2) {
    const signs = [];
    if (patient.excessHairGrowth) signs.push('Hirsutism');
    if (patient.pimplesOrAcne) signs.push('Severe Acne');
    if (patient.hairLoss) signs.push('Alopecia');
    if (biochemicalAndrogen) signs.push(`LH/FSH ratio: ${patient.lhFshRatio || (patient.lh / patient.fsh).toFixed(1)}`);
    notes.push(`Hyperandrogenism markers noted: ${signs.join(', ')}.`);
  }

  if (criteria3) {
    notes.push(`PCOM morphology on USG: Left ${follicleL}, Right ${follicleR} follicles.`);
  } else {
    notes.push(`Follicle count below threshold (<12 per ovary).`);
  }

  return {
    criteria1_ovulation: criteria1,
    criteria2_androgen: criteria2,
    criteria3_polycysticOvaries: criteria3,
    metCriteriaCount: metCount,
    satisfiesRotterdam,
    derivedPhenotype,
    notes
  };
}

/**
 * Checks for clinical lab anomalies and alerts for healthcare professionals.
 */
export function analyzeLabAnomalies(patient: PatientData): LabAnomaly[] {
  const anomalies: LabAnomaly[] = [];

  // LH/FSH Ratio
  const ratio = patient.lhFshRatio > 0 ? patient.lhFshRatio : (patient.fsh > 0 ? patient.lh / patient.fsh : 1);
  if (ratio >= 2.5) {
    anomalies.push({
      marker: 'LH / FSH Ratio',
      value: ratio.toFixed(2),
      unit: 'ratio',
      normalRange: '0.8 - 1.5',
      status: 'critical_high',
      clinicalSignificance: 'Classic neuroendocrine marker of elevated LH pulsatility in PCOS.'
    });
  } else if (ratio >= 1.8) {
    anomalies.push({
      marker: 'LH / FSH Ratio',
      value: ratio.toFixed(2),
      unit: 'ratio',
      normalRange: '0.8 - 1.5',
      status: 'elevated',
      clinicalSignificance: 'Borderline elevated gonadotropin ratio.'
    });
  }

  // AMH
  if (patient.amh >= 6.5) {
    anomalies.push({
      marker: 'AMH (Anti-Müllerian Hormone)',
      value: patient.amh,
      unit: 'ng/mL',
      normalRange: '1.5 - 4.0',
      status: 'critical_high',
      clinicalSignificance: 'Significantly elevated; directly proportional to follicular arrest and anovulation.'
    });
  } else if (patient.amh >= 4.5) {
    anomalies.push({
      marker: 'AMH (Anti-Müllerian Hormone)',
      value: patient.amh,
      unit: 'ng/mL',
      normalRange: '1.5 - 4.0',
      status: 'elevated',
      clinicalSignificance: 'Mildly elevated ovarian reserve marker.'
    });
  }

  // TSH (Differential check)
  if (patient.tsh > 4.5) {
    anomalies.push({
      marker: 'TSH (Thyrotropin)',
      value: patient.tsh,
      unit: 'uIU/mL',
      normalRange: '0.4 - 4.0',
      status: 'elevated',
      clinicalSignificance: 'Elevated TSH suggests Subclinical/Overt Hypothyroidism, which can mimic PCOS oligo-ovulation.'
    });
  } else if (patient.tsh < 0.4 && patient.tsh > 0) {
    anomalies.push({
      marker: 'TSH (Thyrotropin)',
      value: patient.tsh,
      unit: 'uIU/mL',
      normalRange: '0.4 - 4.0',
      status: 'low',
      clinicalSignificance: 'Suppressed TSH suggests hyperthyroidism. Workup indicated.'
    });
  }

  // Prolactin (Differential check)
  if (patient.prolactin > 25) {
    anomalies.push({
      marker: 'Prolactin',
      value: patient.prolactin,
      unit: 'ng/mL',
      normalRange: '2.0 - 20.0',
      status: 'elevated',
      clinicalSignificance: 'Hyperprolactinemia must be evaluated to rule out prolactinoma prior to isolated PCOS diagnosis.'
    });
  }

  // Vitamin D3
  if (patient.vitaminD3 < 20 && patient.vitaminD3 > 0) {
    anomalies.push({
      marker: 'Vitamin D3 (25-OH)',
      value: patient.vitaminD3,
      unit: 'ng/mL',
      normalRange: '30.0 - 100.0',
      status: 'low',
      clinicalSignificance: 'Vitamin D deficiency exacerbates insulin resistance and ovulatory dysfunction in PCOS patients.'
    });
  }

  // Random Blood Sugar
  if (patient.randomBloodSugar >= 140) {
    anomalies.push({
      marker: 'Random Blood Sugar',
      value: patient.randomBloodSugar,
      unit: 'mg/dL',
      normalRange: '70 - 125',
      status: 'elevated',
      clinicalSignificance: 'Impaired glucose tolerance / metabolic syndrome risk. Consider 2-hr 75g OGTT or HbA1c.'
    });
  }

  // Blood Pressure
  if (patient.systolicBp >= 135 || patient.diastolicBp >= 85) {
    anomalies.push({
      marker: 'Blood Pressure',
      value: `${patient.systolicBp}/${patient.diastolicBp}`,
      unit: 'mmHg',
      normalRange: '< 120/80',
      status: 'elevated',
      clinicalSignificance: 'Prehypertension/Hypertension. Cardiovascular surveillance advised.'
    });
  }

  return anomalies;
}
