'use client'

import { EditorRoot, EditorContent, type JSONContent } from 'novel'
import { StarterKit } from '@tiptap/starter-kit'
import { useState } from 'react'

interface NovelEditorProps {
  initialContent: string
  onChange: (content: string) => void
}

export default function NovelEditor({ initialContent, onChange }: NovelEditorProps) {
  const [content, setContent] = useState<JSONContent | undefined>(() => {
    // Если контент пустой, возвращаем undefined чтобы Novel создал пустой документ
    if (!initialContent || initialContent.trim() === '') {
      return undefined
    }

    // Простой парсинг - разбиваем по строкам
    const lines = initialContent.split('\n').filter(l => l.trim())

    if (lines.length === 0) {
      return undefined
    }

    return {
      type: 'doc',
      content: lines.map(line => ({
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      }))
    }
  })

  return (
    <div className="relative w-full">
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          initialContent={content}
          extensions={[StarterKit]}
          className="border border-slate-200 rounded-lg min-h-[400px]"
          editorProps={{
            attributes: {
              class: 'prose prose-lg focus:outline-none max-w-full p-6 min-h-[400px]'
            }
          }}
          onUpdate={({ editor }) => {
            // Получаем HTML содержимое
            const html = editor.getHTML()
            onChange(html)
          }}
        />
      </EditorRoot>
    </div>
  )
}
