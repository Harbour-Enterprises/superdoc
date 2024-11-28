
export const getImageFileDimensions = async (file) => {
  return new Promise((resolve, reject) => {
    let img = new window.Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = window.URL.createObjectURL(file);
  });
};
