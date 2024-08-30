// Extensions
import { History } from './history/index.js';
import { Color } from './color/index.js';
import { FontFamily } from './font-family/index.js';
import { FontSize } from './font-size/index.js';
import { TextAlign } from './text-align/index.js';
import { TextIndent } from './text-indent/index.js';
import { LineHeight } from './line-height/index.js';
import { FormatCommands } from './format-commands/index.js';
import { DropCursor } from './dropcursor/index.js';
import { Collaboration } from './collaboration/index.js';

// Nodes extensions
import { Document } from './document/index.js';
import { Text } from './text/index.js';
import { RunItem } from './run-item/index.js';
import { BulletList } from './bullet-list/index.js';
import { OrderedList } from './ordered-list/index.js';
import { ListItem } from './list-item/index.js';
import { Paragraph } from './paragraph/index.js';
import { Heading } from './heading/index.js';
import { CommentRangeStart, CommentRangeEnd, CommentReference } from './comment/index.js';
import { TabNode } from './tab/index.js';
import { LineBreak } from './line-break/index.js';
import { Table } from './table/index.js';
import { TableHeader } from './table-header/index.js';
import { TableRow } from './table-row/index.js';
import { TableCell } from './table-cell/index.js';
import { FieldAnnotation, fieldAnnotationHelpers } from './field-annotation/index.js';
import { Image } from './image/index.js';
import { BookmarkStart } from './bookmarks/index.js';
import { Mention } from './mention/index.js';

// Marks extensions
import { TextStyle } from './text-style/text-style.js';
import { Bold } from './bold/index.js';
import { Italic } from './italic/index.js';
import { Underline } from './underline/index.js';
import { Strike } from './strike/index.js';
import { Link } from './link/index.js';

// Plugins
import { DecorationClick } from './decoration-click/index.js';
import { CommentsPlugin } from './comment/index.js';
import { Placeholder } from './placeholder/index.js';
import { PopoverPlugin } from './popover-plugin/index.js';

const getRichTextExtensions = () => [
  Bold,
  Color,
  Document,
  History,
  Italic,
  Link,,
  Paragraph,
  Strike,
  Text,
  TextStyle,
  Underline,
  DecorationClick,
  Placeholder,
  PopoverPlugin,
  Mention,
];

const getStarterExtensions = () => [
  Bold,
  BulletList,
  Color,
  CommentRangeStart,
  CommentRangeEnd,
  CommentReference,
  Document,
  FontFamily,
  FontSize,
  History,
  Heading,
  Italic,
  ListItem,
  LineHeight,
  Link,
  OrderedList,
  Paragraph,
  LineBreak,
  RunItem,
  Strike,
  TabNode,
  Text,
  TextAlign,
  TextIndent,
  TextStyle,
  Underline,
  FormatCommands,
  DecorationClick,
  CommentsPlugin,
  Table,
  TableRow,
  TableCell,
  TableHeader,
  FieldAnnotation,
  DropCursor,
  Image,
  BookmarkStart,
  Mention,
  Collaboration
];

export {
  History,
  Heading,
  Document,
  Text,
  RunItem,
  BulletList,
  OrderedList,
  ListItem,
  Paragraph,
  CommentRangeStart, 
  CommentRangeEnd, 
  CommentReference,
  TabNode,
  LineBreak,
  Bold,
  Italic,
  Underline,
  Strike,
  Color,
  FontFamily,
  FontSize,
  TextAlign,
  TextIndent,
  TextStyle,
  LineHeight,
  FormatCommands,
  DecorationClick,
  CommentsPlugin,
  Table,
  TableRow,
  TableCell,
  TableHeader,
  Placeholder,
  DropCursor,
  FieldAnnotation,
  fieldAnnotationHelpers,
  Image,
  BookmarkStart,
  PopoverPlugin,
  Mention,
  Collaboration,
  getStarterExtensions,
  getRichTextExtensions,
};
