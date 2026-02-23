/**
 * Main application entry point
 * Handles DOM interactions, event listeners, and visualization rendering
 */

import {
  Process,
  fcfs,
  sjfNonPreemptive,
  sjfPreemptive,
  roundRobin,
  priorityNonPreemptive,
  priorityPreemptive,
  multilevelQueue
} from './scheduler.js';

// State
let processes = [];
let processCounter = 1;

// Color palette for processes
const colors = [
  'process-color-0', 'process-color-1', 'process-color-2', 'process-color-3',
  'process-color-4', 'process-color-5', 'process-color-6', 'process-color-7'
];

// Algorithm configurations - defines which fields are required
const algorithmConfig = {
  'fcfs': { name: 'First Come First Serve (FCFS)', needsPriority: false, needsQuantum: false },
  'sjf-np': { name: 'Shortest Job First (Non-Preemptive)', needsPriority: false, needsQuantum: false },
  'sjf-p': { name: 'Shortest Job First (Preemptive - SRTF)', needsPriority: false, needsQuantum: false },
  'rr': { name: 'Round Robin', needsPriority: false, needsQuantum: true },
  'priority-np': { name: 'Priority (Non-Preemptive)', needsPriority: true, needsQuantum: false },
  'priority-p': { name: 'Priority (Preemptive)', needsPriority: true, needsQuantum: false },
  'mlq': { name: 'Multilevel Queue (MLQ)', needsPriority: true, needsQuantum: false }
};

// DOM Elements
const processForm = document.getElementById('process-form');
const processIdInput = document.getElementById('process-id');
const arrivalTimeInput = document.getElementById('arrival-time');
const burstTimeInput = document.getElementById('burst-time');
const priorityInput = document.getElementById('priority');
const priorityContainer = document.getElementById('priority-container');
const algorithmSelect = document.getElementById('algorithm');
const quantumContainer = document.getElementById('quantum-container');
const timeQuantumInput = document.getElementById('time-quantum');
const calculateBtn = document.getElementById('calculate-btn');
const compareBtn = document.getElementById('compare-btn');
const resetBtn = document.getElementById('reset-btn');
const processQueue = document.getElementById('process-queue');
const emptyQueueMsg = document.getElementById('empty-queue-msg');
const processCountEl = document.getElementById('process-count');
const ganttSection = document.getElementById('gantt-section');
const ganttChart = document.getElementById('gantt-chart');
const ganttTimeline = document.getElementById('gantt-timeline');
const tableSection = document.getElementById('table-section');
const resultsTableBody = document.getElementById('results-table-body');
const analyticsSection = document.getElementById('analytics-section');
const avgWtEl = document.getElementById('avg-wt');
const avgTatEl = document.getElementById('avg-tat');
const comparisonSection = document.getElementById('comparison-section');
const comparisonTableBody = document.getElementById('comparison-table-body');
const mlqInfoSection = document.getElementById('mlq-info-section');

// Initialize
function init() {
  updateProcessId();
  setupEventListeners();
  updateFieldVisibility();
}

function setupEventListeners() {
  // Process form submission
  processForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addProcess();
  });

  // Algorithm selection change
  algorithmSelect.addEventListener('change', () => {
    updateFieldVisibility();
  });

  // Calculate button
  calculateBtn.addEventListener('click', calculate);

  // Compare button
  if (compareBtn) {
    compareBtn.addEventListener('click', compareAlgorithms);
  }

  // Reset button
  resetBtn.addEventListener('click', reset);
}

function updateFieldVisibility() {
  const algorithm = algorithmSelect.value;
  const config = algorithmConfig[algorithm];

  // Toggle priority field
  if (priorityContainer) {
    if (config.needsPriority) {
      priorityContainer.classList.remove('hidden');
      priorityInput.setAttribute('required', 'required');
    } else {
      priorityContainer.classList.add('hidden');
      priorityInput.removeAttribute('required');
    }
  }

  // Toggle quantum field
  if (quantumContainer) {
    if (config.needsQuantum) {
      quantumContainer.classList.remove('hidden');
    } else {
      quantumContainer.classList.add('hidden');
    }
  }

  // Show/hide MLQ info
  updateMLQHint();
}

