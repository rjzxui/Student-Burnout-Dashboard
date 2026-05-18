import { StorageEngine } from './storage.js';
import { AnalyticsEngine } from './engine.js';
import { DashboardView } from './dashboard.js';

const AppKernel = {
    timerState: {
        intervalInstance: null,
        totalSecondsRemaining: 1500,
        isActive: false
    },

    initialize() {
        StorageEngine.initializeDefaults();
        lucide.createIcons();
        this.bindUserInterfaceEvents();
        this.synchronizeSystemMetricsPipeline();
    },

    synchronizeSystemMetricsPipeline() {
        const subjects = StorageEngine.getData(StorageEngine.keys.SUBJECTS);
        const biometrics = StorageEngine.getData(StorageEngine.keys.METRICS);
        const configuration = StorageEngine.getData(StorageEngine.keys.CONFIG);

        const totalPossible = subjects.reduce((acc, current) => acc + current.totalChapters, 0);
        const totalCompleted = subjects.reduce((acc, current) => acc + current.completedChapters, 0);
        const completionPercentage = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;
        
        const runtimeSleepAverage = biometrics.length > 0 
            ? biometrics.reduce((acc, cur) => acc + parseFloat(cur.sleepHours), 0) / biometrics.length 
            : 0;

        const evaluatedBurnout = AnalyticsEngine.calculateBurnoutIndex(biometrics, configuration.survivalMode);
        const dynamicStudyPlan = AnalyticsEngine.generateAdaptiveStudyPlan(subjects, evaluatedBurnout.score, configuration.survivalMode);

        DashboardView.renderAll({
            burnout: evaluatedBurnout,
            avgSleep: runtimeSleepAverage,
            syllabusCompletion: completionPercentage,
            historicalMetrics: biometrics,
            studyPlan: dynamicStudyPlan
        });

        this.refreshInterfaceStateIndicators(configuration);
    },

    refreshInterfaceStateIndicators(config) {
        const pulseIndicator = document.querySelector('#survivalToggleBtn span');
        const textLabel = document.querySelector('#survivalToggleBtn span:not(.rounded-full)');

        if (config.survivalMode) {
            pulseIndicator.className = 'w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse dynamic-pulse';
            textLabel.innerText = 'Survival Protocol Active';
            textLabel.className = 'text-sm font-semibold tracking-wide uppercase text-red-400';
            document.getElementById('survivalBufferText').innerText = 'Active (Workload -35%)';
        } else {
            pulseIndicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
            textLabel.innerText = 'Survival Mode';
            textLabel.className = 'text-sm font-semibold tracking-wide uppercase text-slate-300';
            document.getElementById('survivalBufferText').innerText = 'Inactive';
        }

        if (config.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    bindUserInterfaceEvents() {
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.getAttribute('data-tab');
                
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'bg-indigo-600', 'text-white'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.add('text-slate-400'));
                
                e.currentTarget.classList.add('active', 'bg-indigo-600', 'text-white');
                e.currentTarget.classList.remove('text-slate-400');

                document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
                document.getElementById(`${targetTab}-pane`).classList.remove('hidden');
            });
        });

        document.getElementById('survivalToggleBtn').addEventListener('click', () => {
            const config = StorageEngine.getData(StorageEngine.keys.CONFIG);
            StorageEngine.updateConfig({ survivalMode: !config.survivalMode });
            this.synchronizeSystemMetricsPipeline();
        });

        document.getElementById('biometricLoggingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const targetMetricsArray = StorageEngine.getData(StorageEngine.keys.METRICS);

            targetMetricsArray.push({
                timestamp: Date.now(),
                studyHours: parseFloat(formData.get('studyHoursInput')),
                sleepHours: parseFloat(formData.get('sleepHoursInput')),
                stressLevel: parseInt(formData.get('stressRankingSlider'))
            });

            StorageEngine.setData(StorageEngine.keys.METRICS, targetMetricsArray);
            e.target.reset();
            this.synchronizeSystemMetricsPipeline();
            alert('Metrics snapshot committed successfully.');
        });

        document.getElementById('syllabusGridContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('increment-chapter-btn')) {
                const subjectId = e.target.getAttribute('data-id');
                const dataset = StorageEngine.getData(StorageEngine.keys.SUBJECTS);
                const targetedIndex = dataset.findIndex(s => s.id === subjectId);

                if (targetedIndex !== -1 && dataset[targetedIndex].completedChapters < dataset[targetedIndex].totalChapters) {
                    dataset[targetedIndex].completedChapters++;
                    StorageEngine.setData(StorageEngine.keys.SUBJECTS, dataset);
                    this.synchronizeSystemMetricsPipeline();
                }
            }
        });

        document.getElementById('openSubjectModalBtn').addEventListener('click', () => {
            document.getElementById('subjectCreationModal').classList.replace('hidden', 'flex');
        });
        document.getElementById('closeSubjectModalBtn').addEventListener('click', () => {
            document.getElementById('subjectCreationModal').classList.replace('flex', 'hidden');
        });

        document.getElementById('subjectCreationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const subjectTitle = document.getElementById('modalSubjectName').value;
            const absoluteChapters = parseInt(document.getElementById('modalSubjectChapters').value);
            const activeSubjects = StorageEngine.getData(StorageEngine.keys.SUBJECTS);

            activeSubjects.push({
                id: `sub-${Date.now()}`,
                name: subjectTitle,
                totalChapters: absoluteChapters,
                completedChapters: 0
            });

            StorageEngine.setData(StorageEngine.keys.SUBJECTS, activeSubjects);
            document.getElementById('subjectCreationForm').reset();
            document.getElementById('subjectCreationModal').classList.replace('flex', 'hidden');
            this.synchronizeSystemMetricsPipeline();
        });

        document.getElementById('primaryTimerControlBtn').addEventListener('click', () => this.toggleFocusTimerStatePipeline());
        document.getElementById('resetTimerControlBtn').addEventListener('click', () => this.terminateFocusTimerStatePipeline());
    },

    toggleFocusTimerStatePipeline() {
        const controlString = document.getElementById('timerControlString');
        if (this.timerState.isActive) {
            clearInterval(this.timerState.intervalInstance);
            this.timerState.isActive = false;
            controlString.innerText = 'Resume Protocol';
        } else {
            this.timerState.isActive = true;
            controlString.innerText = 'Halt Protocol';
            this.timerState.intervalInstance = setInterval(() => {
                if (this.timerState.totalSecondsRemaining > 0) {
                    this.timerState.totalSecondsRemaining--;
                    this.refreshTimerGraphicInterface();
                } else {
                    clearInterval(this.timerState.intervalInstance);
                    alert('Focus window complete. Take a refreshing dynamic break sequence.');
                    this.terminateFocusTimerStatePipeline();
                }
            }, 1000);
        }
    },

    terminateFocusTimerStatePipeline() {
        clearInterval(this.timerState.intervalInstance);
        this.timerState.isActive = false;
        this.timerState.totalSecondsRemaining = 1500;
        document.getElementById('timerControlString').innerText = 'Initiate Protocol';
        this.refreshTimerGraphicInterface();
    },

    refreshTimerGraphicInterface() {
        const computedMinutes = Math.floor(this.timerState.totalSecondsRemaining / 60);
        const computedSeconds = this.timerState.totalSecondsRemaining % 60;
        document.getElementById('countdownTimeDisplay').innerText = 
            `${computedMinutes.toString().padStart(2, '0')}:${computedSeconds.toString().padStart(2, '0')}`;

        const ringObject = document.getElementById('timerProgressRing');
        const offsetCalculated = (this.timerState.totalSecondsRemaining / 1500) * 816.8;
        ringObject.style.strokeDashoffset = 816.8 - offsetCalculated;
    }
};

document.addEventListener('DOMContentLoaded', () => AppKernel.initialize());
