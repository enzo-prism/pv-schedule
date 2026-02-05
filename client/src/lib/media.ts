const HEIC_EXT = /\.(heic|heif)(\?.*)?$/i;
const CLOUDINARY_UPLOAD = "/upload/";

const isCloudinaryUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("res.cloudinary.com");
  } catch {
    return false;
  }
};

const mergeTransforms = (existing: string, additions: string[]) => {
  const existingParts = existing.split(",").filter(Boolean);
  const existingSet = new Set(existingParts);
  const merged = [
    ...additions.filter((item) => !existingSet.has(item)),
    ...existingParts,
  ];
  return merged.join(",");
};

const injectTransforms = (url: string, transforms: string[]) => {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const index = url.indexOf(CLOUDINARY_UPLOAD);
  if (index === -1) {
    return url;
  }

  const before = url.slice(0, index + CLOUDINARY_UPLOAD.length);
  const after = url.slice(index + CLOUDINARY_UPLOAD.length);
  const [firstSegment, ...rest] = after.split("/");

  if (!firstSegment) {
    return url;
  }

  const transformSegment =
    firstSegment.startsWith("v") || firstSegment.includes(".")
      ? transforms.join(",")
      : mergeTransforms(firstSegment, transforms);

  const remaining = firstSegment.startsWith("v") || firstSegment.includes(".")
    ? after
    : rest.join("/");

  return `${before}${transformSegment}/${remaining}`;
};

export const getDisplayImageUrl = (url: string) => {
  if (!HEIC_EXT.test(url) && !isCloudinaryUrl(url)) {
    return url;
  }

  return injectTransforms(url, ["f_auto", "q_auto"]);
};

export const getOptimizedImageUrl = (
  url: string,
  { width }: { width?: number } = {},
) => {
  const transforms = ["f_auto", "q_auto"];
  if (width) {
    transforms.push(`w_${width}`);
  }
  return injectTransforms(url, transforms);
};

export const getOptimizedVideoUrl = (
  url: string,
  { width }: { width?: number } = {},
) => {
  const transforms = ["f_auto", "q_auto"];
  if (width) {
    transforms.push(`w_${width}`);
  }
  return injectTransforms(url, transforms);
};
