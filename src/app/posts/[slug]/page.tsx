import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import { AmazonProductCard } from "@/app/_components/AmazonProductCard";
import { getProductDetails } from "@/lib/amazonProductHelper";
import { PostStats } from "@/app/_components/post-stats";
import { ShareButton } from "@/app/_components/share-button";

export default async function Post(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");
  const productDetails = post.product ? getProductDetails(post) : null;

  return (
    <main>
      <Container>
        <Header />
        <article className="mb-32">
          <PostHeader
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
            author={post.author}
          />
          <div className="my-8 ml-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 flex items-center gap-4 my-4 md:my-0">
              <PostStats slug={params.slug} />
              <ShareButton title={post.title} slug={params.slug} />
            </div>
            {productDetails && (
              <div className="flex flex-col items-end w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Today's Tool</h2>
                <AmazonProductCard {...productDetails} />
              </div>
            )}
          </div>
          <PostBody content={content} />
        </article>
      </Container>
    </main>
  );
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const title = `${post.title} | Stories to Amaze`;

  return {
    title,
    openGraph: {
      title,
      images: [post.ogImage.url],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