function updateMLQHint() {
  const algorithm = algorithmSelect.value;
  const mlqHint = document.getElementById('mlq-hint');

  if (mlqHint) {
    if (algorithm === 'mlq') {
      mlqHint.classList.remove('hidden');
    } else {
      mlqHint.classList.add('hidden');
    }
  }
}

function updateProcessId() {
  processIdInput.value = `P${processCounter}`;
}

function addProcess() {
  const arrivalTime = parseInt(arrivalTimeInput.value) || 0;
  const burstTime = parseInt(burstTimeInput.value);
  const algorithm = algorithmSelect.value;
  const config = algorithmConfig[algorithm];

  // Get priority - use 1 as default if not required
  let priority = 1;
  if (config.needsPriority) {
    priority = parseInt(priorityInput.value);
    if (!priority || priority < 1) {
      alert('Please enter a valid priority (≥ 1)');
      return;
    }
  }

  if (!burstTime || burstTime < 1) {
    alert('Please enter a valid burst time (≥ 1)');
    return;
  }

  const process = new Process(`P${processCounter}`, arrivalTime, burstTime, priority);
  processes.push(process);
  processCounter++;

  renderProcessQueue();
  updateProcessId();

  // Reset form inputs
  arrivalTimeInput.value = '';
  burstTimeInput.value = '';
  priorityInput.value = '';
  arrivalTimeInput.focus();
}

function removeProcess(id) {
  processes = processes.filter(p => p.id !== id);
  renderProcessQueue();
}

