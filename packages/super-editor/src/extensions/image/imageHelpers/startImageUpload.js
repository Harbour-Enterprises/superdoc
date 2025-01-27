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
    ({ width, height } = await getImageFileDimensions(file, editor));
  } catch (err) {
    return;
  }

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

      const onImageLoad = () => {
        const newTr = editor.view.state.tr;
        newTr.setMeta('forceUpdatePagination', true);
        editor.view.dispatch(newTr);
      };

      // Wait for transaction and then attach a load event listener to the image
      // Since we need to know when it is finished loading in order to update the layout
      setTimeout(() => {
        const domImage = view.domAtPos(placeholderPos).node.querySelector("img");
        domImage?.addEventListener("load", onImageLoad);
      }, 0);

    },
    () => {
      let removeMeta = { type: 'remove', id };

      // On failure, just clean up the placeholder
      view.dispatch(tr.setMeta(ImagePlaceholderPluginKey, removeMeta));
    },
  );
};
