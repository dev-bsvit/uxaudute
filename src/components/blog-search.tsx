'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface BlogSearchProps {
  onSearch: (query: string) => void
}

export function BlogSearch({ onSearch }: BlogSearchProps) {
  const [query, setQuery] = useState('')

  const handleSearch = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
      <Input
        type="text"
        placeholder="Поиск по статьям..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-12 pr-4 py-6 text-lg rounded-xl border-2 focus:border-blue-500 transition-all"
      />
    </div>
  )
}
