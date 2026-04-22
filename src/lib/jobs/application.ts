import { z } from "zod";

export const englishLevels = ["Basic", "Intermediate", "Advanced", "Fluent"] as const;
export const norwegianLevels = ["None", "Basic", "Intermediate", "Advanced"] as const;
export const availabilityOptions = ["Immediately", "2 weeks", "1 month", "More than 1 month"] as const;
export const drivingLicenceOptions = ["No", "B", "C", "CE"] as const;
export const workAuthorizationOptions = ["EU/EEA citizen", "Valid Norwegian permit", "Needs sponsorship"] as const;
export const experienceOptions = ["0-1", "2-4", "5-7", "8+"] as const;

const fileSchema = z
  .instanceof(File, { message: "Please upload your CV." })
  .refine((file) => file.size > 0, "Uploaded file is empty.")
  .refine((file) => file.size <= 5_000_000, "CV must be up to 5MB.")
  .refine(
    (file) =>
      ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
        file.type,
      ),
    "Accepted formats: PDF, DOC, DOCX.",
  );

export const jobApplicationSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required."),
  lastName: z.string().trim().min(2, "Last name is required."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().min(6, "Enter a valid phone number."),
  currentCountry: z.string().trim().min(2, "Select your current country."),
  city: z.string().trim().min(2, "Select your city."),
  workAuthorization: z.enum(workAuthorizationOptions, { message: "Select work authorization." }),
  yearsExperience: z.enum(experienceOptions, { message: "Select years of experience." }),
  trade: z.string().trim().min(2, "Select your trade or profession."),
  englishLevel: z.enum(englishLevels, { message: "Select your English level." }),
  norwegianLevel: z.enum(norwegianLevels, { message: "Select your Norwegian level." }),
  drivingLicence: z.enum(drivingLicenceOptions, { message: "Select driving licence." }),
  availability: z.enum(availabilityOptions, { message: "Select availability." }),
  cvFile: fileSchema,
  message: z.string().trim().max(600, "Message can be up to 600 characters.").optional(),
  gdprConsent: z.literal(true, { message: "You must accept the privacy notice to continue." }),
});

export type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;
