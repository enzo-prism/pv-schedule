const HEIC_EXT = /\.(heic|heif)(\?.*)?$/i;

const isCloudinaryUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("res.cloudinary.com");
  } catch {
    return false;
  }
};

export const getDisplayImageUrl = (url: string) => {
  if (!HEIC_EXT.test(url)) {
    return url;
  }

  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) {
    return url;
  }

  const before = url.slice(0, index + marker.length);
  const after = url.slice(index + marker.length);
  const [firstSegment, ...rest] = after.split("/");

  if (!firstSegment) {
    return url;
  }

  if (firstSegment.includes("f_auto") || firstSegment.includes("f_jpg")) {
    return url;
  }

  if (firstSegment.startsWith("v") || firstSegment.includes(".")) {
    return `${before}f_auto,q_auto/${after}`;
  }

  const transformed = `f_auto,q_auto,${firstSegment}`;
  return `${before}${transformed}/${rest.join("/")}`;
};
