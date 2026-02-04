export const MAX_MEDIA_MB = 25;
export const MAX_MEDIA_BYTES = MAX_MEDIA_MB * 1024 * 1024;
export const MAX_MEDIA_BODY_BYTES = Math.ceil(MAX_MEDIA_BYTES * 1.5);
export const MAX_MEDIA_LABEL = `${MAX_MEDIA_MB}MB`;
