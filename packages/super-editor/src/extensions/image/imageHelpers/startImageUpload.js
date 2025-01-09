import { ImagePlaceholderPluginKey, findPlaceholder } from './imagePlaceholderPlugin.js';
import { handleImageUpload as handleImageUploadDefault } from './handleImageUpload.js';
import { getImageFileDimensions } from './getImageFileDimensions.js';

const MAX_WIDTH = 600;

export const startImageUpload = async ({ editor, view, file }) => {
  // Handler from config or default
  let imageUploadHandler =
    typeof editor.options.handleImageUpload === 'function'
      ? editor.options.handleImageUpload
      : handleImageUploadDefault;

  let fileSizeMb = (file.size / (1024 * 1024)).toFixed(4);

  if (fileSizeMb > 5) {
    window.alert('Image size must be less than 5MB');
    return;
  }

  let width;
  let height;

  try {
    ({ width, height } = await getImageFileDimensions(file));
  } catch (err) {
    return;
  }

  let pmElement = editor.element?.querySelector('.ProseMirror');
  let maxWidth = pmElement?.clientWidth ?? MAX_WIDTH;

  ({ width, height } = resizeImageIfNeeded(width, height, maxWidth));

  // A fresh object to act as the ID for this upload
  let id = {};

  // Replace the selection with a placeholder
  let { tr, schema } = view.state;

  if (!tr.selection.empty) {
    tr.deleteSelection();
  }

  let imageMeta = {
    type: 'add',
    pos: tr.selection.from,
    id,
  };

  tr.setMeta(ImagePlaceholderPluginKey, imageMeta);
  view.dispatch(tr);

  imageUploadHandler(file).then(
    (url) => {
      let fileName = file.name.replace(' ', '_');
      let placeholderPos = findPlaceholder(view.state, id);

      // If the content around the placeholder has been deleted,
      // drop the image
      if (placeholderPos == null) {
        return;
      }

      // Otherwise, insert it at the placeholder's position, and remove
      // the placeholder
      let removeMeta = { type: 'remove', id };

      let mediaPath = `word/media/${fileName}`;
      let imageNode = schema.nodes.image.create({
        src: mediaPath,
        size: { width, height },
      });

      editor.storage.image.media = Object.assign(editor.storage.image.media, { [mediaPath]: url });

      // If we are in collaboration, we need to share the image with other clients
      if (editor.options.ydoc) {
        editor.commands.addImageToCollaboration({ mediaPath, fileData: url });
      }

      view.dispatch(
        view.state.tr
          .replaceWith(placeholderPos, placeholderPos, imageNode) // or .insert(placeholderPos, imageNode)
          .setMeta(ImagePlaceholderPluginKey, removeMeta),
      );
    },
    () => {
      let removeMeta = { type: 'remove', id };

      // On failure, just clean up the placeholder
      view.dispatch(tr.setMeta(ImagePlaceholderPluginKey, removeMeta));
    },
  );
};

function resizeImageIfNeeded(width, height, maxWidth) {
  if (width > maxWidth) {
    let scale = maxWidth / width;
    let newWidth = maxWidth;
    let newHeight = Math.round(height * scale);
    return { width: newWidth, height: newHeight };
  }

  return { width, height };
}