function renderProcessQueue() {
  const algorithm = algorithmSelect.value;
  const config = algorithmConfig[algorithm];

  processQueue.innerHTML = '';

  if (processes.length === 0) {
    processQueue.innerHTML = `<p id="empty-queue-msg" class="text-gray-500 text-sm italic">No processes added yet. Add a process above to get started.</p>`;
    processCountEl.textContent = '0 processes';
    return;
  }

  processCountEl.textContent = `${processes.length} process${processes.length > 1 ? 'es' : ''}`;

  processes.forEach((proc, index) => {
    const chip = document.createElement('div');
    chip.className = 'process-chip';

    // Only show priority if the algorithm uses it
    const priorityText = config.needsPriority ? ` | P: ${proc.priority}` : '';

    chip.innerHTML = `
      <span class="w-3 h-3 rounded-full ${colors[index % colors.length]}"></span>
      <span>${proc.id}</span>
      <span class="text-gray-400 text-xs">AT: ${proc.arrivalTime} | BT: ${proc.burstTime}${priorityText}</span>
      <button class="delete-btn" data-id="${proc.id}">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;

    chip.querySelector('.delete-btn').addEventListener('click', () => {
      removeProcess(proc.id);
    });

    processQueue.appendChild(chip);
  });
}

function calculate() {
  if (processes.length === 0) {
    alert('Please add at least one process.');
    return;
  }

  const algorithm = algorithmSelect.value;
  let result;

  // Reset process states
  processes.forEach(p => p.reset());

  switch (algorithm) {
    case 'fcfs':
      result = fcfs(processes);
      break;
    case 'sjf-np':
      result = sjfNonPreemptive(processes);
      break;
    case 'sjf-p':
      result = sjfPreemptive(processes);
      break;
    case 'rr':
      const quantum = parseInt(timeQuantumInput.value) || 2;
      if (quantum < 1) {
        alert('Time quantum must be at least 1.');
        return;
      }
      result = roundRobin(processes, quantum);
      break;
    case 'priority-np':
      result = priorityNonPreemptive(processes);
      break;
    case 'priority-p':
      result = priorityPreemptive(processes);
      break;
    case 'mlq':
      result = multilevelQueue(processes);
      renderMLQInfo(result.queueInfo);
      break;
    default:
      result = fcfs(processes);
  }

  renderGanttChart(result.timeline, algorithm === 'mlq');
  renderResultsTable(result.processes);
  renderAnalytics(result.processes);

  // Show sections
  ganttSection.classList.remove('hidden');
  tableSection.classList.remove('hidden');
  analyticsSection.classList.remove('hidden');

  // Hide comparison section if visible
  if (comparisonSection) {
    comparisonSection.classList.add('hidden');
  }

  // Show/hide MLQ info
  if (mlqInfoSection) {
    if (algorithm === 'mlq') {
      mlqInfoSection.classList.remove('hidden');
    } else {
      mlqInfoSection.classList.add('hidden');
    }
  }

  // Smooth scroll to Gantt chart
  ganttSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderMLQInfo(queueInfo) {
  const mlqQueuesEl = document.getElementById('mlq-queues');
  if (!mlqQueuesEl || !queueInfo) return;

  mlqQueuesEl.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="mlq-queue-card q1">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-rose-400">Queue 1</h4>
            <p class="text-xs text-zinc-500">${queueInfo.queue1.name}</p>
          </div>
        </div>
        <div class="space-y-1 text-sm">
          <p class="text-zinc-400"><span class="text-zinc-500">Algorithm:</span> ${queueInfo.queue1.algorithm}</p>
          <p class="text-zinc-400"><span class="text-zinc-500">Processes:</span> <span class="text-rose-400 font-medium">${queueInfo.queue1.count}</span></p>
        </div>
      </div>
      <div class="mlq-queue-card q2">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-amber-400">Queue 2</h4>
            <p class="text-xs text-zinc-500">${queueInfo.queue2.name}</p>
          </div>
        </div>
        <div class="space-y-1 text-sm">
          <p class="text-zinc-400"><span class="text-zinc-500">Algorithm:</span> ${queueInfo.queue2.algorithm}</p>
          <p class="text-zinc-400"><span class="text-zinc-500">Processes:</span> <span class="text-amber-400 font-medium">${queueInfo.queue2.count}</span></p>
        </div>
      </div>
      <div class="mlq-queue-card q3">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-blue-400">Queue 3</h4>
            <p class="text-xs text-zinc-500">${queueInfo.queue3.name}</p>
          </div>
        </div>
        <div class="space-y-1 text-sm">
          <p class="text-zinc-400"><span class="text-zinc-500">Algorithm:</span> ${queueInfo.queue3.algorithm}</p>
          <p class="text-zinc-400"><span class="text-zinc-500">Processes:</span> <span class="text-blue-400 font-medium">${queueInfo.queue3.count}</span></p>
        </div>
      </div>
    </div>
  `;
}

function compareAlgorithms() {
  if (processes.length === 0) {
    alert('Please add at least one process.');
    return;
  }

  // Check if any process has priority set for fair comparison
  const hasPriority = processes.some(p => p.priority > 1);

  const results = [];
  const quantum = parseInt(timeQuantumInput.value) || 2;

  // Run all algorithms
  const algorithms = [
    { key: 'fcfs', name: 'FCFS', fn: () => fcfs(processes) },
    { key: 'sjf-np', name: 'SJF (Non-Preemptive)', fn: () => sjfNonPreemptive(processes) },
    { key: 'sjf-p', name: 'SRTF (Preemptive)', fn: () => sjfPreemptive(processes) },
    { key: 'rr', name: `Round Robin (q=${quantum})`, fn: () => roundRobin(processes, quantum) },
    { key: 'priority-np', name: 'Priority (Non-Preemptive)', fn: () => priorityNonPreemptive(processes) },
    { key: 'priority-p', name: 'Priority (Preemptive)', fn: () => priorityPreemptive(processes) },
    { key: 'mlq', name: 'Multilevel Queue', fn: () => multilevelQueue(processes) }
  ];

  algorithms.forEach(algo => {
    // Reset process states
    processes.forEach(p => p.reset());

    const result = algo.fn();
    const procs = result.processes;

    const totalWT = procs.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTAT = procs.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const count = procs.length;

    // Calculate total time (last completion time)
    const totalTime = Math.max(...procs.map(p => p.completionTime));
    const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
    const cpuUtilization = totalTime > 0 ? ((totalBurst / totalTime) * 100).toFixed(1) : 0;

    results.push({
      name: algo.name,
      avgWT: count > 0 ? (totalWT / count).toFixed(2) : '0.00',
      avgTAT: count > 0 ? (totalTAT / count).toFixed(2) : '0.00',
      cpuUtilization,
      throughput: totalTime > 0 ? (count / totalTime).toFixed(3) : '0.000'
    });
  });

  // Find best values
  const minWT = Math.min(...results.map(r => parseFloat(r.avgWT)));
  const minTAT = Math.min(...results.map(r => parseFloat(r.avgTAT)));
  const maxUtil = Math.max(...results.map(r => parseFloat(r.cpuUtilization)));
  const maxThroughput = Math.max(...results.map(r => parseFloat(r.throughput)));

  // Render comparison table
  renderComparisonTable(results, { minWT, minTAT, maxUtil, maxThroughput });

  // Show comparison section
  if (comparisonSection) {
    comparisonSection.classList.remove('hidden');
    comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Hide single result sections
  ganttSection.classList.add('hidden');
  tableSection.classList.add('hidden');
  analyticsSection.classList.add('hidden');
  if (mlqInfoSection) mlqInfoSection.classList.add('hidden');
}

function renderComparisonTable(results, bests) {
  if (!comparisonTableBody) return;

  comparisonTableBody.innerHTML = '';

  results.forEach((result, index) => {
    const row = document.createElement('tr');
    row.className = 'border-b border-dark-600/50 hover:bg-dark-700/30 transition-colors';

    // Highlight best values
    const wtClass = parseFloat(result.avgWT) === bests.minWT ? 'text-green-400 font-bold' : 'text-gray-300';
    const tatClass = parseFloat(result.avgTAT) === bests.minTAT ? 'text-green-400 font-bold' : 'text-gray-300';
    const utilClass = parseFloat(result.cpuUtilization) === bests.maxUtil ? 'text-green-400 font-bold' : 'text-gray-300';
    const throughputClass = parseFloat(result.throughput) === bests.maxThroughput ? 'text-green-400 font-bold' : 'text-gray-300';

    row.innerHTML = `
      <td class="py-4 px-4">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full ${colors[index % colors.length]}"></span>
          <span class="font-medium">${result.name}</span>
        </div>
      </td>
      <td class="py-4 px-4 ${wtClass}">${result.avgWT}</td>
      <td class="py-4 px-4 ${tatClass}">${result.avgTAT}</td>
      <td class="py-4 px-4 ${utilClass}">${result.cpuUtilization}%</td>
      <td class="py-4 px-4 ${throughputClass}">${result.throughput}</td>
    `;

    comparisonTableBody.appendChild(row);
  });
}

function renderGanttChart(timeline, isMLQ = false) {
  ganttChart.innerHTML = '';
  ganttTimeline.innerHTML = '';

  if (timeline.length === 0) return;

  // Get process index for color mapping
  const processColorMap = {};
  processes.forEach((p, idx) => {
    processColorMap[p.id] = colors[idx % colors.length];
  });

  const scale = 50; // pixels per time unit

  timeline.forEach((block, index) => {
    const width = (block.end - block.start) * scale;
    const isIdle = block.processId === 'Idle';
    const delay = index * 0.15; // Staggered delay

    // Gantt block
    const blockEl = document.createElement('div');
    blockEl.className = `gantt-block ${isIdle ? 'gantt-idle' : processColorMap[block.processId] || 'process-color-0'}`;
    blockEl.style.width = `${width}px`;
    blockEl.style.animationDelay = `${delay}s`;

    // Show queue level for MLQ
    let queueLabel = '';
    if (isMLQ && block.queue) {
      queueLabel = `<span class="text-[10px] text-white/50">Q${block.queue}</span>`;
    }

    blockEl.innerHTML = `
      <span class="text-white font-semibold ${isIdle ? 'text-gray-400' : ''}">${block.processId}</span>
      <span class="text-xs text-white/70">${block.end - block.start}ms</span>
      ${queueLabel}
    `;

    // Add pulse glow after animation completes
    if (!isIdle) {
      setTimeout(() => {
        blockEl.classList.add('pulse-glow');
      }, (delay + 0.5) * 1000);
    }

    ganttChart.appendChild(blockEl);

    // Timeline marker with fade-in
    const markerEl = document.createElement('div');
    markerEl.className = 'timeline-marker';
    markerEl.style.width = `${width}px`;
    markerEl.style.opacity = '0';
    markerEl.style.transition = 'opacity 0.3s ease';
    markerEl.textContent = block.start;

    // Fade in timeline marker after block appears
    setTimeout(() => {
      markerEl.style.opacity = '1';
    }, (delay + 0.3) * 1000);

    ganttTimeline.appendChild(markerEl);
  });

  // Add final time marker
  const lastBlock = timeline[timeline.length - 1];
  const finalDelay = timeline.length * 0.15;
  const finalMarker = document.createElement('div');
  finalMarker.className = 'timeline-marker';
  finalMarker.style.width = 'auto';
  finalMarker.style.paddingLeft = '8px';
  finalMarker.style.paddingRight = '8px';
  finalMarker.style.opacity = '0';
  finalMarker.style.transition = 'opacity 0.3s ease';
  finalMarker.textContent = lastBlock.end;

  setTimeout(() => {
    finalMarker.style.opacity = '1';
  }, (finalDelay + 0.3) * 1000);

  ganttTimeline.appendChild(finalMarker);
}

function renderResultsTable(calculatedProcesses) {
  resultsTableBody.innerHTML = '';
  const algorithm = algorithmSelect.value;
  const config = algorithmConfig[algorithm];

  // Sort by original process ID for display
  const sorted = [...calculatedProcesses].sort((a, b) => {
    const numA = parseInt(a.id.replace('P', ''));
    const numB = parseInt(b.id.replace('P', ''));
    return numA - numB;
  });

  sorted.forEach((proc, index) => {
    const row = document.createElement('tr');
    row.className = 'border-b border-dark-600/50';

    // Conditionally show priority column
    const priorityCell = config.needsPriority ? `<td class="py-3 px-4 text-gray-300">${proc.priority}</td>` : '';

    row.innerHTML = `
      <td class="py-3 px-4">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full ${colors[index % colors.length]}"></span>
          ${proc.id}
        </div>
      </td>
      <td class="py-3 px-4 text-gray-300">${proc.arrivalTime}</td>
      <td class="py-3 px-4 text-gray-300">${proc.burstTime}</td>
      ${priorityCell}
      <td class="py-3 px-4 text-gray-300">${proc.completionTime}</td>
      <td class="py-3 px-4 font-medium text-accent-secondary">${proc.turnaroundTime}</td>
      <td class="py-3 px-4 font-medium text-accent-primary">${proc.waitingTime}</td>
    `;
    resultsTableBody.appendChild(row);
  });

  // Update table header to show/hide priority column
  updateTableHeader();
}

function updateTableHeader() {
  const algorithm = algorithmSelect.value;
  const config = algorithmConfig[algorithm];
  const priorityHeader = document.getElementById('priority-header');

  if (priorityHeader) {
    if (config.needsPriority) {
      priorityHeader.classList.remove('hidden');
    } else {
      priorityHeader.classList.add('hidden');
    }
  }
}

function renderAnalytics(calculatedProcesses) {
  const totalWT = calculatedProcesses.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalTAT = calculatedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const count = calculatedProcesses.length;

  const avgWT = count > 0 ? (totalWT / count).toFixed(2) : '0.00';
  const avgTAT = count > 0 ? (totalTAT / count).toFixed(2) : '0.00';

  avgWtEl.textContent = avgWT;
  avgTatEl.textContent = avgTAT;
}

function reset() {
  processes = [];
  processCounter = 1;

  renderProcessQueue();
  updateProcessId();

  // Hide result sections
  ganttSection.classList.add('hidden');
  tableSection.classList.add('hidden');
  analyticsSection.classList.add('hidden');
  if (comparisonSection) comparisonSection.classList.add('hidden');
  if (mlqInfoSection) mlqInfoSection.classList.add('hidden');

  // Clear charts
  ganttChart.innerHTML = '';
  ganttTimeline.innerHTML = '';
  resultsTableBody.innerHTML = '';
  avgWtEl.textContent = '0.00';
  avgTatEl.textContent = '0.00';

  // Reset form
  arrivalTimeInput.value = '';
  burstTimeInput.value = '';
  priorityInput.value = '';
  algorithmSelect.value = 'fcfs';
  timeQuantumInput.value = '2';

  updateFieldVisibility();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
