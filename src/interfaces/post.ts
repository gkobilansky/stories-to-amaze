import { type Author } from "./author";
import { type Product } from "./product";

export type Post = {
  slug: string;
  title: string;
  product: Product;
  date: string;
  coverImage: string;
  author: Author;
  excerpt: string;
  ogImage: {
    url: string;
  };
  content: string;
  preview?: boolean;
};
