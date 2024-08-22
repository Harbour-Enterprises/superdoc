import { Collaboration } from '@extensions/collaboration/collaboration.js';
import { CollaborationCursor } from '@extensions/collaboration-cursor/collaboration-cursor.js';

export const availableProviders = ['socket', 'firestore'];
export const validateCollaboration = (options) => {

  const { collaboration, user } = options;
  if (!collaboration || !user) return options;

  const { provider, document } = collaboration;
  if (!provider || !document) return options;

  Collaboration.options.document = document;
  CollaborationCursor.options.provider = provider;
  CollaborationCursor.options.user = user;
  options.extensions.push(Collaboration);
  options.extensions.push(CollaborationCursor);
  return options;
}