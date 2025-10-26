import React, { useState } from 'react';
import './StoryConverter.css';

/**
 * Module 3: The "Backstory-to-Story" Converter
 *
 * This component provides a space to paste a raw "backstory" or problem
 * statement. It then provides a structured template to help convert
 * that idea into a standard Scrum user story.
 */
function StoryConverter() {
  // State for the raw backstory text
  const [backstory, setBackstory] = useState('');
  
  // State for the individual parts of the user story
  const [asA, setAsA] = useState('Server Administrator');
  const [iWant, setIWant] = useState('');
  const [soThat, setSoThat] = useState('');

  // State to control visibility of the output template
  const [showTemplate, setShowTemplate] = useState(false);

  /**
   * Handles the "Convert" button click.
   * For now, it just reveals the template.
   * We can add parsing logic later if needed.
   */
  const handleConvertClick = () => {
    setShowTemplate(true);
  };

  /**
   * Resets all fields back to their default state.
   */
  const handleClear = () => {
    setBackstory('');
    setAsA('Server Administrator');
    setIWant('');
    setSoThat('');
    setShowTemplate(false);
  };

  return (
    <div className="story-converter-module">
      <h2>Module 3: Backstory-to-Story Converter</h2>
      <p>Paste your raw idea, problem, or "backstory" below. Then click "Convert" to structure it as a user story.</p>
      
      <div className="converter-section">
        <label htmlFor="backstory-input">1. Your Backstory / Problem</label>
        <textarea
          id="backstory-input"
          className="backstory-textarea"
          rows="6"
          placeholder="e.g., 'The weekly server health check is manual. I have to log into 15 servers, open Event Viewer, and check disk space. It takes 2 hours and I can easily miss something.'"
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
        />
      </div>

      <div className="converter-controls">
        <button 
          onClick={handleConvertClick} 
          disabled={!backstory}
          className="convert-button"
        >
          Convert
        </button>
        <button 
          onClick={handleClear} 
          className="clear-button"
        >
          Clear All
        </button>
      </div>

      {/* The User Story template only appears after clicking "Convert" */}
      {showTemplate && (
        <div className="converter-section story-output-section">
          <h3>2. Your User Story</h3>
          
          <div className="story-field">
            <label htmlFor="story-as-a">As a:</label>
            <input
              id="story-as-a"
              type="text"
              value={asA}
              onChange={(e) => setAsA(e.target.value)}
            />
          </div>
          
          <div className="story-field">
            <label htmlFor="story-i-want">I want:</label>
            <input
              id="story-i-want"
              type="text"
              placeholder="e.g., 'An automated script that checks health on all servers'"
              value={iWant}
              onChange={(e) => setIWant(e.target.value)}
            />
          </div>
          
          <div className="story-field">
            <label htmlFor="story-so-that">So that:</label>
            <input
              id="story-so-that"
              type="text"
              placeholder="e.g., 'I can complete the check in 5 minutes and catch errors early'"
              value={soThat}
              onChange={(e) => setSoThat(e.g.target.value)}
            />
          </div>

          <div className="story-preview">
            <strong>Preview:</strong>
            <p>
              <strong>As a</strong> {asA}, <strong>I want</strong> {iWant}, <strong>so that</strong> {soThat}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StoryConverter;
