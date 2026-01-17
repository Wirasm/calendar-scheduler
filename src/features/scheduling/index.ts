// ============================================================================
// Errors
// ============================================================================
export type { SchedulingErrorCode } from "./errors";
export {
  AppointmentInsufficientNoticeError,
  AppointmentNotFoundError,
  AppointmentOutsideAvailabilityError,
  AppointmentSlotUnavailableError,
  AppointmentTooFarAdvanceError,
  AvailabilityWindowNotFoundError,
  AvailabilityWindowOverlapError,
  EventTypeNotFoundError,
  EventTypeSlugExistsError,
  NoAvailabilityConfiguredError,
  SchedulingAccessDeniedError,
  SchedulingDatabaseError,
  SchedulingError,
} from "./errors";

// ============================================================================
// Models (Types)
// ============================================================================
export type {
  Appointment,
  AvailabilityWindow,
  EventType,
  NewAppointment,
  NewEventType,
} from "./models";
// Note: NewAvailabilityWindow is intentionally not exported - use CreateAvailabilityWindowInput instead

// ============================================================================
// Schemas (for validation)
// ============================================================================
export type {
  AppointmentResponse,
  AvailabilityWindowResponse,
  CancelAppointmentInput,
  CreateAppointmentInput,
  CreateAvailabilityWindowInput,
  CreateEventTypeInput,
  EventTypeResponse,
  GetAvailableSlotsInput,
  TimeSlot,
  UpdateAvailabilityWindowInput,
  UpdateEventTypeInput,
} from "./schemas";

export {
  AppointmentResponseSchema,
  AvailabilityWindowResponseSchema,
  CancelAppointmentSchema,
  CreateAppointmentSchema,
  CreateAvailabilityWindowSchema,
  CreateEventTypeSchema,
  EventTypeResponseSchema,
  GetAvailableSlotsSchema,
  TimeSlotSchema,
  UpdateAvailabilityWindowSchema,
  UpdateEventTypeSchema,
} from "./schemas";

// ============================================================================
// Service functions
// ============================================================================
export {
  createAppointment,
  createAvailabilityWindow,
  deleteAvailabilityWindow,
  getAvailabilityWindow,
  getAvailabilityWindowsByUser,
  getAvailableSlots,
  updateAvailabilityWindow,
  validateSlotAvailable,
} from "./service";
