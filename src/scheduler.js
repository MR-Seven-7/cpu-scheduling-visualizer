/**
 * CPU Scheduling Algorithms
 * Implements FCFS, SJF (Preemptive/Non-Preemptive), Round Robin, and Priority scheduling
 */

/**
 * Process class to hold process information
 */
export class Process {
  constructor(id, arrivalTime, burstTime, priority = 1) {
    this.id = id;
    this.arrivalTime = arrivalTime;
    this.burstTime = burstTime;
    this.priority = priority;
    this.remainingTime = burstTime;
    this.completionTime = 0;
    this.turnaroundTime = 0;
    this.waitingTime = 0;
    this.responseTime = -1;
  }

  reset() {
    this.remainingTime = this.burstTime;
    this.completionTime = 0;
    this.turnaroundTime = 0;
    this.waitingTime = 0;
    this.responseTime = -1;
  }
}

/**
 * First Come First Serve (FCFS) Scheduling
 * @param {Process[]} processes - Array of processes
 * @returns {Object} - timeline and calculated processes
 */
export function fcfs(processes) {
  const procs = processes.map(p => {
    const copy = new Process(p.id, p.arrivalTime, p.burstTime, p.priority);
    return copy;
  });

  procs.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));

  const timeline = [];
  let currentTime = 0;

  for (const proc of procs) {
    if (currentTime < proc.arrivalTime) {
      // CPU is idle
      timeline.push({
        processId: 'Idle',
        start: currentTime,
        end: proc.arrivalTime
      });
      currentTime = proc.arrivalTime;
    }

    const start = currentTime;
    const end = start + proc.burstTime;

    timeline.push({
      processId: proc.id,
      start,
      end
    });

    proc.completionTime = end;
    proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
    proc.waitingTime = proc.turnaroundTime - proc.burstTime;
    proc.responseTime = start - proc.arrivalTime;

    currentTime = end;
  }

  return { timeline, processes: procs };
}

/**
 * Shortest Job First (Non-Preemptive) Scheduling
 * @param {Process[]} processes - Array of processes
 * @returns {Object} - timeline and calculated processes
 */
export function sjfNonPreemptive(processes) {
  const procs = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority));
  const timeline = [];
  let currentTime = 0;
  const completed = [];
  const remaining = [...procs];

  while (remaining.length > 0) {
    // Get available processes
    const available = remaining.filter(p => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      // CPU is idle, jump to next arrival
      const nextArrival = Math.min(...remaining.map(p => p.arrivalTime));
      timeline.push({
        processId: 'Idle',
        start: currentTime,
        end: nextArrival
      });
      currentTime = nextArrival;
      continue;
    }

    // Select process with shortest burst time
    available.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);
    const proc = available[0];

    const start = currentTime;
    const end = start + proc.burstTime;

    timeline.push({
      processId: proc.id,
      start,
      end
    });

    proc.completionTime = end;
    proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
    proc.waitingTime = proc.turnaroundTime - proc.burstTime;
    proc.responseTime = start - proc.arrivalTime;

    currentTime = end;
    completed.push(proc);
    remaining.splice(remaining.indexOf(proc), 1);
  }

  return { timeline, processes: completed };
}

/**
 * Shortest Job First (Preemptive - SRTF) Scheduling
 * @param {Process[]} processes - Array of processes
 * @returns {Object} - timeline and calculated processes
 */
