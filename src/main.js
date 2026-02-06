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
  priorityPreemptive
} from './scheduler.js';

// State
let processes = [];
let processCounter = 1;

// Color palette for processes
const colors = [
  'process-color-0', 'process-color-1', 'process-color-2', 'process-color-3',
  'process-color-4', 'process-color-5', 'process-color-6', 'process-color-7'
];

// DOM Elements
const processForm = document.getElementById('process-form');
const processIdInput = document.getElementById('process-id');
const arrivalTimeInput = document.getElementById('arrival-time');
const burstTimeInput = document.getElementById('burst-time');
const priorityInput = document.getElementById('priority');
const algorithmSelect = document.getElementById('algorithm');
const quantumContainer = document.getElementById('quantum-container');
const timeQuantumInput = document.getElementById('time-quantum');
const calculateBtn = document.getElementById('calculate-btn');
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

// Initialize
function init() {
  updateProcessId();
  setupEventListeners();
}

function setupEventListeners() {
  // Process form submission
  processForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addProcess();
  });

  // Algorithm selection change
  algorithmSelect.addEventListener('change', () => {
    const isRoundRobin = algorithmSelect.value === 'rr';
    quantumContainer.classList.toggle('hidden', !isRoundRobin);
  });

  // Calculate button
  calculateBtn.addEventListener('click', calculate);

  // Reset button
  resetBtn.addEventListener('click', reset);
}

function updateProcessId() {
  processIdInput.value = `P${processCounter}`;
}

function addProcess() {
  const arrivalTime = parseInt(arrivalTimeInput.value) || 0;
  const burstTime = parseInt(burstTimeInput.value);
  const priority = parseInt(priorityInput.value) || 1;

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
    chip.innerHTML = `
      <span class="w-3 h-3 rounded-full ${colors[index % colors.length]}"></span>
      <span>${proc.id}</span>
      <span class="text-gray-400 text-xs">AT: ${proc.arrivalTime} | BT: ${proc.burstTime} | P: ${proc.priority}</span>
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
    default:
      result = fcfs(processes);
  }

  renderGanttChart(result.timeline);
  renderResultsTable(result.processes);
  renderAnalytics(result.processes);

  // Show sections
  ganttSection.classList.remove('hidden');
  tableSection.classList.remove('hidden');
  analyticsSection.classList.remove('hidden');

  // Smooth scroll to Gantt chart
  ganttSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderGanttChart(timeline) {
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
    blockEl.innerHTML = `
      <span class="text-white font-semibold ${isIdle ? 'text-gray-400' : ''}">${block.processId}</span>
      <span class="text-xs text-white/70">${block.end - block.start}ms</span>
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

  // Sort by original process ID for display
  const sorted = [...calculatedProcesses].sort((a, b) => {
    const numA = parseInt(a.id.replace('P', ''));
    const numB = parseInt(b.id.replace('P', ''));
    return numA - numB;
  });

  sorted.forEach((proc, index) => {
    const row = document.createElement('tr');
    row.className = 'border-b border-dark-600/50';
    row.innerHTML = `
      <td class="py-3 px-4">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full ${colors[index % colors.length]}"></span>
          ${proc.id}
        </div>
      </td>
      <td class="py-3 px-4 text-gray-300">${proc.arrivalTime}</td>
      <td class="py-3 px-4 text-gray-300">${proc.burstTime}</td>
      <td class="py-3 px-4 text-gray-300">${proc.priority}</td>
      <td class="py-3 px-4 text-gray-300">${proc.completionTime}</td>
      <td class="py-3 px-4 font-medium text-accent-secondary">${proc.turnaroundTime}</td>
      <td class="py-3 px-4 font-medium text-accent-primary">${proc.waitingTime}</td>
    `;
    resultsTableBody.appendChild(row);
  });
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
  quantumContainer.classList.add('hidden');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
