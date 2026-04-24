import { z } from 'zod';

export const aspirationSubmissionSchema = z.object({
    title: z
        .string()
        .min(5, { message: 'Title must be at least 5 characters long' })
        .max(100, { message: 'Title cannot exceed 100 characters' }),

    content: z
        .string()
        .min(20, { message: 'Content must be at least 20 characters' })
        .max(2000, { message: 'Content cannot exceed 2000 characters' }),

    level: z.enum(['PRODI', 'FACULTY', 'UNIVERSITY', 'UKM'] as const),

    studentId: z.string().min(1, { message: 'Student ID is required' }),

    prodiId: z.string().optional().nullable(),
    facultyId: z.string().optional().nullable(),
    universityId: z.string().optional().nullable(),
    ukmId: z.string().optional().nullable(),
    evidenceUrl: z.string().optional().nullable(),
});

export type AspirationSubmission = z.infer<typeof aspirationSubmissionSchema>;
