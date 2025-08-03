import { Handler } from '@netlify/functions';
import type { Submission } from '../../shared/gameConfig';

// In-memory storage for the event (persists during function lifetime)
let submissions: Submission[] = [];
let lastUpdate = Date.now();

// Validation functions
function validateSubmission(submission: any): submission is Submission {
  return (
    submission &&
    typeof submission.id === 'string' &&
    typeof submission.teamName === 'string' &&
    typeof submission.level === 'number' &&
    typeof submission.difficulty === 'number' &&
    typeof submission.timestamp === 'number' &&
    Array.isArray(submission.completedLevels) &&
    submission.level >= 1 && submission.level <= 10 &&
    submission.difficulty >= 1 && submission.difficulty <= 5 &&
    submission.teamName.trim().length > 0
  );
}

function sanitizeTeamName(teamName: string): string {
  return teamName.trim().replace(/[<>"'&]/g, '');
}

function checkForDuplicate(teamName: string, level: number): boolean {
  return submissions.some(
    s => s.teamName.toLowerCase() === teamName.toLowerCase() && s.level === level
  );
}

export const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        // Get all submissions
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: submissions.sort((a, b) => b.level - a.level || a.timestamp - b.timestamp),
            lastUpdate,
            total: submissions.length,
          }),
        };

      case 'POST':
        // Add new submission
        if (!event.body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Request body is required' }),
          };
        }

        const newSubmission = JSON.parse(event.body);

        // Validate submission
        if (!validateSubmission(newSubmission)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Invalid submission data' }),
          };
        }

        // Additional validation
        if (newSubmission.teamName.trim().length < 2) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Team name must be at least 2 characters long' }),
          };
        }

        if (newSubmission.teamName.trim().length > 50) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Team name must be 50 characters or less' }),
          };
        }

        // Sanitize team name
        const sanitizedTeamName = sanitizeTeamName(newSubmission.teamName);
        if (sanitizedTeamName.length !== newSubmission.teamName.trim().length) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: 'Team name contains invalid characters' }),
          };
        }

        // Check for duplicates
        if (checkForDuplicate(sanitizedTeamName, newSubmission.level)) {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ 
              success: false, 
              error: `Team "${sanitizedTeamName}" has already submitted for Level ${newSubmission.level}` 
            }),
          };
        }

        // Add submission
        const submission: Submission = {
          ...newSubmission,
          teamName: sanitizedTeamName,
          timestamp: Date.now(),
        };

        submissions.push(submission);
        lastUpdate = Date.now();

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            data: submission,
            message: 'Submission added successfully',
          }),
        };

      case 'DELETE':
        // Clear all submissions (admin function)
        const { password } = event.queryStringParameters || {};
        
        if (password !== 'GDG-IET') {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ success: false, error: 'Invalid admin password' }),
          };
        }

        submissions = [];
        lastUpdate = Date.now();

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'All submissions cleared successfully',
          }),
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ success: false, error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error in submissions function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
    };
  }
};
