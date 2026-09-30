/** Shared date formatting, identical to the reader app. */
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const formatDate = (iso) => (iso ? dateFormat.format(new Date(iso)) : '');
export const formatDateTime = (iso) => (iso ? dateTimeFormat.format(new Date(iso)) : '');
