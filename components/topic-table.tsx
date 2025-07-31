"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ContentType, Topic } from "@/lib/types"
import { TrendingUp, Flame } from "lucide-react"

interface TopicTableProps {
  topics: Topic[]
  onGenerateContent: (topic: Topic, type: ContentType) => void
  isGenerating: boolean
}

export default function TopicTable({ topics, onGenerateContent, isGenerating }: TopicTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Topic</TableHead>
            <TableHead>Keywords</TableHead>
            <TableHead>Trend</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {topic.trending && <Flame className="h-4 w-4 text-red-500" />}
                  {topic.title}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {topic.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="mr-1 mb-1">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <TrendingUp
                    className={`h-4 w-4 mr-1 ${topic.trendScore > 70 ? "text-green-500" : "text-gray-500"}`}
                  />
                  <span>{topic.trendScore}%</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isGenerating}
                    onClick={() => onGenerateContent(topic, "blog")}
                  >
                    Generate Blog
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isGenerating}
                    onClick={() => onGenerateContent(topic, "linkedin")}
                  >
                    Generate LinkedIn
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isGenerating}
                    onClick={() => onGenerateContent(topic, "newsletter")}
                  >
                    Generate Newsletter
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
