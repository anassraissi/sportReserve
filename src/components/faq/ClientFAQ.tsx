import React from 'react';

const ClientFAQ: React.FC = () => (
  <div className="faq-container">
    <h1>Client Assistance: Frequently Asked Questions</h1>
    <ol>
      <li>
        <strong>How do I make a reservation?</strong>
        <p>Log in to your account, choose your desired resource (e.g., court, field), select a date and time, and follow the prompts to complete your booking.</p>
      </li>
      <li>
        <strong>How can I modify or cancel my booking?</strong>
        <p>Go to "My Reservations" in your profile. Select the reservation you want to change or cancel and follow the instructions.</p>
      </li>
      <li>
        <strong>What payment methods are accepted?</strong>
        <p>We accept major credit/debit cards and other payment options as listed during checkout.</p>
      </li>
      <li>
        <strong>How do I receive booking confirmation?</strong>
        <p>You will receive a confirmation email after your reservation is completed. You can also view your bookings in your account.</p>
      </li>
      <li>
        <strong>How do I leave a review?</strong>
        <p>After your reservation is completed, go to "My Reservations" and select the booking to leave a review.</p>
      </li>
      <li>
        <strong>Who do I contact for support?</strong>
        <p>Use the "Contact Support" link in the app or email us at the address provided in the Contact section.</p>
      </li>
      <li>
        <strong>How do I view my past reservations?</strong>
        <p>All your past and upcoming reservations are listed in your account under "My Reservations".</p>
      </li>
      <li>
        <strong>What are the opening hours and prices?</strong>
        <p>Check the "Resources" or "Pricing" section for up-to-date schedules and rates.</p>
      </li>
      <li>
        <strong>Can I book for a group or with a coach?</strong>
        <p>Yes, select the group or coaching option during the reservation process if available for your chosen resource.</p>
      </li>
    </ol>
  </div>
);

export default ClientFAQ;
