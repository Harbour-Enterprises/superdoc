/**
 * Turn a file URL into a File object
 * 
 * @param {*} fileUrl The url
 * @param {*} name The name to assign the file object
 * @param {*} type The mime type
 * @returns {File} The file object
 */
export const getFileObject = async (fileUrl, name, type) => {
  const response = await fetch(fileUrl);
  const blob = await response.blob();
  return new File([blob], name, { type });
}
