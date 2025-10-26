import React, { useState } from 'react';
import './IdeaGenerator.css';

/**
 * Module 2: The "Backstory Idea Generator"
 *
 * An "inspiration library" of prompts, organized by Server Admin
 * domains, to help brainstorm potential stories.
 */

// Data for the prompts, organized by category
const promptData = {
  "Automation (PowerShell, etc.)": [
    "What's a manual task you do every single day or week?",
    "What report do you have to build by hand for your manager?",
    "What task involves copy-pasting from a spreadsheet into a console?",
    "What process involves updating more than 3 systems to make one change?",
    "What's the 'dumb' task that everyone on the team hates doing?"
  ],
  "Core Services (AD, DNS, CAs)": [
    "What's a common Active Directory cleanup task (stale users, old computers) that gets skipped?",
    "Is our Certificate Authority maintenance (e.g., CRL publishing) automated?",
    "When was the last time we audited DHCP scopes or DNS records for old entries?",
    "What AD group policy is causing the most help desk tickets?"
  ],
  "Hardware & Virtualization (VMware, HPE)": [
    "Which physical server are you most worried about failing?",
    "When provisioning a new VM, what's the most time-consuming *manual* step?",
    "Are there 'zombie' VMs (unused but still on) we could find and reclaim?",
    "Is our host firmware/driver-level patching a manual nightmare?",
    "Are all our ESXi host configurations standardized?"
  ],
  "Security, Patching & Compliance": [
    "What's the biggest bottleneck on 'Patch Tuesday'?",
    "Which systems are the hardest to patch without causing user downtime?",
    "Is there a manual compliance check you have to perform for an audit?",
    "Where are we not enforcing 'least privilege' properly?",
    "Do we have an automated way to check for local admin accounts on servers?"
  ],
  "Monitoring & Performance": [
    "What problem do you always learn about from users *before* your monitoring tools?",
    "Which server is always running low on [disk space / RAM / CPU]?",
    "What alert do you get that you always ignore (alert fatigue)?",
    "What system is everyone complaining about being 'slow'?",
    "What critical process has *no* monitoring on it at all?"
  ]
};

function IdeaGenerator() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Get the category names from the data object
  const categories = Object.keys(promptData);

  return (
    <div className="idea-generator-module">
      <h2>Module 2: Backstory Idea Generator</h2>
      <p>Don't have a problem in mind? Use these prompts to find one.</p>
      
      <div className="category-buttons">
        {categories.map(category => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="prompt-list">
          <h3>Prompts for "{selectedCategory}"</h3>
          <ul>
            {promptData[selectedCategory].map((prompt, index) => (
              <li key={index}>{prompt}</li>
            ))}
          </ul>
          <button 
            className="clear-button" 
            onClick={() => setSelectedCategory(null)}
          >
            Hide Prompts
          </button>
        </div>
      )}
    </div>
  );
}

export default IdeaGenerator;
