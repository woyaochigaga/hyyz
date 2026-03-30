import { PostStatus, findPostBySlug, insertPost } from "@/models/post";
import { localeNames, locales } from "@/i18n/locale";

import Empty from "@/components/blocks/empty";
import FormSlot from "@/components/dashboard/slots/form";
import { Form as FormSlotType } from "@/types/slots/form";
import { Post } from "@/types/post";
import { getIsoTimestr } from "@/lib/time";
import { getUserInfo } from "@/services/user";
import { getUuid } from "@/lib/hash";

function isValidSlug(slug: string) {
  // Keep it URL-safe and single-segment. (No spaces, no slashes/backslashes)
  // Allow letters/numbers and separators like "-" "_" "," "." for flexibility.
  return /^[a-z0-9][a-z0-9._,-]*$/i.test(slug) && !slug.includes("/") && !slug.includes("\\");
}

export default async function () {
  const user = await getUserInfo();
  if (!user || !user.uuid) {
    return <Empty message="请先登录" />;
  }

  const form: FormSlotType = {
    title: "新增文章",
    crumb: {
      items: [
        {
          title: "文章管理",
          url: "/admin/posts",
        },
        {
          title: "新增文章",
          is_active: true,
        },
      ],
    },
    fields: [
      {
        name: "title",
        title: "标题",
        type: "text",
        placeholder: "请输入文章标题",
        validation: {
          required: true,
        },
      },
      {
        name: "slug",
        title: "别名",
        type: "text",
        placeholder: "例如：hangzhou-art-intro",
        validation: {
          required: true,
        },
        tip: "文章别名必须唯一，访问路径示例：/posts/hangzhou-art-intro",
      },
      {
        name: "locale",
        title: "语言",
        type: "select",
        options: locales.map((locale: string) => ({
          title: localeNames[locale],
          value: locale,
        })),
        value: "zh",
        validation: {
          required: true,
        },
      },
      {
        name: "description",
        title: "描述",
        type: "textarea",
        placeholder: "请输入文章摘要或简介",
      },
      {
        name: "cover_url",
        title: "封面图",
        type: "image",
        placeholder: "上传文章封面图",
      },
      {
        name: "video_url",
        title: "视频",
        type: "video",
        placeholder: "上传文章视频",
      },
      {
        name: "author_name",
        title: "作者名",
        type: "text",
        placeholder: "请输入作者名",
      },
      {
        name: "author_avatar_url",
        title: "作者头像",
        type: "image",
        placeholder: "上传作者头像",
      },
      {
        name: "content",
        title: "正文内容",
        type: "textarea",
        placeholder: "请输入文章正文",
        attributes: {
          rows: 10,
        },
      },
    ],
    submit: {
      button: {
        title: "提交",
      },
      handler: async (data: FormData, passby: any) => {
        "use server";

        const title = data.get("title") as string;
        const slug = data.get("slug") as string;
        const locale = data.get("locale") as string;
        const description = data.get("description") as string;
        const cover_url = data.get("cover_url") as string;
        const video_url = data.get("video_url") as string;
        const author_name = data.get("author_name") as string;
        const author_avatar_url = data.get("author_avatar_url") as string;
        const content = data.get("content") as string;

        if (
          !title ||
          !title.trim() ||
          !slug ||
          !slug.trim() ||
          !locale ||
          !locale.trim()
        ) {
          throw new Error("表单数据不完整");
        }

        if (!isValidSlug(slug)) {
          throw new Error(
            "别名格式不正确，只允许字母、数字和 . _ - ,，且不能包含 / 或 \\"
          );
        }

        const existPost = await findPostBySlug(slug, locale);
        if (existPost) {
          throw new Error("已存在相同别名的文章");
        }

        const post: Post = {
          uuid: getUuid(),
          created_at: getIsoTimestr(),
          status: PostStatus.Created,
          title,
          slug,
          locale,
          description,
          cover_url,
          video_url,
          author_name,
          author_avatar_url,
          content,
        };

        try {
          await insertPost(post);

          return {
            status: "success",
            message: "文章已新增",
            redirect_url: "/admin/posts",
          };
        } catch (err: any) {
          throw new Error(err.message);
        }
      },
    },
  };

  return <FormSlot {...form} />;
}
