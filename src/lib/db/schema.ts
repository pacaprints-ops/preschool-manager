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
  endTime: text('end_time').notNull(),   // "12:00"
  hours: numeric('hours', { precision: 4, scale: 2 }).notNull(),
  price: numeric('price', { precision: 6, scale: 2 }).notNull(),
  contribution: numeric('contribution', { precision: 6, scale: 2 }).notNull(),
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
  name: text('name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  adminConsent: boolean('admin_consent').notNull().default(false),
  notes: text('notes'),
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
  description: text('description').notNull(),
  injury: text('injury').notNull(),
  actionTaken: text('action_taken').notNull(),
  parentNotified: boolean('parent_notified').notNull().default(false),
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
  fundedHoursTotal: numeric('funded_hours_total', { precision: 8, scale: 2 }).notNull().default('0'),
  sessionCost: numeric('session_cost', { precision: 8, scale: 2 }).notNull(),
  contributionTotal: numeric('contribution_total', { precision: 8, scale: 2 }).notNull(),
  fundedValue: numeric('funded_value', { precision: 8, scale: 2 }).notNull().default('0'),
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
  hoursWorked: numeric('hours_worked', { precision: 4, scale: 2 }).notNull(),
  notes: text('notes'),
})

// ─── Child siblings (junction) ────────────────────────────────────────────────

export const childSiblings = pgTable('child_siblings', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id),
  siblingId: uuid('sibling_id').notNull().references(() => children.id),
})
