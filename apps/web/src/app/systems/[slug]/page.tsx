import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getProduct } from "@/data/product-catalogue";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Business systems" };
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function SystemDetailPage({ params }: Params): Promise<never> {
  const { slug } = await params;
  if (!getProduct(slug)) notFound();
  permanentRedirect(`/products/${slug}`);
}
