const normalizeBool = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }
  return value.toLowerCase() === "true";
};

export const isReadOnlyMode = true;

const uploadsConfigured = normalizeBool(import.meta.env.VITE_UPLOADS_ENABLED);
export const uploadsEnabled =
  uploadsConfigured !== undefined ? uploadsConfigured : !import.meta.env.PROD;
