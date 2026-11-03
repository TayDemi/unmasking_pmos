import { GoogleGenAI } from '@google/genai';
import { PatientData, ModelPrediction, RotterdamEvaluation, LabAnomaly } from '../types/pcos';

export async function generateClinicalSynthesis(
  patient: PatientData,
  prediction: ModelPrediction,
  rotterdam: RotterdamEvaluation,
  anomalies: LabAnomaly[]
): Promise<string> {
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  const patientSummaryText = `
PATIENT CLINICAL SUMMARY:
- Name: ${patient.name}, Age: ${patient.age}, MRN: ${patient.mrn}
- BMI: ${patient.bmi} kg/m² (Weight: ${patient.weightKg}kg, Height: ${patient.heightCm}cm), BP: ${patient.systolicBp}/${patient.diastolicBp} mmHg
- Menstrual: ${patient.cycleRegularity} cycle (${patient.cycleLengthDays} days)
- Endocrine Labs:
  * LH: ${patient.lh} mIU/mL, FSH: ${patient.fsh} mIU/mL (LH/FSH Ratio: ${patient.lhFshRatio.toFixed(2)})
  * AMH: ${patient.amh} ng/mL
  * TSH: ${patient.tsh} uIU/mL, Prolactin: ${patient.prolactin} ng/mL
  * Vitamin D3: ${patient.vitaminD3} ng/mL, RBS: ${patient.randomBloodSugar} mg/dL
- Pelvic Ultrasonography (USG):
  * Left Ovary Follicle Count: ${patient.follicleCountLeft}
  * Right Ovary Follicle Count: ${patient.follicleCountRight} (Total: ${patient.totalFollicles})
  * Endometrial Thickness: ${patient.endometriumThicknessMm} mm
- Clinical Manifestations:
  * Hirsutism: ${patient.excessHairGrowth ? 'Positive' : 'Negative'}
  * Acanthosis Nigricans: ${patient.skinDarkening ? 'Positive' : 'Negative'}
  * Alopecia: ${patient.hairLoss ? 'Positive' : 'Negative'}
  * Acne: ${patient.pimplesOrAcne ? 'Positive' : 'Negative'}
  * Weight Gain: ${patient.weightGain ? 'Positive' : 'Negative'}

ML MODEL OUTPUT:
- Risk Tier: ${prediction.riskTier} (${prediction.percentage}% probability)
- Predicted Class: ${prediction.predictedClass}
- Top Risk Factors: ${prediction.contributions.slice(0, 4).map(c => `${c.featureName} (${c.impact > 0 ? '+' : ''}${c.impact}%)`).join(', ')}

ROTTERDAM CONSENSUS:
- Criteria Satisfied: ${rotterdam.metCriteriaCount}/3
- Phenotype: ${rotterdam.derivedPhenotype}
- Ovulatory Dysfunction: ${rotterdam.criteria1_ovulation ? 'Present' : 'Absent'}
- Hyperandrogenism: ${rotterdam.criteria2_androgen ? 'Present' : 'Absent'}
- Polycystic Ovaries: ${rotterdam.criteria3_polycysticOvaries ? 'Present' : 'Absent'}

LAB ANOMALIES FLAGGED:
${anomalies.map(a => `- ${a.marker}: ${a.value} ${a.unit} (${a.normalRange}) - ${a.clinicalSignificance}`).join('\n') || '- None'}
`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a clinical decision support specialist and senior reproductive endocrinologist. 
Review the following patient data, machine learning detection output, and Rotterdam Consensus criteria evaluation.
Provide a concise, formal clinical consultation note for the attending physician.

Include the following structured sections:
1. CLINICAL IMPRESSION & PHENOTYPE SYNTHESIS
2. KEY DIAGNOSTIC DRIVERS & RISK STRATIFICATION
3. DIFFERENTIAL DIAGNOSIS CONSIDERATIONS (specifically note TSH, Prolactin, and other mimics)
4. RECOMMENDED CLINICAL MANAGEMENT & SURVEILLANCE PLAN (include lifestyle, metabolic monitoring, pharmacotherapy considerations)

Keep tone objective, evidence-based, professional, and clear. Format in markdown.

${patientSummaryText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      if (response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn('Gemini API call error, falling back to algorithmic synthesis:', err);
    }
  }

  // Fallback high-fidelity algorithmic clinical synthesis
  return generateDeterministicClinicalSynthesis(patient, prediction, rotterdam, anomalies);
}

