export const getImageFileDimensions = async (file, editor) => {

  return new Promise((resolve, reject) => {
    let img = new window.Image();

    img.onload = () => {
      const maxSize = editor.getMaxContentSize();
      const { width, height } = adjustDimensions(img.width, img.height, maxSize.width, maxSize.height);
      resolve({ width, height });
    };
    img.onerror = reject;
    img.src = window.URL.createObjectURL(file);
  });
};

export const resizeBase64Image = (base64Str, newWidth, newHeight) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      const resizedBase64 = canvas.toDataURL();
      resolve(resizedBase64);
    };
    img.onerror = (error) => reject(error);

    // Load the original base64 image
    img.src = base64Str;
  });
};

const adjustDimensions = (width, height, maxWidth, maxHeight) => {
  if (!maxWidth || !maxHeight) return { width, height };

  let adjustedWidth = width;
  let adjustedHeight = height;
  const aspectRatio = width / height;

  if (height > maxHeight) {
      adjustedHeight = maxHeight;
      adjustedWidth = Math.round(maxHeight * aspectRatio);
  }

  if (adjustedWidth > maxWidth) {
      adjustedWidth = maxWidth;
      adjustedHeight = Math.round(maxWidth / aspectRatio);
  }

  return { width: adjustedWidth, height: adjustedHeight };
};