export function sjfPreemptive(processes) {
  const procs = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority));
  const timeline = [];
  let currentTime = 0;
  const completed = [];

  const maxTime = Math.max(...procs.map(p => p.arrivalTime)) + procs.reduce((sum, p) => sum + p.burstTime, 0);
  let lastProcessId = null;
  let blockStart = 0;

  while (completed.length < procs.length && currentTime <= maxTime) {
    // Get available processes with remaining time
    const available = procs.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);

    if (available.length === 0) {
      // CPU is idle
      const remaining = procs.filter(p => p.remainingTime > 0);
      if (remaining.length === 0) break;

      const nextArrival = Math.min(...remaining.map(p => p.arrivalTime));

      if (lastProcessId !== 'Idle') {
        if (lastProcessId !== null) {
          timeline.push({ processId: lastProcessId, start: blockStart, end: currentTime });
        }
        blockStart = currentTime;
        lastProcessId = 'Idle';
      }
      currentTime = nextArrival;
      continue;
    }

    // Select process with shortest remaining time
    available.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime);
    const proc = available[0];

    if (proc.responseTime === -1) {
      proc.responseTime = currentTime - proc.arrivalTime;
    }

    // Check if process changed
    if (lastProcessId !== proc.id) {
      if (lastProcessId !== null) {
        timeline.push({ processId: lastProcessId, start: blockStart, end: currentTime });
      }
      blockStart = currentTime;
      lastProcessId = proc.id;
    }

    proc.remainingTime--;
    currentTime++;

    if (proc.remainingTime === 0) {
      proc.completionTime = currentTime;
      proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
      proc.waitingTime = proc.turnaroundTime - proc.burstTime;
      completed.push(proc);
    }
  }

  // Push last block
  if (lastProcessId !== null) {
    timeline.push({ processId: lastProcessId, start: blockStart, end: currentTime });
  }

  return { timeline, processes: procs };
}

/**
 * Round Robin Scheduling
 * @param {Process[]} processes - Array of processes
 * @param {number} quantum - Time quantum
 * @returns {Object} - timeline and calculated processes
 */
export function roundRobin(processes, quantum) {
  const procs = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority));
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime);

  const timeline = [];
  const queue = [];
  let currentTime = 0;
  let completed = 0;
  let index = 0;

  // Add first arriving processes
  while (index < procs.length && procs[index].arrivalTime <= currentTime) {
    queue.push(procs[index]);
    index++;
  }

  while (completed < procs.length) {
    if (queue.length === 0) {
      // CPU is idle
      if (index < procs.length) {
        timeline.push({
          processId: 'Idle',
          start: currentTime,
          end: procs[index].arrivalTime
        });
        currentTime = procs[index].arrivalTime;
        while (index < procs.length && procs[index].arrivalTime <= currentTime) {
          queue.push(procs[index]);
          index++;
        }
      } else {
        break;
      }
    }

    const proc = queue.shift();

    if (proc.responseTime === -1) {
      proc.responseTime = currentTime - proc.arrivalTime;
    }

    const execTime = Math.min(quantum, proc.remainingTime);
    const start = currentTime;
    const end = start + execTime;

    timeline.push({
      processId: proc.id,
      start,
      end
    });

    proc.remainingTime -= execTime;
    currentTime = end;

    // Add newly arrived processes to queue
    while (index < procs.length && procs[index].arrivalTime <= currentTime) {
      queue.push(procs[index]);
      index++;
    }

    if (proc.remainingTime > 0) {
      queue.push(proc);
    } else {
      proc.completionTime = currentTime;
      proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
      proc.waitingTime = proc.turnaroundTime - proc.burstTime;
      completed++;
    }
  }

  return { timeline, processes: procs };
}

/**
 * Priority Scheduling (Non-Preemptive)
 * Lower priority number = higher priority
 * @param {Process[]} processes - Array of processes
 * @returns {Object} - timeline and calculated processes
 */
export function priorityNonPreemptive(processes) {
  const procs = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority));
  const timeline = [];
  let currentTime = 0;
  const completed = [];
  const remaining = [...procs];

  while (remaining.length > 0) {
    const available = remaining.filter(p => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      const nextArrival = Math.min(...remaining.map(p => p.arrivalTime));
      timeline.push({
        processId: 'Idle',
        start: currentTime,
        end: nextArrival
      });
      currentTime = nextArrival;
      continue;
    }

    // Select process with highest priority (lowest number)
    available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
    const proc = available[0];

    const start = currentTime;
    const end = start + proc.burstTime;

    timeline.push({
      processId: proc.id,
      start,
      end
    });

    proc.completionTime = end;
    proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
    proc.waitingTime = proc.turnaroundTime - proc.burstTime;
    proc.responseTime = start - proc.arrivalTime;

    currentTime = end;
    completed.push(proc);
    remaining.splice(remaining.indexOf(proc), 1);
  }

  return { timeline, processes: completed };
}

