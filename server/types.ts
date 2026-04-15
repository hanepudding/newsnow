import type { NewsItem, SourceID } from "@shared/types"

export interface RSSInfo {
  title: string
  description: string
  link: string
  image: string
  updatedTime: string
  items: RSSItem[]
}
export interface RSSItem {
  title: string
  description: string
  link: string
  created?: string
}

export interface CacheInfo {
  id: SourceID
  items: NewsItem[]
  updated: number
}

export interface CacheRow {
  id: SourceID
  data: string
  updated: number
}

export interface UserInfo {
  id: string
  email: string
  type: "github"
  data: string
  created: number
  updated: number
}

export interface SourceOption {
  // default: false
  hiddenDate?: boolean
}

export type SourceGetter = () => Promise<NewsItem[]>
