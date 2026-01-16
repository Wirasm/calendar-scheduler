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
  SchedulingAccessDeniedError,
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
  NewAvailabilityWindow,
  NewEventType,
} from "./models";

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
  UpdateAvailabilityWindowSchema,
  UpdateEventTypeSchema,
} from "./schemas";

// ============================================================================
// Service functions
// ============================================================================
export {
  createAvailabilityWindow,
  deleteAvailabilityWindow,
  getAvailabilityWindow,
  getAvailabilityWindowsByUser,
  updateAvailabilityWindow,
} from "./service";
