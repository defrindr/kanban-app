import {
  boardInviteEmail,
  commentNotificationEmail,
  assignmentNotificationEmail,
} from '../utils/email.js';

describe('Email Templates', () => {
  it('should generate board invite email', () => {
    const result = boardInviteEmail('Alice', 'My Board', 'http://localhost:4000/boards/abc');
    expect(result.subject).toBe('Alice invited you to My Board');
    expect(result.html).toContain('Alice');
    expect(result.html).toContain('My Board');
    expect(result.html).toContain('http://localhost:4000/boards/abc');
  });

  it('should generate comment notification email', () => {
    const result = commentNotificationEmail(
      'Bob',
      'Fix Login',
      'Project X',
      'Great work!',
      'http://localhost:4000/boards/abc/cards/123'
    );
    expect(result.subject).toBe('Bob commented on Fix Login');
    expect(result.html).toContain('Bob');
    expect(result.html).toContain('Fix Login');
    expect(result.html).toContain('Project X');
    expect(result.html).toContain('Great work!');
    expect(result.html).toContain('http://localhost:4000/boards/abc/cards/123');
  });

  it('should generate assignment notification email', () => {
    const result = assignmentNotificationEmail(
      'Charlie',
      'Implement Auth',
      'My Board',
      'http://localhost:4000/boards/abc/cards/123'
    );
    expect(result.subject).toBe('You were assigned to Implement Auth');
    expect(result.html).toContain('Charlie');
    expect(result.html).toContain('Implement Auth');
    expect(result.html).toContain('My Board');
    expect(result.html).toContain('http://localhost:4000/boards/abc/cards/123');
  });
});

describe('Email Sending (jsonTransport)', () => {
  let sendMail: any;

  beforeAll(async () => {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({ jsonTransport: true });
    sendMail = transport.sendMail.bind(transport);
  });

  it('should send email via jsonTransport', async () => {
    const info = await sendMail({
      from: 'test@kanban.app',
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    });
    expect(info.messageId).toBeDefined();
    expect(info.envelope.to).toEqual(['user@example.com']);
  });
});
