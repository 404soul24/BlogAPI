/** Shared date formatting so both clients render timestamps identically. */
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' });

export const formatDate = (iso) => (iso ? dateFormat.format(new Date(iso)) : '');
export const formatDateTime = (iso) => (iso ? dateTimeFormat.format(new Date(iso)) : '');
