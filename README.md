# CPU Scheduling Visualizer

An interactive, premium web application to visualize and compare seven different CPU scheduling algorithms. This project provides a deep dive into Operating System concepts such as process management, preemption, and performance analytics.

Live Demo: [CPU Scheduler Visualizer](https://mr-seven-7.github.io/cpu-scheduling-visualizer/)

## 🚀 Features

- **7 Algorithms Implemented**: 
  - First Come First Serve (FCFS)
  - Shortest Job First (SJF)
  - Shortest Remaining Time First (SRTF)
  - Round Robin (RR)
  - Priority (Non-Preemptive)
  - Priority (Preemptive)
  - **Multilevel Queue (MLQ)** - *Our advanced implementation*
- **Multilevel Queue Architecture**: Features three priority-based queues (System, Interactive, Batch) with strict priority and cross-queue preemption.
- **Real-time Visualization**: Dynamic Gantt charts with staggered animations and color-coded process states.
- **Side-by-Side Comparison**: Automatic benchmarking of all algorithms across four key metrics:
  - Average Waiting Time (AWT)
  - Average Turnaround Time (ATAT)
  - CPU Utilization (%)
  - Throughput (processes/sec)
- **Stunning UI**: Modern glassmorphism design with responsive input fields and smooth micro-interactions.

## 🛠️ Architecture & Workflow

### Modular Logic
The project is built using a clean separation of concerns:
- `src/scheduler.js`: The "Kernel" of the application. Contains the pure mathematical logic for all scheduling algorithms.
- `src/main.js`: The Controller. Manages the DOM, state synchronization, and triggers the visualization engine.
- `src/style.css`: The Design System. Implements a premium glassmorphic UI using custom CSS variables and Tailwind utilities.

## 🏁 How to Run

1. Clone the repository.
2. No build step required (Vanilla JS).
3. Open `index.html` in a modern browser, or use a local server:
   ```bash
   npx serve .
   ```

## 👥 Contributors
- **Manu Vahan**
- **Priyanshu Jangra**

---
*Developed for Operating Systems Course*
