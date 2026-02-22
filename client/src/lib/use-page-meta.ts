import { useEffect } from "react";

const DEFAULT_DESCRIPTION = "Track and field meet planning in one place.";

function setMetaDescription(description: string) {
  const metaDescription = document.querySelector('meta[name="description"]');

  if (metaDescription) {
    metaDescription.setAttribute("content", description);
    return;
  }

  const newMeta = document.createElement("meta");
  newMeta.name = "description";
  newMeta.content = description;
  document.head.appendChild(newMeta);
}

export function usePageMeta(title: string, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    const normalizedTitle = title.trim() || "Page";

    document.title = normalizedTitle;
    setMetaDescription(description.trim() || DEFAULT_DESCRIPTION);
  }, [title, description]);
}

export const DEFAULT_PAGE_DESCRIPTION = DEFAULT_DESCRIPTION;
