import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  date,
  numeric,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', ['admin', 'staff'])
export const sessionTypeEnum = pgEnum('session_type', ['morning', 'afternoon', 'full_day'])
export const dayEnum = pgEnum('day', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent'])
export const waitlistStatusEnum = pgEnum('waitlist_status', ['waiting', 'offered', 'accepted'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue'])

// ─── Users (staff accounts) ───────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('staff'),
  workingDays: text('working_days').notNull().default('mon,tue,wed,thu,fri'),
  dbsCertNumber: text('dbs_cert_number'),
  dbsIssueDate: date('dbs_issue_date'),
  dbsOnUpdateService: boolean('dbs_on_update_service').notNull().default(false),
  // Allergy / medical
  hasAllergies: boolean('has_allergies').notNull().default(false),
  allergies: text('allergies'),
  medicalNotes: text('medical_notes'),
  // Emergency contact
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactRelationship: text('emergency_contact_relationship'),
  emergencyContactPhone: text('emergency_contact_phone'),
  emergencyContactPhone2: text('emergency_contact_phone2'),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Terms ────────────────────────────────────────────────────────────────────

export const terms = pgTable('terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // e.g. "Autumn 2025"
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  weekCount: integer('week_count').notNull(),
  academicYear: text('academic_year').notNull(), // e.g. "2025-26"
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Sessions config ──────────────────────────────────────────────────────────

export const sessionConfig = pgTable('session_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: sessionTypeEnum('type').notNull().unique(),
  label: text('label').notNull(), // e.g. "Morning"
  startTime: text('start_time').notNull(), // "09:00"
  endTime: text('end_time').notNull(),   // "15:00"
  hours: numeric('hours', { precision: 4, scale: 2 }).notNull(),
  hourlyRate2yo: numeric('hourly_rate_2yo', { precision: 6, scale: 2 }).notNull(), // £9.00/hr for 2-year-olds
  hourlyRate34yo: numeric('hourly_rate_34yo', { precision: 6, scale: 2 }).notNull(), // £8.25/hr for 3&4-year-olds
  contribution: numeric('contribution', { precision: 6, scale: 2 }).notNull(), // consumable fee per session
})

// ─── Children ─────────────────────────────────────────────────────────────────

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  address: text('address'),
  archived: boolean('archived').notNull().default(false),
  archivedAt: timestamp('archived_at'),
  // Key worker
  keyWorkerId: uuid('key_worker_id').references(() => users.id),
  // Allergies
  hasAllergies: boolean('has_allergies').notNull().default(false),
  allergies: text('allergies'),
  // Medical
  medicalNotes: text('medical_notes'),
  // Collection password
  collectionPassword: text('collection_password'),
  // Photo consent
  photoConsent: boolean('photo_consent').notNull().default(false),
  // Consumable fee consent (voluntary £3.50/session)
  consumableConsent: boolean('consumable_consent').notNull().default(false),
  // 1-2-1 keyworker requirement (EHCP / additional needs)
  needs1to1: boolean('needs_1to1').notNull().default(false),
  // Funding / needs flags for termly register and funding claims
  dep: boolean('dep').notNull().default(false),          // deprivation supplement
  eypp: boolean('eypp').notNull().default(false),        // Early Years Pupil Premium
  sen: boolean('sen').notNull().default(false),          // SEN Inclusion Fund
  senTier: text('sen_tier'),                             // '1' | '2' | '3' when sen = true
  daf: boolean('daf').notNull().default(false),          // Disability Access Fund
  extendedHours: boolean('extended_hours').notNull().default(false), // 30h extended entitlement
  twoYearFunding: boolean('two_year_funding').notNull().default(false), // 2-year-old funded entitlement
  // Parent / billing contact
  parentName: text('parent_name'),
  parentEmail: text('parent_email'),
  parentPhone: text('parent_phone'),
  // Deposit tracking — auto-credits £50 on first invoice when true
  depositPaid: boolean('deposit_paid').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Child sessions (which days/sessions a child attends) ────────────────────

export const childSessions = pgTable('child_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  day: dayEnum('day').notNull(),
  sessionType: sessionTypeEnum('session_type').notNull(),
  isFunded: boolean('is_funded').notNull().default(false),
})

// ─── Emergency contacts ───────────────────────────────────────────────────────

export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  isAuthorisedCollector: boolean('is_authorised_collector').notNull().default(false),
})

