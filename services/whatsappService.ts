/**
 * WhatsApp Notification Service
 * Using Twilio API for sending WhatsApp messages
 */

import { supabase } from './supabaseClient';
import type { NotificationLog, NotificationType, NotificationChannel } from '../types';

// Twilio configuration (set in .env)
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER; // e.g., whatsapp:+14155238886

interface SendNotificationParams {
  recipientPhone: string;
  recipientEmail?: string;
  recipientId?: string;
  recipientType: 'Parent' | 'Student' | 'Teacher' | 'Staff' | 'Admin';
  notificationType: NotificationType;
  message: string;
  channel: NotificationChannel;
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppViaTwilio(to: string, message: string): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> {
  try {
    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    // Format phone number for WhatsApp
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+${to.replace(/[^0-9]/g, '')}`;
    const formattedFrom = TWILIO_WHATSAPP_NUMBER;
    
    const params = new URLSearchParams({
      From: formattedFrom,
      To: formattedTo,
      Body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        messageSid: data.sid
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to send WhatsApp message'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Send Email (basic implementation using server-side function)
 */
async function sendEmail(to: string, subject: string, body: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Call your server-side email API
    // For now, just log (you can integrate with Nodemailer later)
    console.log('📧 Email would be sent:', { to, subject, body });
    
    // TODO: Implement actual email sending
    // Option 1: Use Supabase Edge Function
    // Option 2: Use external email service (SendGrid, Mailgun, etc)
    
    return {
      success: true
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Log notification to database
 */
async function logNotification(params: {
  recipientType: string;
  recipientId?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  notificationType: string;
  channel: string;
  message: string;
  status: string;
  externalId?: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    await supabase.from('notification_logs').insert({
      recipient_type: params.recipientType,
      recipient_id: params.recipientId,
      recipient_phone: params.recipientPhone,
      recipient_email: params.recipientEmail,
      notification_type: params.notificationType,
      channel: params.channel,
      message: params.message,
      status: params.status,
      external_id: params.externalId,
      error_message: params.errorMessage,
      sent_at: params.status === 'Sent' ? new Date().toISOString() : undefined
    });
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

/**
 * Main function to send notification
 */
export async function sendNotification(params: SendNotificationParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const { channel, recipientPhone, recipientEmail, message } = params;

  let result: { success: boolean; messageSid?: string; error?: string };

  // Send via appropriate channel
  if (channel === 'WhatsApp' && recipientPhone) {
    result = await sendWhatsAppViaTwilio(recipientPhone, message);
  } else if (channel === 'Email' && recipientEmail) {
    result = await sendEmail(recipientEmail, 'Notifikasi Sekolah', message);
  } else if (channel === 'InApp') {
    // In-app notification (just log to database)
    result = { success: true };
  } else {
    result = { success: false, error: 'Invalid channel or missing recipient info' };
  }

  // Log to database
  await logNotification({
    recipientType: params.recipientType,
    recipientId: params.recipientId,
    recipientPhone: params.recipientPhone,
    recipientEmail: params.recipientEmail,
    notificationType: params.notificationType,
    channel: params.channel,
    message: params.message,
    status: result.success ? 'Sent' : 'Failed',
    externalId: result.messageSid,
    errorMessage: result.error
  });

  return result;
}

/**
 * Template messages for different notification types
 */
export const notificationTemplates = {
  gateCheckIn: (studentName: string, time: string, schoolName: string) => 
    `✅ ${studentName} telah CHECK-IN di ${schoolName} pada pukul ${time}. Semoga hari ini menyenangkan! 🎒`,

  gateCheckOut: (studentName: string, time: string, schoolName: string) => 
    `🚪 ${studentName} telah CHECK-OUT dari ${schoolName} pada pukul ${time}. Hati-hati di jalan! 👋`,

  gateLate: (studentName: string, time: string, lateMinutes: number, schoolName: string) => 
    `⏰ ${studentName} terlambat ${lateMinutes} menit (masuk pukul ${time}) di ${schoolName}. Mohon perhatiannya.`,

  reportCardPublished: (studentName: string, semester: string, className: string) => 
    `📊 Rapor ${studentName} untuk ${semester} kelas ${className} sudah tersedia! Silakan login untuk melihat detail nilai.`,

  general: (message: string) => message
};

/**
 * Send notification to parents when student checks in at gate
 */
export async function notifyParentGateCheckIn(
  studentName: string,
  studentId: string,
  checkInTime: string,
  schoolName: string
): Promise<void> {
  try {
    // Get parent contacts
    const { data: contacts } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('student_id', studentId)
      .eq('notification_enabled', true);

    if (!contacts || contacts.length === 0) return;

    const message = notificationTemplates.gateCheckIn(studentName, checkInTime, schoolName);

    // Send to all enabled contacts
    for (const contact of contacts) {
      if (contact.whatsapp_number && contact.whatsapp_verified) {
        await sendNotification({
          recipientPhone: contact.whatsapp_number,
          recipientEmail: contact.email,
          recipientType: 'Parent',
          notificationType: 'GateCheckIn',
          message,
          channel: 'WhatsApp'
        });
      }
    }
  } catch (error) {
    console.error('Failed to notify parents:', error);
  }
}

/**
 * Send notification to parents when student checks out at gate
 */
export async function notifyParentGateCheckOut(
  studentName: string,
  studentId: string,
  checkOutTime: string,
  schoolName: string
): Promise<void> {
  try {
    const { data: contacts } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('student_id', studentId)
      .eq('notification_enabled', true);

    if (!contacts || contacts.length === 0) return;

    const message = notificationTemplates.gateCheckOut(studentName, checkOutTime, schoolName);

    for (const contact of contacts) {
      if (contact.whatsapp_number && contact.whatsapp_verified) {
        await sendNotification({
          recipientPhone: contact.whatsapp_number,
          recipientEmail: contact.email,
          recipientType: 'Parent',
          notificationType: 'GateCheckOut',
          message,
          channel: 'WhatsApp'
        });
      }
    }
  } catch (error) {
    console.error('Failed to notify parents:', error);
  }
}

/**
 * Send notification when student is late
 */
export async function notifyParentGateLate(
  studentName: string,
  studentId: string,
  checkInTime: string,
  lateMinutes: number,
  schoolName: string
): Promise<void> {
  try {
    const { data: contacts } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('student_id', studentId)
      .eq('notification_enabled', true);

    if (!contacts || contacts.length === 0) return;

    const message = notificationTemplates.gateLate(studentName, checkInTime, lateMinutes, schoolName);

    for (const contact of contacts) {
      if (contact.whatsapp_number && contact.whatsapp_verified) {
        await sendNotification({
          recipientPhone: contact.whatsapp_number,
          recipientEmail: contact.email,
          recipientType: 'Parent',
          notificationType: 'GateLate',
          message,
          channel: 'WhatsApp'
        });
      }
    }
  } catch (error) {
    console.error('Failed to notify parents about late arrival:', error);
  }
}

/**
 * Send notification when report card is published
 */
export async function notifyReportCardPublished(
  studentName: string,
  studentId: string,
  semester: string,
  className: string
): Promise<void> {
  try {
    const { data: contacts } = await supabase
      .from('parent_contacts')
      .select('*')
      .eq('student_id', studentId)
      .eq('notification_enabled', true);

    if (!contacts || contacts.length === 0) return;

    const message = notificationTemplates.reportCardPublished(studentName, semester, className);

    for (const contact of contacts) {
      if (contact.whatsapp_number && contact.whatsapp_verified) {
        await sendNotification({
          recipientPhone: contact.whatsapp_number,
          recipientEmail: contact.email,
          recipientType: 'Parent',
          notificationType: 'ReportCard',
          message,
          channel: 'WhatsApp'
        });
      }
    }
  } catch (error) {
    console.error('Failed to notify parents about report card:', error);
  }
}

export default {
  sendNotification,
  notifyParentGateCheckIn,
  notifyParentGateCheckOut,
  notifyParentGateLate,
  notifyReportCardPublished,
  templates: notificationTemplates
};
