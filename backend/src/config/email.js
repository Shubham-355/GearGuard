const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For production, use your SMTP server
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // For development, use ethereal email (fake SMTP)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

// Email templates
const emailTemplates = {
  // Welcome email for new users
  welcome: (user, company) => ({
    subject: `Welcome to GearGuard - ${company.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">The Ultimate Maintenance Tracker</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Welcome, ${user.name}! 👋</h2>
          <p style="color: #666; line-height: 1.6;">
            Your account has been created successfully at <strong>${company.name}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333;"><strong>Account Details:</strong></p>
            <ul style="color: #666; line-height: 2;">
              <li>Email: ${user.email}</li>
              <li>Role: ${user.role.replace('_', ' ')}</li>
              <li>Company: ${company.name}</li>
            </ul>
          </div>
          <p style="color: #666;">You can now log in and start managing equipment and maintenance requests.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Login to GearGuard
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} GearGuard. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  // Company registration email
  companyRegistered: (user, company) => ({
    subject: `Company Registered - ${company.name} | GearGuard`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Company Registration Successful! 🎉</h2>
          <p style="color: #666; line-height: 1.6;">
            Congratulations! <strong>${company.name}</strong> has been registered on GearGuard.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #333;"><strong>Company Details:</strong></p>
            <ul style="color: #666; line-height: 2; margin: 0; padding-left: 20px;">
              <li>Company Name: ${company.name}</li>
              <li>Admin: ${user.name} (${user.email})</li>
              <li>Invite Code: <code style="background: #e0e0e0; padding: 2px 8px; border-radius: 4px;">${company.inviteCode}</code></li>
            </ul>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>💡 Tip:</strong> Share the invite code with your team members so they can join your company.
            </p>
          </div>
        </div>
      </div>
    `,
  }),

  // Invite code email
  inviteCode: (company, inviteCode) => ({
    subject: `Join ${company.name} on GearGuard`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">You've Been Invited! 📧</h2>
          <p style="color: #666; line-height: 1.6;">
            You've been invited to join <strong>${company.name}</strong> on GearGuard.
          </p>
          <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #333;"><strong>Your Invite Code:</strong></p>
            <div style="background: #667eea; color: white; padding: 15px 30px; border-radius: 8px; 
                        font-size: 24px; letter-spacing: 3px; display: inline-block;">
              ${inviteCode}
            </div>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?invite=${inviteCode}" 
             style="display: block; background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; text-align: center; margin-top: 20px;">
            Sign Up Now
          </a>
        </div>
      </div>
    `,
  }),

  // Maintenance request created
  requestCreated: (request, equipment, creator, team) => ({
    subject: `New Maintenance Request: ${request.subject} | GearGuard`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">New Maintenance Request 🔧</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Subject:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;"><strong>${request.subject}</strong></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Equipment:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${equipment?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Type:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">
                  <span style="background: ${request.requestType === 'CORRECTIVE' ? '#dc3545' : '#28a745'}; 
                               color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px;">
                    ${request.requestType}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Priority:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">
                  ${'⬥'.repeat(request.priority === 'HIGH' ? 3 : request.priority === 'MEDIUM' ? 2 : 1)} ${request.priority}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Team:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${team?.name || 'Unassigned'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666;">Created By:</td>
                <td style="padding: 10px 0; color: #333;">${creator?.name || 'System'}</td>
              </tr>
            </table>
          </div>
          ${request.description ? `
            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Description:</strong></p>
              <p style="margin: 0; color: #666;">${request.description}</p>
            </div>
          ` : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/maintenance/${request.id}" 
             style="display: block; background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; text-align: center; margin-top: 20px;">
            View Request
          </a>
        </div>
      </div>
    `,
  }),

  // Request assigned to technician
  requestAssigned: (request, technician, equipment) => ({
    subject: `Maintenance Request Assigned: ${request.subject} | GearGuard`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Request Assigned to You 📋</h2>
          <p style="color: #666;">Hi ${technician.name}, a maintenance request has been assigned to you.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0;"><strong style="color: #333;">${request.subject}</strong></p>
            <p style="margin: 0; color: #666;">Equipment: ${equipment?.name || 'N/A'}</p>
            <p style="margin: 10px 0 0 0; color: #666;">
              Priority: ${'⬥'.repeat(request.priority === 'HIGH' ? 3 : request.priority === 'MEDIUM' ? 2 : 1)} ${request.priority}
            </p>
            ${request.scheduledDate ? `
              <p style="margin: 10px 0 0 0; color: #666;">
                Scheduled: ${new Date(request.scheduledDate).toLocaleDateString()}
              </p>
            ` : ''}
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/maintenance/${request.id}" 
             style="display: block; background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; text-align: center;">
            View Request
          </a>
        </div>
      </div>
    `,
  }),

  // Request stage updated
  requestStageUpdated: (request, oldStage, newStage, equipment) => ({
    subject: `Request Status Updated: ${request.subject} | GearGuard`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Request Status Updated 📊</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0;"><strong style="color: #333;">${request.subject}</strong></p>
            <p style="margin: 0; color: #666;">Equipment: ${equipment?.name || 'N/A'}</p>
            <div style="margin-top: 20px; display: flex; align-items: center; justify-content: center;">
              <span style="background: #6c757d; color: white; padding: 8px 16px; border-radius: 20px;">
                ${oldStage.replace('_', ' ')}
              </span>
              <span style="margin: 0 15px; color: #667eea; font-size: 20px;">→</span>
              <span style="background: ${newStage === 'REPAIRED' ? '#28a745' : newStage === 'SCRAP' ? '#dc3545' : '#667eea'}; 
                           color: white; padding: 8px 16px; border-radius: 20px;">
                ${newStage.replace('_', ' ')}
              </span>
            </div>
          </div>
          ${newStage === 'REPAIRED' ? `
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
              <p style="margin: 0; color: #155724;">✅ This request has been completed successfully!</p>
            </div>
          ` : ''}
          ${newStage === 'SCRAP' ? `
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
              <p style="margin: 0; color: #721c24;">⚠️ Equipment has been marked for scrap.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `,
  }),

  // Equipment scrapped notification
  equipmentScrapped: (equipment, request) => ({
    subject: `Equipment Scrapped: ${equipment.name} | GearGuard`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Equipment Scrap Notice</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #dc3545;">⚠️ Equipment Scrapped</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Equipment:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;"><strong>${equipment.name}</strong></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Serial Number:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${equipment.serialNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Location:</td>
                <td style="padding: 10px 0; color: #333; border-bottom: 1px solid #eee;">${equipment.location || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666;">Scrap Date:</td>
                <td style="padding: 10px 0; color: #333;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          <p style="color: #666; font-size: 14px;">
            This equipment has been marked as scrapped and is no longer operational. 
            Please update your inventory records accordingly.
          </p>
        </div>
      </div>
    `,
  }),

  // Overdue request reminder
  overdueReminder: (request, technician, equipment) => ({
    subject: `⚠️ OVERDUE: ${request.subject} | GearGuard`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Overdue Request Alert</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #dc3545;">⚠️ Overdue Maintenance Request</h2>
          <p style="color: #666;">Hi ${technician?.name || 'Team'}, this maintenance request is now overdue.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0 0 15px 0;"><strong style="color: #333;">${request.subject}</strong></p>
            <p style="margin: 0; color: #666;">Equipment: ${equipment?.name || 'N/A'}</p>
            <p style="margin: 10px 0 0 0; color: #dc3545;">
              <strong>Scheduled Date: ${new Date(request.scheduledDate).toLocaleDateString()}</strong>
            </p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/maintenance/${request.id}" 
             style="display: block; background: #dc3545; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; text-align: center;">
            Take Action Now
          </a>
        </div>
      </div>
    `,
  }),

  // Critical equipment alert
  criticalEquipmentAlert: (equipment, healthPercentage) => ({
    subject: `🚨 Critical Equipment Alert: ${equipment.name} | GearGuard`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚙️ GearGuard</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Critical Equipment Alert</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #dc3545;">🚨 Equipment Health Critical</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0;"><strong style="color: #333;">${equipment.name}</strong></p>
            <p style="margin: 0; color: #666;">Serial: ${equipment.serialNumber || 'N/A'}</p>
            <p style="margin: 0; color: #666;">Location: ${equipment.location || 'N/A'}</p>
            <div style="margin-top: 20px;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Health Status:</strong></p>
              <div style="background: #f0f0f0; border-radius: 10px; height: 20px; overflow: hidden;">
                <div style="background: ${healthPercentage < 30 ? '#dc3545' : '#ffc107'}; 
                            height: 100%; width: ${healthPercentage}%; border-radius: 10px;"></div>
              </div>
              <p style="margin: 5px 0 0 0; color: #dc3545; font-weight: bold;">${healthPercentage}% Health</p>
            </div>
          </div>
          <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
            <p style="margin: 0; color: #721c24;">
              This equipment requires immediate attention. Consider scheduling maintenance or replacement.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    // Skip email in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log(`📧 [TEST] Would send email to: ${to}`);
      return { success: true, test: true };
    }

    // Skip if SMTP not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 [SKIP] Email not sent (SMTP not configured): ${template}`);
      return { success: true, skipped: true };
    }

    const emailContent = emailTemplates[template](...data);
    
    const mailOptions = {
      from: `"GearGuard" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Email error:', error.message);
    // Don't throw - email failures shouldn't break the main flow
    return { success: false, error: error.message };
  }
};

// Batch send emails
const sendBatchEmails = async (recipients, template, getData) => {
  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const data = getData(recipient);
      return sendEmail(recipient.email, template, data);
    })
  );
  
  return results;
};

module.exports = {
  sendEmail,
  sendBatchEmails,
  emailTemplates,
};