/**
 * Priority Scheduling (Preemptive)
 * Lower priority number = higher priority
 * @param {Process[]} processes - Array of processes
 * @returns {Object} - timeline and calculated processes
 */
export function priorityPreemptive(processes) {
  const procs = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority));
  const timeline = [];
  let currentTime = 0;
  const completed = [];

  const maxTime = Math.max(...procs.map(p => p.arrivalTime)) + procs.reduce((sum, p) => sum + p.burstTime, 0);
  let lastProcessId = null;
  let blockStart = 0;

  while (completed.length < procs.length && currentTime <= maxTime) {
    const available = procs.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);

    if (available.length === 0) {
      const remaining = procs.filter(p => p.remainingTime > 0);
      if (remaining.length === 0) break;

      const nextArrival = Math.min(...remaining.map(p => p.arrivalTime));

      if (lastProcessId !== 'Idle') {
        if (lastProcessId !== null) {
          timeline.push({ processId: lastProcessId, start: blockStart, end: currentTime });
        }
        blockStart = currentTime;
        lastProcessId = 'Idle';
      }
      currentTime = nextArrival;
      continue;
    }

    // Select process with highest priority (lowest number)
    available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
    const proc = available[0];

    if (proc.responseTime === -1) {
      proc.responseTime = currentTime - proc.arrivalTime;
    }

    if (lastProcessId !== proc.id) {
      if (lastProcessId !== null) {
        timeline.push({ processId: lastProcessId, start: blockStart, end: currentTime });
      }
      blockStart = currentTime;
      lastProcessId = proc.id;
    }

    proc.remainingTime--;
    currentTime++;

    if (proc.remainingTime === 0) {
      proc.completionTime = currentTime;
      proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
      proc.waitingTime = proc.turnaroundTime - proc.burstTime;
      completed.push(proc);
    }
  }

  if (lastProcessId !== null) {
    timeline.push({ processId: lastProcessId, start: blockStart, end: currentTime });
  }

  return { timeline, processes: procs };
}

/**
 * Multilevel Queue (MLQ) Scheduling
 * Divides processes into multiple queues based on priority:
 * - Queue 1 (Priority 1-2): System processes - Round Robin (quantum=2)
 * - Queue 2 (Priority 3-4): Interactive processes - Round Robin (quantum=4)
 * - Queue 3 (Priority 5+): Batch processes - FCFS
 * Higher priority queues are serviced first (strict priority between queues)
 * @param {Process[]} processes - Array of processes
 * @returns {Object} - timeline, calculated processes, and queue info
 */
