export interface BookingRequestForm {
  need: string;
  notes: string;
  name: string;
  age: string;
  country: string;
  passport: string;
  companion: string;
}

export const EMPTY_BOOKING_FORM: BookingRequestForm = {
  need: '',
  notes: '',
  name: '',
  age: '',
  country: '',
  passport: '',
  companion: '',
};

/** Fields the patient must fill before the request can be reviewed/submitted. */
export const REQUIRED_BOOKING_FIELDS: readonly (keyof BookingRequestForm)[] = ['need', 'name', 'age', 'country'];