function generateDeterministicClinicalSynthesis(
  patient: PatientData,
  prediction: ModelPrediction,
  rotterdam: RotterdamEvaluation,
  anomalies: LabAnomaly[]
): string {
  const isHighRisk = prediction.percentage >= 68;
  const isHypothyroidMimic = patient.tsh > 4.5;
  const isHyperprolactinemia = patient.prolactin > 25;

  let text = `### 1. Clinical Impression & Phenotype Synthesis\n`;
  text += `Patient **${patient.name}** (Age ${patient.age}, MRN: ${patient.mrn}) presents with an ML-predicted probability of **${prediction.percentage}%** for Polycystic Ovary Syndrome (${prediction.riskTier}). `;

  if (rotterdam.satisfiesRotterdam) {
    text += `Rotterdam 2003 consensus criteria are **satisfied (${rotterdam.metCriteriaCount}/3 criteria)**, aligning with **${rotterdam.derivedPhenotype}**.\n\n`;
  } else {
    text += `Rotterdam criteria currently show **${rotterdam.metCriteriaCount}/3 criteria met**, indicating insufficient clinical and imaging criteria for definitive isolated PCOS at this visit.\n\n`;
  }

  text += `### 2. Key Diagnostic Drivers & Risk Stratification\n`;
  if (patient.totalFollicles >= 20 || patient.follicleCountLeft >= 12 || patient.follicleCountRight >= 12) {
    text += `- **Ultrasonography**: Antral follicle count of **${patient.totalFollicles}** (Left: ${patient.follicleCountLeft}, Right: ${patient.follicleCountRight}) exceeds the diagnostic threshold for PCOM.\n`;
  }
  if (patient.lhFshRatio >= 1.8) {
    text += `- **Neuroendocrine**: LH/FSH ratio is **${patient.lhFshRatio.toFixed(2)}** (LH: ${patient.lh} mIU/mL, FSH: ${patient.fsh} mIU/mL), demonstrating altered gonadotropin-releasing hormone pulsatility.\n`;
  }
  if (patient.amh >= 5.0) {
    text += `- **Ovarian Reserve & Granulosa Function**: AMH is elevated at **${patient.amh} ng/mL**, reflecting an expanded preantral and small antral follicle cohort.\n`;
  }
  if (patient.skinDarkening || patient.bmi >= 28) {
    text += `- **Metabolic Profile**: Evidence of metabolic involvement with BMI ${patient.bmi} kg/m² ${patient.skinDarkening ? 'and cutaneous Acanthosis Nigricans indicating severe peripheral insulin resistance' : ''}.\n`;
  }
  text += `\n`;

  text += `### 3. Differential Diagnosis & Exclusion Checklist\n`;
  if (isHypothyroidMimic) {
    text += `- ⚠️ **Thyroid Axis Warning**: Serum TSH is elevated at **${patient.tsh} uIU/mL**. Hypothyroidism can induce secondary oligomenorrhea and ovarian morphological changes. Must establish euthyroid state prior to finalizing PCOS diagnosis.\n`;
  } else {
    text += `- **Thyroid Axis**: TSH (${patient.tsh} uIU/mL) within normal physiologic range; thyroid dysfunction excluded.\n`;
  }

  if (isHyperprolactinemia) {
    text += `- ⚠️ **Prolactin Warning**: Serum Prolactin is **${patient.prolactin} ng/mL** (elevated). Evaluate for medication-induced hyperprolactinemia or microprolactinoma.\n`;
  } else {
    text += `- **Prolactin Axis**: Prolactin (${patient.prolactin} ng/mL) normal; hyperprolactinemia excluded.\n`;
  }

  text += `- **Adrenal Hyperplasia**: Recommend baseline early morning 17-OHP if clinical hirsutism is severe or rapidly progressive to rule out Non-Classic CAH.\n\n`;

  text += `### 4. Recommended Clinical Management Plan\n`;
  if (isHighRisk) {
    text += `1. **Endometrial Protection**: ${patient.endometriumThicknessMm >= 10 ? 'Endometrial stripe is thickened (' + patient.endometriumThicknessMm + ' mm); cyclic progestin withdrawal or combined oral contraceptives indicated.' : 'Ensure regular cyclic shedding to prevent hyperplasia.'}\n`;
    text += `2. **Cardiometabolic Screening**: Order a 75g 2-hour oral glucose tolerance test (OGTT) and fasting lipid panel.\n`;
    text += `3. **First-Line Lifestyle & Medical Therapy**: Nutrition and resistance exercise regimen. Consider Metformin ${patient.bmi >= 25 || patient.skinDarkening ? '(indicated for insulin resistance)' : 'or inositol supplements'}.\n`;
    text += `4. **Hyperandrogenism Control**: If pregnancy is not currently sought, combined hormonal contraceptives or anti-androgen therapy (e.g. Spironolactone) for cutaneous symptoms.\n`;
  } else {
    text += `1. **Observation & Monitoring**: Re-evaluate menstrual regularity and repeat ultrasound in 6–12 months.\n`;
    text += `2. **Address Concomitant Deficiencies**: Correct low Vitamin D3 (${patient.vitaminD3} ng/mL) and support general ovulatory health.\n`;
  }

  return text;
}
