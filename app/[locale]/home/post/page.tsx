import { PostCreateView } from "@/components/home/post-create-view";

export default function Page({ params }: { params: { locale: string } }) {
  return <PostCreateView locale={params.locale} />;
}
