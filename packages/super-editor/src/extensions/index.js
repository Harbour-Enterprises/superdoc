// Extensions
import { History } from './history/index.js';

// Nodes extensions
import { Document } from './document/index.js';
import { Text } from './text/index.js';
import { RunItem } from './run-item/index.js';
import { BulletList } from './bullet-list/index.js';
import { OrderedList } from './ordered-list/index.js';
import { ListItem } from './list-item/index.js';
import { Paragraph } from './paragraph/index.js';
import { CommentRangeStart, CommentRangeEnd, CommentReference } from './comment/index.js';
import { TabNode } from './tab/index.js';
import { PageBreak } from './page-break/index.js';

// Marks extensions
import { Bold } from './bold/index.js';
import { Italic } from './italic/index.js';
import { Underline } from './underline/index.js';
import { Strike } from './strike/index.js';
import { Color } from './color/index.js';
import { FontFamily } from './font-family/index.js';
import { FontSize } from './font-size/index.js';
import { TextAlign } from './text-align/index.js';
import { TextIndent } from './text-indent/index.js';
import { LineHeight } from './line-height/index.js';
import { Link } from './link/index.js';

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
  Italic,
  ListItem,
  LineHeight,
  Link,
  OrderedList,
  Paragraph,
  PageBreak,
  RunItem,
  Strike,
  TabNode,
  Text,
  TextAlign,
  TextIndent,
  Underline,
];

export {
  History,
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
  PageBreak,
  Bold,
  Italic,
  Underline,
  Strike,
  Color,
  FontFamily,
  FontSize,
  TextAlign,
  TextIndent,
  LineHeight,
  getStarterExtensions,
};