export function multilevelQueue(processes) {
  const procs = processes.map(p => new Process(p.id, p.arrivalTime, p.burstTime, p.priority));

  // Categorize processes into queues based on priority
  const queue1 = []; // System processes (Priority 1-2) - RR quantum=2
  const queue2 = []; // Interactive processes (Priority 3-4) - RR quantum=4
  const queue3 = []; // Batch processes (Priority 5+) - FCFS

  procs.forEach(p => {
    if (p.priority <= 2) {
      queue1.push(p);
    } else if (p.priority <= 4) {
      queue2.push(p);
    } else {
      queue3.push(p);
    }
  });

  // Sort each queue by arrival time
  queue1.sort((a, b) => a.arrivalTime - b.arrivalTime);
  queue2.sort((a, b) => a.arrivalTime - b.arrivalTime);
  queue3.sort((a, b) => a.arrivalTime - b.arrivalTime);

  const timeline = [];
  let currentTime = 0;
  const completed = [];

  // Ready queues for each level (for RR execution)
  const readyQueue1 = [];
  const readyQueue2 = [];
  const readyQueue3 = [];

  let idx1 = 0, idx2 = 0, idx3 = 0;

  // Helper to add newly arrived processes to ready queues
  const addArrivals = (time) => {
    while (idx1 < queue1.length && queue1[idx1].arrivalTime <= time) {
      readyQueue1.push(queue1[idx1]);
      idx1++;
    }
    while (idx2 < queue2.length && queue2[idx2].arrivalTime <= time) {
      readyQueue2.push(queue2[idx2]);
      idx2++;
    }
    while (idx3 < queue3.length && queue3[idx3].arrivalTime <= time) {
      readyQueue3.push(queue3[idx3]);
      idx3++;
    }
  };

  const totalProcesses = procs.length;

  while (completed.length < totalProcesses) {
    addArrivals(currentTime);

    // Check if any queue has processes
    if (readyQueue1.length === 0 && readyQueue2.length === 0 && readyQueue3.length === 0) {
      // Find next arrival
      const nextArrivals = [];
      if (idx1 < queue1.length) nextArrivals.push(queue1[idx1].arrivalTime);
      if (idx2 < queue2.length) nextArrivals.push(queue2[idx2].arrivalTime);
      if (idx3 < queue3.length) nextArrivals.push(queue3[idx3].arrivalTime);

      if (nextArrivals.length === 0) break;

      const nextArrival = Math.min(...nextArrivals);
      timeline.push({ processId: 'Idle', start: currentTime, end: nextArrival });
      currentTime = nextArrival;
      continue;
    }

    let proc = null;
    let quantum = 0;
    let queueLevel = 0;

    // Priority: Queue 1 > Queue 2 > Queue 3
    if (readyQueue1.length > 0) {
      proc = readyQueue1.shift();
      quantum = 2;
      queueLevel = 1;
    } else if (readyQueue2.length > 0) {
      proc = readyQueue2.shift();
      quantum = 4;
      queueLevel = 2;
    } else if (readyQueue3.length > 0) {
      proc = readyQueue3.shift();
      quantum = proc.remainingTime; // FCFS - run to completion
      queueLevel = 3;
    }

    if (!proc) continue;

    // Track response time
    if (proc.responseTime === -1) {
      proc.responseTime = currentTime - proc.arrivalTime;
    }

    // For queues 1 and 2 (RR), check for preemption by higher queue
    const execTime = Math.min(quantum, proc.remainingTime);

    // Execute time unit by time unit to check for higher priority arrivals (for Queue 2 & 3)
    let executedTime = 0;
    const startTime = currentTime;

    if (queueLevel === 1) {
      // Queue 1 has highest priority, no preemption possible from higher queue
      executedTime = execTime;
      currentTime += execTime;
      proc.remainingTime -= execTime;
    } else {
      // For Queue 2 and 3, check each time unit for higher priority arrivals
      while (executedTime < execTime && proc.remainingTime > 0) {
        currentTime++;
        executedTime++;
        proc.remainingTime--;

        // Check for higher priority arrivals
        addArrivals(currentTime);

        if (queueLevel === 2 && readyQueue1.length > 0) {
          // Preempt by Queue 1
          break;
        } else if (queueLevel === 3 && (readyQueue1.length > 0 || readyQueue2.length > 0)) {
          // Preempt by Queue 1 or Queue 2
          break;
        }
      }
    }

    if (executedTime > 0) {
      timeline.push({
        processId: proc.id,
        start: startTime,
        end: startTime + executedTime,
        queue: queueLevel
      });
    }

    addArrivals(currentTime);

    // Check if process is complete
    if (proc.remainingTime === 0) {
      proc.completionTime = currentTime;
      proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
      proc.waitingTime = proc.turnaroundTime - proc.burstTime;
      completed.push(proc);
    } else {
      // Re-add to the same ready queue
      if (queueLevel === 1) {
        readyQueue1.push(proc);
      } else if (queueLevel === 2) {
        readyQueue2.push(proc);
      } else {
        readyQueue3.push(proc);
      }
    }
  }

  // Queue information for display
  const queueInfo = {
    queue1: { name: 'System (Priority 1-2)', algorithm: 'Round Robin (q=2)', count: queue1.length },
    queue2: { name: 'Interactive (Priority 3-4)', algorithm: 'Round Robin (q=4)', count: queue2.length },
    queue3: { name: 'Batch (Priority 5+)', algorithm: 'FCFS', count: queue3.length }
  };

  return { timeline, processes: procs, queueInfo };
}