// ─── Medications ──────────────────────────────────────────────────────────────

export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  // Core fields (legacy + used by the prescribed medicine form)
  name: text('name').notNull(),        // medication name as on container
  dosage: text('dosage').notNull(),    // dosage and method
  frequency: text('frequency').notNull(), // timing
  adminConsent: boolean('admin_consent').notNull().default(false),
  notes: text('notes'),
  // Prescribed medicine form fields
  formDate: date('form_date'),
  conditionDiagnosis: text('condition_diagnosis'),
  conditionSymptoms: text('condition_symptoms'),
  hospitalContactName: text('hospital_contact_name'),
  hospitalContactPhone: text('hospital_contact_phone'),
  doctorContactName: text('doctor_contact_name'),
  doctorContactPhone: text('doctor_contact_phone'),
  administeredAtHome: text('administered_at_home'),
  durationOfTreatment: text('duration_of_treatment'),
  dateDispensed: date('date_dispensed'),
  storage: text('storage'),
  expiryDate: date('expiry_date'),
  specialPrecautions: text('special_precautions'),
  possibleSideEffects: text('possible_side_effects'),
  emergencyProcedures: text('emergency_procedures'),
  parentSignature: text('parent_signature'),
  parentPrintName: text('parent_print_name'),
  staffSignature: text('staff_signature'),
  staffPrintName: text('staff_print_name'),
  signedDate: date('signed_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Child notes ──────────────────────────────────────────────────────────────

export const childNotes = pgTable('child_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  authorId: uuid('author_id').notNull().references(() => users.id),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Accident forms ───────────────────────────────────────────────────────────

export const accidentForms = pgTable('accident_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  reportedById: uuid('reported_by_id').notNull().references(() => users.id),
  incidentDate: timestamp('incident_date').notNull(),
  // within_provision | out_of_setting
  incidentType: text('incident_type').notNull().default('within_provision'),
  incidentLocation: text('incident_location'),
  description: text('description').notNull(),
  injury: text('injury').notNull(),
  actionTaken: text('action_taken').notNull(),
  // Head injury
  isHeadInjury: boolean('is_head_injury').notNull().default(false),
  headInjuryAdviceGiven: boolean('head_injury_advice_given').notNull().default(false),
  headInjuryMonitoringFollowed: boolean('head_injury_monitoring_followed').notNull().default(false),
  // First aid
  firstAidPersonId: uuid('first_aid_person_id').references(() => users.id),
  firstAidAdministered: text('first_aid_administered'),
  // Reporter
  reporterJobRole: text('reporter_job_role'),
  reporterSignature: text('reporter_signature'),
  // First aider
  firstAiderSignature: text('first_aider_signature'),
  // Body injury location — JSON string: {x: number, y: number} in SVG viewBox coords
  bodyLocation: text('body_location'),
  // Parent / carer
  parentNotified: boolean('parent_notified').notNull().default(false),
  parentNotifiedAt: timestamp('parent_notified_at'),
  parentCarerName: text('parent_carer_name'),
  parentSignature: text('parent_signature'),
  parentSignedAt: timestamp('parent_signed_at'),
  // DSL / previous concerns — JSON array: ('injury'|'health'|'developmental'|'safeguarding'|'other')[]
  previousConcerns: text('previous_concerns'),
  previousConcernsOther: text('previous_concerns_other'),
  dslInformedAt: timestamp('dsl_informed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerEntries = pgTable('register_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  date: date('date').notNull(),
  sessionType: sessionTypeEnum('session_type').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  absenceReason: text('absence_reason'),
  parentContacted: boolean('parent_contacted'),
  parentContactedAt: timestamp('parent_contacted_at'),
  signedInAt: timestamp('signed_in_at'),
  signedOutAt: timestamp('signed_out_at'),
  droppedBy: text('dropped_by'),
  pickedUpBy: text('picked_up_by'),
  rule48h: boolean('rule_48h').notNull().default(false),
  markedById: uuid('marked_by_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Waiting list ─────────────────────────────────────────────────────────────

export const waitingList = pgTable('waiting_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  childFirstName: text('child_first_name').notNull(),
  childLastName: text('child_last_name').notNull(),
  dateOfBirth: date('date_of_birth'),
  parentName: text('parent_name').notNull(),
  parentPhone: text('parent_phone').notNull(),
  parentEmail: text('parent_email'),
  daysNeeded: text('days_needed'), // free text for now
  sessionsNeeded: text('sessions_needed'),
  notes: text('notes'),
  status: waitlistStatusEnum('status').notNull().default('waiting'),
  addedAt: timestamp('added_at').notNull().defaultNow(),
  promotedAt: timestamp('promoted_at'),
  promotedChildId: uuid('promoted_child_id').references(() => children.id),
})

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  termId: uuid('term_id').notNull().references(() => terms.id),
  paidSessions: integer('paid_sessions').notNull().default(0),
  fundedSessions: integer('funded_sessions').notNull().default(0),
  fundedHoursPerWeek: numeric('funded_hours_per_week', { precision: 6, scale: 2 }).notNull().default('0'),
  paidHoursPerWeek: numeric('paid_hours_per_week', { precision: 6, scale: 2 }).notNull().default('0'),
  fundedHoursTotal: numeric('funded_hours_total', { precision: 8, scale: 2 }).notNull().default('0'),
  sessionCost: numeric('session_cost', { precision: 8, scale: 2 }).notNull(),
  consumableConsent: boolean('consumable_consent').notNull().default(false),
  contributionTotal: numeric('contribution_total', { precision: 8, scale: 2 }).notNull(),
  fundedValue: numeric('funded_value', { precision: 8, scale: 2 }).notNull().default('0'),
  adjustmentAmount: numeric('adjustment_amount', { precision: 8, scale: 2 }).notNull().default('0'),
  adjustmentNote: text('adjustment_note'),
  bankHolidayCount: integer('bank_holiday_count').notNull().default(0),
  amountDue: numeric('amount_due', { precision: 8, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  parentEmail: text('parent_email'),
  sentAt: timestamp('sent_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Staff training ───────────────────────────────────────────────────────────

export const staffTraining = pgTable('staff_training', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  trainingName: text('training_name').notNull(), // e.g. "First Aid", "Safeguarding"
  completedDate: date('completed_date').notNull(),
  expiryDate: date('expiry_date'),
  notes: text('notes'),
})

// ─── Staff sickness ───────────────────────────────────────────────────────────

export const staffSickness = pgTable('staff_sickness', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  reason: text('reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Staff hours ──────────────────────────────────────────────────────────────

export const staffHours = pgTable('staff_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  timeIn: text('time_in'),   // HH:MM local
  timeOut: text('time_out'), // HH:MM local
  hoursWorked: numeric('hours_worked', { precision: 4, scale: 2 }).notNull(),
  type: text('type').notNull().default('work'), // 'work' | 'holiday' | 'sick'
  notes: text('notes'),
})

// ─── Medicine administration log ─────────────────────────────────────────────
// Each time a medicine is given to a child, log it here (Ofsted requirement)

export const medicineAdministrations = pgTable('medicine_administrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  medicationName: text('medication_name').notNull(),
  dose: text('dose').notNull(),
  givenAt: timestamp('given_at').notNull(),
  givenById: uuid('given_by_id').references(() => users.id),
  givenByName: text('given_by_name'),
  witnessedById: uuid('witnessed_by_id').references(() => users.id),
  witnessedByName: text('witnessed_by_name'),
  parentInformed: boolean('parent_informed').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Register notes ───────────────────────────────────────────────────────────
// Day-specific notes per child session (e.g. "Nan collecting today", "Leaving early at 2pm")
// Separate from attendance entries so a note can be added before the child is marked

export const registerNotes = pgTable('register_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  date: date('date').notNull(),
  sessionType: sessionTypeEnum('session_type').notNull(),
  note: text('note').notNull(),
  addedById: uuid('added_by_id').references(() => users.id),
  completed: boolean('completed').notNull().default(false),
  completedByName: text('completed_by_name'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Late fee invoices ────────────────────────────────────────────────────────
// Created automatically when a child is signed out after 15:00

export const lateFeeInvoices = pgTable('late_fee_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  date: date('date').notNull(),
  signedOutAt: timestamp('signed_out_at').notNull(),
  minutesLate: integer('minutes_late').notNull(),
  ratePerMinute: numeric('rate_per_minute', { precision: 6, scale: 2 }).notNull().default('1.00'),
  totalAmount: numeric('total_amount', { precision: 8, scale: 2 }).notNull(),
  status: text('status').notNull().default('unpaid'), // 'unpaid' | 'paid'
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Staff daily attendance ───────────────────────────────────────────────────

export const staffDailyAttendance = pgTable('staff_daily_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  userId: uuid('user_id').references(() => users.id),
  staffName: text('staff_name').notNull(),
  signedInAt: timestamp('signed_in_at'),
  signedOutAt: timestamp('signed_out_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Building visitors ────────────────────────────────────────────────────────

export const buildingVisitors = pgTable('building_visitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  name: text('name').notNull(),
  organisation: text('organisation'),
  signedInAt: timestamp('signed_in_at'),
  signedOutAt: timestamp('signed_out_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Child holidays ───────────────────────────────────────────────────────────

export const childHolidays = pgTable('child_holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  notes: text('notes'),
  daysUsed: integer('days_used').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Staff monthly timesheet summary ─────────────────────────────────────────

export const staffMonthlyTimesheets = pgTable('staff_monthly_timesheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1–12
  additionalHours: numeric('additional_hours', { precision: 6, scale: 2 }),
  additionalHoursNotes: text('additional_hours_notes'),
  totalKeyChildren: integer('total_key_children'),
  totalExtraHours: numeric('total_extra_hours', { precision: 6, scale: 2 }),
  totalPay: numeric('total_pay', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Child siblings (junction) ────────────────────────────────────────────────

export const childSiblings = pgTable('child_siblings', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  siblingId: uuid('sibling_id').notNull().references(() => children.id),
})

// ─── School teddy log ─────────────────────────────────────────────────────────

export const schoolTeddyLog = pgTable('school_teddy_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  takenDate: date('taken_date').notNull(),
  returnedDate: date('returned_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Parent messages log ──────────────────────────────────────────────────────

export const parentMessages = pgTable('parent_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  recipientCount: integer('recipient_count').notNull().default(0),
  sentByName: text('sent_by_name').notNull(),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  status: text('status').notNull().default('sent'), // 'sent' | 'failed'
  filterType: text('filter_type').notNull().default('all'), // 'all' | 'morning' | 'afternoon' | 'full_day'
})

// ─── Invoice reminders log ────────────────────────────────────────────────────

export const invoiceReminders = pgTable('invoice_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  email: text('email').notNull(),
  type: text('type').notNull().default('reminder'), // 'initial' | 'reminder'
})

// ─── Enrolments (September intake planning) ───────────────────────────────────

export const enrolments = pgTable('enrolments', {
  id: uuid('id').primaryKey().defaultRandom(),
  intakeYear: integer('intake_year').notNull().default(2027),
  childFirstName: text('child_first_name').notNull(),
  childLastName: text('child_last_name').notNull(),
  dateOfBirth: date('date_of_birth'),
  parentCarerName: text('parent_carer_name').notNull(),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  // JSON: {"monday": "morning", "wednesday": "full_day", ...}
  daysSessions: text('days_sessions'),
  notes: text('notes'),
  welcomeFeePaid: boolean('welcome_fee_paid').notNull().default(false),
  depositPaid: boolean('deposit_paid').notNull().default(false),
  confirmedKeyworkerId: uuid('confirmed_keyworker_id').references(() => users.id),
  promotedChildId: uuid('promoted_child_id').references(() => children.id),
  addedAt: timestamp('added_at').notNull().defaultNow(),
})
