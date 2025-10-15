import * as sgMail from '@sendgrid/mail';
import { sendEmailNotification } from '../services/notificationService';

vi.mock('@sendgrid/mail', () => ({
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

describe('notificationService', () => {
  beforeEach(() => {
    process.env.SENDGRID_API_KEY = 'test-key';
  });

  it('sends email through sendgrid', async () => {
    // @ts-ignore
    const res = await sendEmailNotification({ to: 'user@example.com', subject: 'Test', text: 'Hello' });
    expect(sgMail.send).toHaveBeenCalled();
  });
});
