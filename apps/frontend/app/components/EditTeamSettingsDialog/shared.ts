import { z } from 'zod';

export const generalTeamSettingsSchema = z.object({
  name: z.string({ required_error: 'Please provide a team name' }),
});

export const teamInviteSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});
