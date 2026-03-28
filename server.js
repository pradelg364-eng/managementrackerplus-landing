const express = require('express');
const cors = require('cors');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function callTool(sourceId, toolName, args) {
  const params = JSON.stringify({ source_id: sourceId, tool_name: toolName, arguments: args });
  const escaped = params.replace(/'/g, "'\\''");
  const result = execSync(`external-tool call '${escaped}'`, { timeout: 30000 }).toString();
  return JSON.parse(result);
}

app.post('/api/feedback', (req, res) => {
  try {
    const { name, email, role, framework, challenge, rating } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required.' });
    }

    // Split name into first/last
    const nameParts = (name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Build message from all feedback fields
    const messageParts = [];
    if (framework) messageParts.push('Preferred Framework: ' + framework);
    if (rating) messageParts.push('Usefulness Rating: ' + rating + '/5');
    if (challenge) messageParts.push('Biggest Challenge: ' + challenge);
    const message = messageParts.join('\n\n');

    // 1) Create Airtable record via create-multiple-records (proven format)
    let airtableOk = false;
    try {
      const record = {
        'First Name': firstName,
        'Last Name': lastName,
        'Role': role,
        'Message': message
      };
      if (email) record['Email'] = email;

      callTool('airtable_oauth__pipedream', 'airtable_oauth-create-multiple-records', {
        baseId: 'appL5BBwPgdZWU8OS',
        tableId: 'tblj4KjIeroYxBy2k',
        typecast: true,
        records: [JSON.stringify(record)]
      });
      airtableOk = true;
      console.log('[OK] Airtable record created for', name);
    } catch (e) {
      console.error('[ERR] Airtable:', e.message);
    }

    // 2) Send email notification
    let emailOk = false;
    try {
      const emailBody = [
        'New feedback received from the R&D Excellence landing page.',
        '',
        'Name: ' + name,
        email ? 'Email: ' + email : null,
        'Role: ' + role,
        framework ? 'Preferred Framework: ' + framework : null,
        rating ? 'Usefulness Rating: ' + rating + '/5' : null,
        challenge ? '\nBiggest Challenge:\n' + challenge : null,
        '',
        '---',
        'This notification was sent automatically from your ManagementTrackerPlus landing page.'
      ].filter(Boolean).join('\n');

      callTool('gcal', 'send_email', {
        action: {
          action: 'send',
          to: ['pradelg364@gmail.com'],
          cc: [],
          bcc: [],
          subject: '[RD Chronicles] New Feedback from ' + name,
          body: emailBody
        }
      });
      emailOk = true;
      console.log('[OK] Email notification sent for', name);
    } catch (e) {
      console.error('[ERR] Email:', e.message);
    }

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      airtable: airtableOk,
      email: emailOk
    });

  } catch (err) {
    console.error('[ERR] General:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));
