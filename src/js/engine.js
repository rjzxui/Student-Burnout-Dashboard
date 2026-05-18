export const AnalyticsEngine = {
    calculateBurnoutIndex(biometricsList, survivalModeActive) {
        if (!biometricsList || biometricsList.length === 0) return { score: 0, status: 'Nominal' };

        const evaluationWindow = biometricsList.slice(-5);
        let absoluteStudyVolume = 0;
        let absoluteSleepVolume = 0;
        let cumulativeStressInput = 0;

        evaluationWindow.forEach(entry => {
            absoluteStudyVolume += parseFloat(entry.studyHours || 0);
            absoluteSleepVolume += parseFloat(entry.sleepHours || 0);
            cumulativeStressInput += parseInt(entry.stressLevel || 1);
        });

        const MeanStudyHours = absoluteStudyVolume / evaluationWindow.length;
        const MeanSleepHours = absoluteSleepVolume / evaluationWindow.length;
        const MeanStressRank = cumulativeStressInput / evaluationWindow.length;

        const sleepDeficitFactor = Math.max(0, 8 - MeanSleepHours) * 15;
        const studyIntensityFactor = MeanStudyHours * 8;
        const empiricalStressVector = MeanStressRank * 4;

        let compositeBurnoutScore = sleepDeficitFactor + studyIntensityFactor + empiricalStressVector;
        
        if (survivalModeActive) {
            compositeBurnoutScore *= 0.65; 
        }

        const calculatedScore = Math.min(100, Math.round(compositeBurnoutScore));

        let healthClassification = 'Nominal';
        if (calculatedScore > 45) healthClassification = 'Warning Threshold';
        if (calculatedScore > 75) healthClassification = 'Critical Burnout Risk';

        return { score: calculatedScore, status: healthClassification };
    },

    generateAdaptiveStudyPlan(subjects, currentBurnoutIndex, survivalModeActive) {
        let recommendationOutput = [];
        const baseAllocationHours = survivalModeActive ? 3.5 : 5.0;

        let cognitiveScaleModifier = 1.0;
        if (currentBurnoutIndex > 45) cognitiveScaleModifier = 0.75;
        if (currentBurnoutIndex > 75) cognitiveScaleModifier = 0.40;

        const netUsableStudyHours = baseAllocationHours * cognitiveScaleModifier;

        if (survivalModeActive) {
            recommendationOutput.push({
                type: 'SYSTEM_CRITICAL',
                message: '🚨 CRITICAL DIRECTIVE: Survival Mode active. Postpone optional objectives immediately. Target core exam topics.'
            });
        }

        if (currentBurnoutIndex > 75 && !survivalModeActive) {
            recommendationOutput.push({
                type: 'EMERGENCY_RECOVERY',
                message: '🛑 SYSTEM ALERT: Fatigue indices exceeded limits. Mandatory rest protocol initiated. Reduce active workloads by 60%.'
            });
        }

        subjects.forEach(subject => {
            const completionRatio = subject.completedChapters / subject.totalChapters;
            if (completionRatio < 1.0) {
                let subjectAllocationTime = (1.0 - completionRatio) * (netUsableStudyHours / subjects.length);
                recommendationOutput.push({
                    type: 'SUBJECT_ALLOCATION',
                    message: `Dedicate ${subjectAllocationTime.toFixed(1)} hours to [${subject.name}]. Focus heavily on incomplete modules.`
                });
            }
        });

        return recommendationOutput;
    }
};
