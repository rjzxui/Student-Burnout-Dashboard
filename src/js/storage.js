export const StorageEngine = {
    keys: {
        SUBJECTS: 'aegis_mind_subjects',
        METRICS: 'aegis_mind_biometrics',
        CONFIG: 'aegis_mind_system_config'
    },

    initializeDefaults() {
        if (!localStorage.getItem(this.keys.SUBJECTS)) {
            const initialSubjects = [
                { id: 'sub-1', name: 'Mathematics', totalChapters: 15, completedChapters: 4 },
                { id: 'sub-2', name: 'Science Core', totalChapters: 12, completedChapters: 2 },
                { id: 'sub-3', name: 'Social Sciences', totalChapters: 10, completedChapters: 6 }
            ];
            localStorage.setItem(this.keys.SUBJECTS, JSON.stringify(initialSubjects));
        }

        if (!localStorage.getItem(this.keys.METRICS)) {
            const initialMetrics = [
                { timestamp: Date.now() - 432000000, studyHours: 4.5, sleepHours: 7.2, stressLevel: 3 },
                { timestamp: Date.now() - 345600000, studyHours: 5.0, sleepHours: 6.8, stressLevel: 4 },
                { timestamp: Date.now() - 259200000, studyHours: 6.2, sleepHours: 5.5, stressLevel: 6 },
                { timestamp: Date.now() - 172800000, studyHours: 7.5, sleepHours: 4.8, stressLevel: 8 },
                { timestamp: Date.now() - 864000000, studyHours: 3.0, sleepHours: 8.0, stressLevel: 2 }
            ];
            localStorage.setItem(this.keys.METRICS, JSON.stringify(initialMetrics));
        }

        if (!localStorage.getItem(this.keys.CONFIG)) {
            const initialConfig = { survivalMode: false, darkMode: true };
            localStorage.setItem(this.keys.CONFIG, JSON.stringify(initialConfig));
        }
    },

    getData(key) {
        return JSON.parse(localStorage.getItem(key)) || [];
    },

    setData(key, payload) {
        localStorage.setItem(key, JSON.stringify(payload));
    },

    updateConfig(updates) {
        const current = this.getData(this.keys.CONFIG);
        this.setData(this.keys.CONFIG, { ...current, ...updates });
    }
};
