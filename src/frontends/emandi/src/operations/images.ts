const jpegPrefix = "data:image/jpeg;base64,";
const maxImageLength = 1.5 * 1024 * 1024 * 4 / 3 + jpegPrefix.length;

export const prepareEntryImage = async (file: File): Promise<string> => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("कृपया JPG, PNG या WebP फोटो चुनें।");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error("कृपया 20 MB से छोटी फोटो चुनें।");
  }

  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => { throw new Error("फोटो पढ़ी नहीं जा सकी। कृपया दूसरी फोटो चुनें।") });

    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("फोटो तैयार नहीं हो सकी। कृपया फिर कोशिश करें।");

    while (true) {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

      if (!dataUrl.startsWith(jpegPrefix)) throw new Error("फोटो तैयार नहीं हो सकी। कृपया फिर कोशिश करें।");
      if (dataUrl.length < maxImageLength) return dataUrl;
      if (canvas.width === 1 && canvas.height === 1) throw new Error("फोटो तैयार नहीं हो सकी। कृपया फिर कोशिश करें।");

      canvas.width = Math.max(1, Math.floor(canvas.width * 0.8));
      canvas.height = Math.max(1, Math.floor(canvas.height * 0.8));
    }
  }
  finally {
    URL.revokeObjectURL(url);
  }
};
