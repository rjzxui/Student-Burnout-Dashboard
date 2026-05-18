import { StorageEngine } from './storage.js';

export const DashboardView = {
    charts: {},

    renderAll(analyticsData) {
        this.renderOverviewMetrics(analyticsData);
        this.renderSyllabusMatrix();
        this.renderAdaptivePlannerCards(analyticsData.studyPlan);
        this.initializeOrUpdateCharts(analyticsData.historicalMetrics);
    },

    renderOverviewMetrics(data) {
        const scoreDisplay = document.getElementById('burnoutMetricDisplay');
        const statusTag = document.getElementById('burnoutStatusTag');
        const barDisplay = document.getElementById('burnoutProgressBar');
        const adviceDisplay = document.getElementById('burnoutAdviceString');

        scoreDisplay.innerText = `${data.burnout.score}%`;
        statusTag.innerText = data.burnout.status;
        barDisplay.style.width = `${data.burnout.score}%`;

        statusTag.className = 'text-xs font-bold px-2 py-0.5 rounded-full uppercase ';
        if (data.burnout.score <= 45) {
            statusTag.className += 'bg-emerald-500/10 text-emerald-400';
            adviceDisplay.innerText = 'Academic velocity sustainable. Maintain current routing targets.';
        } else if (data.burnout.score <= 75) {
            statusTag.className += 'bg-amber-500/10 text-amber-400';
            adviceDisplay.innerText = 'System fatigue elevated. AI suggests mitigating micro-tasks.';
        } else {
            statusTag.className += 'bg-red-500/10 text-red-400';
            adviceDisplay.innerText = 'Emergency protocol recommended. Activate Survival Mode immediately.';
        }

        document.getElementById('averageSleepDisplay').innerText = `${data.avgSleep.toFixed(1)}h`;
        document.getElementById('syllabusCompletionDisplay').innerText = `${Math.round(data.syllabusCompletion)}%`;
        document.getElementById('syllabusProgressBar').style.width = `${data.syllabusCompletion}%`;
    },

    renderSyllabusMatrix() {
        const container = document.getElementById('syllabusGridContainer');
        const subjects = StorageEngine.getData(StorageEngine.keys.SUBJECTS);
        container.innerHTML = '';

        subjects.forEach(sub => {
            const completionPercent = Math.round((sub.completedChapters / sub.totalChapters) * 100);
            const card = document.createElement('div');
            card.className = 'bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-slate-200 tracking-tight">${sub.name}</h4>
                    <span class="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">${completionPercent}%</span>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between text-xs text-slate-400">
                        <span>Progress Metric</span>
                        <span>${sub.completedChapters} / ${sub.totalChapters} Units</span>
                    </div>
                    <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-indigo-500 h-full" style="width: ${completionPercent}%"></div>
                    </div>
                </div>
                <div class="flex space-x-2 pt-2">
                    <button data-id="${sub.id}" class="increment-chapter-btn flex-1 py-2 bg-slate-800 hover:bg-slate-700 transition rounded-lg text-xs font-semibold">
                        Log Completed Unit
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    renderAdaptivePlannerCards(plan) {
        const container = document.getElementById('aiPlannerOutputArea');
        container.innerHTML = '';

        plan.forEach(item => {
            const alertElement = document.createElement('div');
            alertElement.className = `p-4 rounded-xl text-sm border flex items-start space-x-3 `;
            
            if (item.type === 'SYSTEM_CRITICAL') {
                alertElement.className += 'bg-red-500/10 border-red-500/20 text-red-400';
            } else if (item.type === 'EMERGENCY_RECOVERY') {
                alertElement.className += 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            } else {
                alertElement.className += 'bg-slate-900 border-slate-800 text-slate-300';
            }

            alertElement.innerHTML = `
                <i data-lucide="info" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
                <span class="leading-relaxed">${item.message}</span>
            `;
            container.appendChild(alertElement);
        });
        lucide.createIcons();
    },

    initializeOrUpdateCharts(historicalMetrics) {
        const labels = historicalMetrics.map((_, index) => `Log ${index + 1}`);
        const studyData = historicalMetrics.map(m => m.studyHours);
        const stressData = historicalMetrics.map(m => m.stressLevel);

        if (this.charts.productivity) this.charts.productivity.destroy();
        if (this.charts.burnout) this.charts.burnout.destroy();

        const productivityCtx = document.getElementById('productivityTrendChart').getContext('2d');
        this.charts.productivity = new Chart(productivityCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Study Run Hours',
                    data: studyData,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        const burnoutCtx = document.getElementById('burnoutTimelineChart').getContext('2d');
        this.charts.burnout = new Chart(burnoutCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stress Scale Tracker',
                    data: stressData,
                    backgroundColor: '#f59e0b',
                    borderRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
};
