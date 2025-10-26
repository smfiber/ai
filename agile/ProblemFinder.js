import React, { useState } from 'react';
import './ProblemFinder.css';

/**
 * Module 1: The "Daily Task" Problem Finder
 *
 * This component is a form with pre-filled dropdowns to help
 * a Server Admin quickly articulate a problem or "backstory".
 */
function ProblemFinder() {
  // State for the form inputs
  const [system, setSystem] = useState('');
  const [task, setTask] = useState('');
  const [problem, setProblem] = useState('');
  const [impact, setImpact] = useState('');
  
  // State for the generated output
  const [generatedBackstory, setGeneratedBackstory] = useState('');

  // Pre-defined options for the dropdowns
  const systemOptions = [
    "Active Directory",
    "VMware/ESXi Host",
    "HPE ProLiant Server",
    "Windows File Server",
    "Certificate Authority",
    "Backup System (e.g., Veeam)",
    "Monitoring System",
    "A specific PowerShell script"
  ];

  const taskOptions = [
    "Provisioning a new (VM, user, share)",
    "Running monthly patching",
    "Troubleshooting a performance issue",
    "Performing a backup or restore",
    "Running a compliance/audit report",
    "Hardware maintenance/firmware updates",
    "Certificate renewal"
  ];

  const problemOptions = [
    "It's 100% manual",
    "It's slow and blocks other work",
    "It's error-prone / easy to miss a step",
    "It requires logging into multiple systems",
    "The documentation is missing or wrong",
    "It fails silently without alerts",
    "It's overly complex"
  ];

  const impactOptions = [
    "wastes X hours per week/month",
    "creates a security or compliance risk",
    "could cause an outage or downtime",
    "leads to alert fatigue",
    "is frustrating for me and my team",
    "prevents us from working on project goals",
    "results in inconsistent configurations"
  ];

  /**
   * Generates the backstory text from the form inputs.
   */
  const handleGenerate = () => {
    if (system && task && problem && impact) {
      const backstory = `The task of "${task}" on our "${system}" is a problem. The main issue is that "${problem}". This ${impact}.`;
      setGeneratedBackstory(backstory);
    } else {
      setGeneratedBackstory('Please fill out all fields to generate a backstory.');
    }
  };

  /**
   * Clears all inputs and the generated output.
   */
  const handleClear = () => {
    setSystem('');
    setTask('');
    setProblem('');
    setImpact('');
    setGeneratedBackstory('');
  };

  // Helper function to render dropdown options
  const renderOptions = (options) => {
    return options.map(opt => <option key={opt} value={opt}>{opt}</option>);
  };

  return (
    <div className="problem-finder-module">
      <h2>Module 1: Daily Task Problem Finder</h2>
      <p>Use this form to quickly build a problem statement based on your daily work.</p>
      
      <div className="finder-form">
        <div className="finder-field">
          <label htmlFor="system-select">1. What system were you working on?</label>
          <select id="system-select" value={system} onChange={(e) => setSystem(e.target.value)}>
            <option value="" disabled>-- Select a system --</option>
            {renderOptions(systemOptions)}
          </select>
        </div>

        <div className="finder-field">
          <label htmlFor="task-select">2. What was the task?</label>
          <select id="task-select" value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="" disabled>-- Select a task --</option>
            {renderOptions(taskOptions)}
          </select>
        </div>

        <div className="finder-field">
          <label htmlFor="problem-select">3. What is the problem?</label>
          <select id="problem-select" value={problem} onChange={(e) => setProblem(e.target.value)}>
            <option value="" disabled>-- Select a problem --</option>
            {renderOptions(problemOptions)}
          </select>
        </div>

        <div className="finder-field">
          <label htmlFor="impact-select">4. What is the impact (the "pain")?</label>
          <select id="impact-select" value={impact} onChange={(e) => setImpact(e.target.value)}>
            <option value="" disabled>-- Select an impact --</option>
            {renderOptions(impactOptions)}
          </select>
        </div>
      </div>

      <div className="finder-controls">
        <button 
          onClick={handleGenerate} 
          className="generate-button"
          disabled={!system || !task || !problem || !impact}
        >
          Generate Backstory
        </button>
        <button onClick={handleClear} className="clear-button">
          Clear
        </button>
      </div>

      {generatedBackstory && (
        <div className="finder-output">
          <label>Generated Backstory:</label>
          <textarea
            readOnly
            rows="4"
            value={generatedBackstory}
          />
          <small>You can copy this text and paste it into Module 3 below.</small>
        </div>
      )}
    </div>
  );
}

export default ProblemFinder;
