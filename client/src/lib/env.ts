const normalizeBool = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }
  return value.toLowerCase() === "true";
};

const configuredReadOnly = normalizeBool(import.meta.env.VITE_READ_ONLY);
export const isReadOnlyMode =
  configuredReadOnly !== undefined ? configuredReadOnly : import.meta.env.PROD;

const uploadsConfigured = normalizeBool(import.meta.env.VITE_UPLOADS_ENABLED);
export const uploadsEnabled =
  uploadsConfigured !== undefined ? uploadsConfigured : !import.meta.env.PROD;
