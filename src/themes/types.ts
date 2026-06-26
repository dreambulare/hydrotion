import type { PaginationResult } from "@/src/lib/content/pagination";
import type { HydrotionPost, HydrotionPostSummary, HydrotionSite, HydrotionTopic } from "@/src/lib/content/types";

export type ThemeChromeProps = {
  site: HydrotionSite;
  topics: HydrotionTopic[];
  children: React.ReactNode;
};

export type ThemeHomeProps = {
  site: HydrotionSite;
  posts: HydrotionPostSummary[];
  pagination: PaginationResult<HydrotionPostSummary>;
};

export type ThemeTopicProps = {
  topic: HydrotionTopic;
};

export type ThemePostProps = {
  post: HydrotionPost;
};

export type HydrotionTheme = {
  name: string;
  Chrome: (props: ThemeChromeProps) => React.ReactElement;
  Home: (props: ThemeHomeProps) => React.ReactElement;
  Topic: (props: ThemeTopicProps) => React.ReactElement;
  Post: (props: ThemePostProps) => React.ReactElement;
};
