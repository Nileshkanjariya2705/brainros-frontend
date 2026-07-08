/** App-wide static messages. `Object.freeze` so they're never mutated. */
export const COMMON_MESSAGES = Object.freeze({
  NOT_AUTHORIZED: 'You do not have access to this resource',
  NOT_AUTHORIZED_ACTION: 'You do not have permission to perform this action',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  UNSAVED_CHANGES_PROMPT:
    'The changes you have made might not be saved. Do you want to save or discard?',
});
