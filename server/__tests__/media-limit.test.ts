import { describe, expect, it } from "vitest";
import { MAX_MEDIA_BYTES, MAX_MEDIA_LABEL } from "@shared/media";
import { saveBase64Upload } from "../media";

describe("media upload limits", () => {
  it("rejects payloads larger than the max upload size", async () => {
    const oversized = Buffer.alloc(MAX_MEDIA_BYTES + 1, 1).toString("base64");
    const dataUrl = `data:image/png;base64,${oversized}`;

    await expect(
      saveBase64Upload({
        meetId: 999,
        filename: "too-big.png",
        contentType: "image/png",
        data: dataUrl,
      }),
    ).rejects.toThrow(`Max upload size is ${MAX_MEDIA_LABEL}.`);
  });
});
