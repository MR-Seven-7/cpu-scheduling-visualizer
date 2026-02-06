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
