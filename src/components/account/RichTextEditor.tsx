"use client";

import {
  BtnBold,
  BtnBulletList,
  BtnClearFormatting,
  BtnItalic,
  BtnLink,
  BtnNumberedList,
  Editor,
  EditorProvider,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";

/*
 * Small rich-text field for merchant descriptions — bold, italic, lists, links.
 * Emits HTML; the server action sanitizes it before storing. Loaded via a
 * client-only dynamic import (see MerchantEditForm) since it uses contentEditable.
 */
export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  return (
    <div className="text-sm [&_.rsw-ce]:min-h-32 [&_.rsw-ce]:px-3 [&_.rsw-ce]:py-2 [&_.rsw-ce]:text-foreground [&_.rsw-ce_a]:text-grove [&_.rsw-ce_a]:underline [&_.rsw-ce_ol]:list-decimal [&_.rsw-ce_ol]:pl-5 [&_.rsw-ce_ul]:list-disc [&_.rsw-ce_ul]:pl-5 [&_.rsw-editor]:rounded-lg [&_.rsw-editor]:border [&_.rsw-editor]:border-border [&_.rsw-editor]:bg-background [&_.rsw-toolbar]:border-border [&_.rsw-toolbar]:bg-surface">
      <EditorProvider>
        <Editor value={value} onChange={(e) => onChange(e.target.value)}>
          <Toolbar>
            <BtnBold />
            <BtnItalic />
            <Separator />
            <BtnBulletList />
            <BtnNumberedList />
            <Separator />
            <BtnLink />
            <BtnClearFormatting />
          </Toolbar>
        </Editor>
      </EditorProvider>
    </div>
  );
}
