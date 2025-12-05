'use client'

import { EditorRoot, EditorContent, type JSONContent } from 'novel'

interface NovelEditorProps {
  initialContent: string
  onChange: (content: string) => void
}

export default function NovelEditor({ initialContent, onChange }: NovelEditorProps) {
  // Конвертируем markdown в JSON для Novel
  const getInitialContent = (): JSONContent => {
    if (!initialContent) {
      return {
        type: 'doc',
        content: []
      }
    }

    // Простой парсинг markdown - разбиваем по абзацам
    const paragraphs = initialContent.split('\n\n').filter(p => p.trim())

    return {
      type: 'doc',
      content: paragraphs.map(para => ({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: para
          }
        ]
      }))
    }
  }

  return (
    <div className="relative w-full min-h-[400px]">
      <EditorRoot>
        <EditorContent
          initialContent={getInitialContent()}
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
