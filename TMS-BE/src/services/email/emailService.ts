type WelcomeInput = { to: string; firstName: string; lastName: string; temporaryPassword: string; batchName: string };

export class EmailService {
  static async sendStudentWelcome(input: WelcomeInput): Promise<void> {
    // Mock email sending; integrate SendGrid/SES here
    void input;
    return;
  }
}

