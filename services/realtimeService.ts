/**
 * Real-time Notification Service
 * Uses Supabase Realtime to push notifications to users
 */

import { useEffect } from 'react';
import { supabase } from './supabaseClient';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';
import type { RealtimeNotification } from '../types';

type NotificationCallback = (notification: RealtimeNotification) => void;

class RealtimeNotificationService {
  private channels: Map<string, any> = new Map();
  private callbacks: Set<NotificationCallback> = new Set();

  /**
   * Subscribe to notifications for a specific user
   */
  subscribeToUserNotifications(userId: string, callback: NotificationCallback): () => void {
    const channelName = `notifications:${userId}`;
    
    if (this.channels.has(channelName)) {
      // Channel already exists, just add callback
      this.callbacks.add(callback);
      return () => this.callbacks.delete(callback);
    }

    // Create new channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_ids=cs.{${userId}}`,
        },
        (payload) => {
          const notification = payload.new as RealtimeNotification;
          this.handleNotification(notification);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to realtime notifications', { userId });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Failed to subscribe to realtime notifications', { userId });
        }
      });

    this.channels.set(channelName, channel);
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Subscribe to announcements for a school
   */
  subscribeToAnnouncements(schoolId: string, callback: NotificationCallback): () => void {
    const channelName = `announcements:${schoolId}`;
    
    if (this.channels.has(channelName)) {
      this.callbacks.add(callback);
      return () => this.callbacks.delete(callback);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          const announcement = payload.new;
          const notification: RealtimeNotification = {
            id: announcement.id,
            type: 'announcement',
            title: 'Pengumuman Baru',
            message: announcement.title,
            timestamp: announcement.date,
            recipientIds: [], // All users in school
            data: announcement,
            read: false,
          };
          this.handleNotification(notification);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Subscribe to grade updates for a student
   */
  subscribeToGrades(studentId: string, callback: NotificationCallback): () => void {
    const channelName = `grades:${studentId}`;
    
    if (this.channels.has(channelName)) {
      this.callbacks.add(callback);
      return () => this.callbacks.delete(callback);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grades',
          filter: `student_id=eq.${studentId}`,
        },
        async (payload) => {
          const grade = payload.new;
          
          // Fetch subject name
          const { data: subject } = await supabase
            .from('subjects')
            .select('name')
            .eq('id', grade.subject_id)
            .single();

          const notification: RealtimeNotification = {
            id: crypto.randomUUID(),
            type: 'grade',
            title: 'Nilai Baru',
            message: `Nilai ${subject?.name || 'mata pelajaran'}: ${grade.score}`,
            timestamp: new Date().toISOString(),
            recipientIds: [studentId],
            data: grade,
            read: false,
          };
          this.handleNotification(notification);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Subscribe to attendance updates for a student
   */
  subscribeToAttendance(studentId: string, callback: NotificationCallback): () => void {
    const channelName = `attendance:${studentId}`;
    
    if (this.channels.has(channelName)) {
      this.callbacks.add(callback);
      return () => this.callbacks.delete(callback);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `student_id=eq.${studentId}`,
        },
        async (payload) => {
          const attendance = payload.new;
          
          const notification: RealtimeNotification = {
            id: crypto.randomUUID(),
            type: 'attendance',
            title: 'Absensi Tercatat',
            message: `Status: ${attendance.status}`,
            timestamp: new Date().toISOString(),
            recipientIds: [studentId],
            data: attendance,
            read: false,
          };
          this.handleNotification(notification);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(notification: RealtimeNotification): void {
    logger.info('Received realtime notification', notification);

    // Show toast notification
    const emoji = {
      announcement: '📢',
      grade: '📝',
      attendance: '✅',
      assignment: '📚',
    }[notification.type] || '🔔';

    toast.success(`${emoji} ${notification.title}: ${notification.message}`);

    // Trigger all callbacks
    this.callbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        logger.error('Notification callback error', error);
      }
    });

    // Play notification sound (optional)
    this.playNotificationSound();
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZjjgIGGS77em2aRQHPJLX8tB9NgYof8nw244+CQ9evu/kw4tBCg==');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors (e.g., user hasn't interacted with page yet)
    } catch (error) {
      // Ignore sound errors
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.callbacks.clear();
    logger.info('Unsubscribed from all realtime channels');
  }
}

// Singleton instance
export const realtimeNotificationService = new RealtimeNotificationService();

/**
 * React Hook for realtime notifications
 */
export function useRealtimeNotifications(userId: string | null, schoolId?: string | null) {
  useEffect(() => {
    if (!userId) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to user notifications
    const unsubUser = realtimeNotificationService.subscribeToUserNotifications(
      userId,
      (notification) => {
        logger.debug('User notification received', notification);
      }
    );
    unsubscribers.push(unsubUser);

    // Subscribe to school announcements
    if (schoolId) {
      const unsubAnnouncements = realtimeNotificationService.subscribeToAnnouncements(
        schoolId,
        (notification) => {
          logger.debug('Announcement received', notification);
        }
      );
      unsubscribers.push(unsubAnnouncements);
    }

    // Subscribe to grades and attendance for students
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'Siswa') {
      const unsubGrades = realtimeNotificationService.subscribeToGrades(
        userId,
        (notification) => {
          logger.debug('Grade notification received', notification);
        }
      );
      unsubscribers.push(unsubGrades);

      const unsubAttendance = realtimeNotificationService.subscribeToAttendance(
        userId,
        (notification) => {
          logger.debug('Attendance notification received', notification);
        }
      );
      unsubscribers.push(unsubAttendance);
    }

    // Cleanup on unmount
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [userId, schoolId]);
}

// For non-React usage
export default realtimeNotificationService;
