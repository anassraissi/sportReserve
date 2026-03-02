import React from 'react';

const AdminFAQAnalyticsAI: React.FC = () => (
  <div className="faq-container">
    <h1>Admin Assistance: Data Analysis & AI Recommendations FAQ</h1>
    <ol>
      <li>
        <strong>How do I access analytics and reports for reservations and revenue?</strong>
        <p>Go to the Admin Dashboard and select the Analytics or Reports section. You can view statistics on reservations, revenue, and user activity.</p>
      </li>
      <li>
        <strong>How can I view AI-generated recommendations to improve resource usage?</strong>
        <p>In the Admin Dashboard, look for the "AI Recommendations" panel. This section provides suggestions on optimizing resource allocation, scheduling, and pricing based on usage data.</p>
      </li>
      <li>
        <strong>Where can I find insights on peak hours and user activity?</strong>
        <p>Navigate to the Analytics section. The dashboard displays graphs and tables showing peak reservation times, most popular resources, and user engagement trends.</p>
      </li>
      <li>
        <strong>How does the AI analyze reviews and provide suggestions for service improvement?</strong>
        <p>The AI reviews user feedback and highlights common issues or praise. It may suggest actions such as improving customer service, adjusting resource availability, or addressing recurring complaints.</p>
      </li>
      <li>
        <strong>How do I use AI to detect potential spam or fraudulent reviews?</strong>
        <p>The Reviews Management section flags suspicious reviews (e.g., multiple reviews from the same user in a short period). Admins can review and take action on flagged content.</p>
      </li>
      <li>
        <strong>Can the AI recommend pricing adjustments or promotional offers?</strong>
        <p>Yes. The AI analyzes booking patterns and may suggest price changes or special offers to maximize occupancy and revenue. Check the "AI Pricing Suggestions" area in the dashboard.</p>
      </li>
      <li>
        <strong>How do I export analytics data for further analysis?</strong>
        <p>Use the "Export Data" button in the Analytics section to download reports in CSV or Excel format for offline analysis.</p>
      </li>
      <li>
        <strong>How do I enable or configure AI features for the dashboard?</strong>
        <p>Go to Admin Settings &gt; AI Integration. Here you can enable, disable, or configure AI-powered features and set preferences for recommendations and notifications.</p>
      </li>
    </ol>
  </div>
);

export default AdminFAQAnalyticsAI;
