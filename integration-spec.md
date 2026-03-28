# Integration Spec

## Airtable: "Contact Us" table
- Base ID: appL5BBwPgdZWU8OS
- Table ID: tblj4KjIeroYxBy2k
- Fields: ID (number), First Name (multilineText), Last Name (multilineText), Email (email), Company (singleLineText), Role (multilineText), Message (multilineText), Status (singleSelect)

## Email notification
- To: pradelg364@gmail.com
- Subject: "[RD Chronicles] New Feedback from {name}"
- Body: plain text summary of feedback

## Form fields mapping
- name → split into First Name + Last Name (or use full name as First Name)
- role → Role
- framework → Part of Message
- challenge → Message
- rating → Part of Message
