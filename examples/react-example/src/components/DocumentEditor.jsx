import { useEffect, useRef } from 'react';
import { Superdoc } from '@harbour-enterprises/superdoc';
import '@harbour-enterprises/superdoc/style.css';

const DocumentEditor = ({ 
  documentId, 
  documentType = 'docx', 
  initialData = null,
  readOnly = false,
  onEditorReady 
}) => {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = new Superdoc({
      selector: '#superdoc',
      toolbar: 'superdoc-toolbar',
      documentMode: readOnly ? 'viewing' : 'editing',
      documents: [{
        id: documentId,
        type: documentType,
        data: initialData
      }],
      onReady: () => {
        if (onEditorReady) {
          onEditorReady(editor);
        }
      },
      onEditorCreate: () => {
        console.log('Editor created');
      },
      onEditorDestroy: () => {
        console.log('Editor destroyed');
      }
    });

    editorRef.current = editor;

    // Cleanup on unmount
    return () => {
      if (editorRef.current) {
        editorRef.current = null;
      }
    };
  }, [documentId, documentType, initialData, readOnly, onEditorReady]);

  return (
    <div className="document-editor">
      <div id="superdoc-toolbar" className="toolbar" />
      <div id="superdoc" className="editor" />
      <style jsx>{`
        .document-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .toolbar {
          flex: 0 0 auto;
          border-bottom: 1px solid #eee;
        }
        .editor {
          flex: 1 1 auto;
          overflow: auto;
        }
      `}</style>
    </div>
  );
};

export default DocumentEditor;