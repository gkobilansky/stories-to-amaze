import { Post } from "@/interfaces/post";

export function getProductDetails(post: Post) {
  if (!post.product) {
    return null;
  }

  return {
    title: post.product.name,
    price: post.product.price,
    imageUrl: post.product.image,
    productUrl: post.product.url,
  };
}
