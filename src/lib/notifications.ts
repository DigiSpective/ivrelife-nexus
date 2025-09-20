// Notification service for Resend and Twilio integrations

// Mock Resend email sending function
export const sendEmail = async (to: string, subject: string, body: string) => {
  console.log(`Sending email to ${to} with subject "${subject}"`);
  // In a real implementation, this would integrate with Resend API
  // Example:
  // const response = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${import.meta.env.VITE_RESEND_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     from: 'notifications@ivrelife.com',
  //     to,
  //     subject,
  //     html: body
  //   })
  // });
  // return response.json();
  return { success: true, id: 'mock-email-id' };
};

// Mock Twilio SMS sending function
export const sendSMS = async (to: string, body: string) => {
  console.log(`Sending SMS to ${to} with message "${body}"`);
  // In a real implementation, this would integrate with Twilio API
  // Example:
  // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${import.meta.env.VITE_TWILIO_ACCOUNT_SID}/Messages.json`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Basic ${btoa(`${import.meta.env.VITE_TWILIO_ACCOUNT_SID}:${import.meta.env.VITE_TWILIO_AUTH_TOKEN}`)}`,
  //     'Content-Type': 'application/x-www-form-urlencoded'
  //   },
  //   body: new URLSearchParams({
  //     From: import.meta.env.VITE_TWILIO_PHONE_NUMBER,
  //     To: to,
  //     Body: body
  //   })
  // });
  // return response.json();
  return { success: true, sid: 'mock-sms-id' };
};

// Send claim notification
export const sendClaimNotification = async (recipient: string, claimId: string, claimReason: string, notificationType: 'email' | 'sms' = 'email') => {
  const subject = `New Claim Submitted - ${claimId}`;
  const body = `
    <h2>New Claim Submitted</h2>
    <p>A new claim has been submitted with the following details:</p>
    <ul>
      <li><strong>Claim ID:</strong> ${claimId}</li>
      <li><strong>Reason:</strong> ${claimReason}</li>
    </ul>
    <p>Please review this claim in the IV RELIFE dashboard.</p>
  `;
  
  const smsBody = `New Claim Submitted (${claimId}): ${claimReason}. Please review in the IV RELIFE dashboard.`;
  
  if (notificationType === 'email') {
    return await sendEmail(recipient, subject, body);
  } else {
    return await sendSMS(recipient, smsBody);
  }
};

// Send claim status update notification
export const sendClaimStatusUpdate = async (recipient: string, claimId: string, status: string, resolutionNotes?: string, notificationType: 'email' | 'sms' = 'email') => {
  const subject = `Claim Status Updated - ${claimId}`;
  const body = `
    <h2>Claim Status Updated</h2>
    <p>The status of claim ${claimId} has been updated:</p>
    <ul>
      <li><strong>Status:</strong> ${status}</li>
      ${resolutionNotes ? `<li><strong>Resolution Notes:</strong> ${resolutionNotes}</li>` : ''}
    </ul>
    <p>View this claim in the IV RELIFE dashboard for more details.</p>
  `;
  
  const smsBody = `Claim ${claimId} status updated to ${status}. ${resolutionNotes ? `Notes: ${resolutionNotes}` : ''} View in IV RELIFE dashboard.`;
  
  if (notificationType === 'email') {
    return await sendEmail(recipient, subject, body);
  } else {
    return await sendSMS(recipient, smsBody);
  }
};