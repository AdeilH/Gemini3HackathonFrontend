import React from 'react';

interface Observation {
  timestamp: string;
  observation: string;
  correction: string;
}

interface AssessmentData {
  activity: string;
  rating: string;
  analysis: Observation[];
  improvement: string;
  vibe_check: string;
}

interface AssessmentResultProps {
  data: string | AssessmentData;
}

const AssessmentResult: React.FC<AssessmentResultProps> = ({ data }) => {
  // If data is a string (like the raw text provided in the issue), we might need to parse it
  // But usually, the backend would send structured JSON.
  // I'll create a parser for the specific format provided in the issue just in case,
  // but I'll assume the backend sends JSON.

  const parseData = (input: any): AssessmentData | null => {
    let markdown = '';
    if (typeof input === 'object' && input !== null) {
      if (input.analysis && Array.isArray(input.analysis)) {
        return input as AssessmentData;
      }
      if (input.assessment && typeof input.assessment === 'string') {
        markdown = input.assessment;
      } else {
        markdown = JSON.stringify(input);
      }
    } else if (typeof input === 'string') {
      markdown = input;
    }

    if (!markdown) return null;

    try {
      const activityMatch = markdown.match(/## 🎯 Activity Detected: (.*)/);
      const ratingMatch = markdown.match(/\*\*Rating:\*\* (.*)/);
      
      // Extract improvement: look for the section and take the content until the next section or end
      const improvementMatch = markdown.match(/### 🚀 The "1%" Improvement\n([\s\S]*?)(?=\n###|$)/);
      
      // Extract vibe check
      const vibeMatch = markdown.match(/### 💡 Coach's Vibe Check\n([\s\S]*?)$/);

      // Extract table rows
      const analysis: Observation[] = [];
      const tableRegex = /\| (.*) \| (.*) \| (.*) \|/g;
      let match;
      
      // Skip the header and separator rows
      let rowCount = 0;
      while ((match = tableRegex.exec(markdown)) !== null) {
        rowCount++;
        if (rowCount <= 2) continue; // Skip header and | :--- | :--- | :--- |
        
        analysis.push({
          timestamp: match[1].trim().replace(/\[|\]/g, '').replace(/\*\*/g, ''),
          observation: match[2].trim(),
          correction: match[3].trim()
        });
      }

      return {
        activity: activityMatch ? activityMatch[1].trim() : 'Technical Assessment',
        rating: ratingMatch ? ratingMatch[1].trim() : 'N/A',
        analysis: analysis,
        improvement: improvementMatch ? improvementMatch[1].trim() : '',
        vibe_check: vibeMatch ? vibeMatch[1].trim() : ''
      };
    } catch (e) {
      console.error("Failed to parse assessment data", e);
      return null;
    }
  };

  const assessment = parseData(data);

  if (!assessment) {
    return (
      <div className="response-box">
        <h3>Raw Response:</h3>
        <pre>{typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="assessment-result">
      <div className="assessment-header">
        <div className="activity-badge">
          <h3>🎯 {assessment.activity}</h3>
          <span className="rating-tag">Rating: {assessment.rating}</span>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Observation</th>
              <th>Correction</th>
            </tr>
          </thead>
          <tbody>
            {assessment.analysis.map((item, index) => (
              <tr key={index}>
                <td className="timestamp">{item.timestamp}</td>
                <td className="observation">{item.observation}</td>
                <td className="correction" dangerouslySetInnerHTML={{ __html: item.correction.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="improvement-section">
        <h4>🚀 The "1%" Improvement</h4>
        <p>{assessment.improvement}</p>
      </div>

      <div className="vibe-check">
        <h4>💡 Coach's Vibe Check</h4>
        <p>{assessment.vibe_check}</p>
      </div>
    </div>
  );
};

export default AssessmentResult;
