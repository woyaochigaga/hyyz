const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value.trim();
  }

  return env;
}

function toIso(value) {
  return new Date(value).toISOString();
}

async function ensureDemoUser(supabase) {
  const { data: users, error } = await supabase
    .from("users")
    .select("uuid,email,nickname")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  if (users && users.length > 0) {
    return users[0];
  }

  const demoUser = {
    uuid: "demo-user-seed-001",
    email: "demo-seed@hyyz.local",
    nickname: "杭艺演示账号",
    locale: "zh",
    signin_provider: "manual",
    signin_type: "email",
    invite_code: "",
    invited_by: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: insertError } = await supabase.from("users").upsert(demoUser, {
    onConflict: "uuid",
  });

  if (insertError) {
    throw insertError;
  }

  return demoUser;
}

async function main() {
  const env = loadEnvFile(path.join(process.cwd(), ".env.local"));
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const owner = await ensureDemoUser(supabase);
  const now = new Date().toISOString();

  const homePosts = [
    {
      uuid: "demo-home-post-001",
      user_uuid: owner.uuid,
      locale: "zh",
      type: "text",
      title: "春日竹编小展预告",
      excerpt: "几位杭州手艺人带来竹编与器物作品，适合前台演示列表与详情展示。",
      content:
        "本次演示内容用于站内列表展示，包含基础标题、摘要、正文和发布时间。欢迎现场交流竹编、器物与当代手作展示方式。",
      content_format: "markdown",
      editor_mode: "hybrid",
      content_blocks: [],
      attachments: [],
      display_settings: { featured: true },
      cover_url: "",
      images: "[]",
      video_url: "",
      status: "published",
      like_count: 8,
      comment_count: 2,
      created_at: now,
      updated_at: now,
      published_at: now,
    },
    {
      uuid: "demo-home-post-002",
      user_uuid: owner.uuid,
      locale: "zh",
      type: "text",
      title: "杭城漆艺体验开放报名",
      excerpt: "作为演示数据，突出社区动态和活动信息。",
      content:
        "线下体验将围绕漆器基础工艺、材料认识和成品展示展开，可用于首页动态流的基础内容演示。",
      content_format: "markdown",
      editor_mode: "hybrid",
      content_blocks: [],
      attachments: [],
      display_settings: { featured: false },
      cover_url: "",
      images: "[]",
      video_url: "",
      status: "published",
      like_count: 5,
      comment_count: 1,
      created_at: now,
      updated_at: now,
      published_at: now,
    },
    {
      uuid: "demo-home-post-003",
      user_uuid: owner.uuid,
      locale: "zh",
      type: "text",
      title: "线下展览招募说明",
      excerpt: "方便联动你刚做好的线下展览模块。",
      content:
        "主办方现面向手工艺创作者开放展位申请，报名资料与排期以平台发布内容为准。本条为演示数据。",
      content_format: "markdown",
      editor_mode: "hybrid",
      content_blocks: [],
      attachments: [],
      display_settings: { featured: false },
      cover_url: "",
      images: "[]",
      video_url: "",
      status: "published",
      like_count: 3,
      comment_count: 0,
      created_at: now,
      updated_at: now,
      published_at: now,
    },
  ];

  const homePostTags = [
    { post_uuid: "demo-home-post-001", tag: "竹编", created_at: now },
    { post_uuid: "demo-home-post-001", tag: "线下活动", created_at: now },
    { post_uuid: "demo-home-post-002", tag: "漆艺", created_at: now },
    { post_uuid: "demo-home-post-003", tag: "展览招募", created_at: now },
  ];

  const offlineExhibitions = [
    {
      uuid: "demo-offline-exhibition-001",
      user_uuid: owner.uuid,
      locale: "zh",
      applicant_role: "user",
      status: "published",
      title: "西湖竹语手作展",
      subtitle: "竹编与器物联合展",
      summary: "面向公众开放的竹编与生活器物线下展览。",
      description:
        "演示用线下展览数据，适合在列表页和详情页展示时间、地点、主办方、联系人与地图位置。",
      curator_name: "陈简涛",
      curator_title: "策展主理人",
      organizer_name: "杭艺云展",
      co_organizers: ["西湖手作社"],
      sponsor_name: "城市文化共创计划",
      supporting_organizations: ["杭州手工艺交流中心"],
      contact_name: "小云",
      contact_phone: "13800000001",
      contact_wechat: "hyyz-demo-01",
      contact_email: "demo01@hyyz.local",
      venue_name: "西湖文化展厅",
      province: "浙江省",
      city: "杭州市",
      district: "西湖区",
      street: "曙光路",
      address_detail: "黄龙商圈展厅 A 座 2 层",
      formatted_address: "浙江省杭州市西湖区曙光路黄龙商圈展厅 A 座 2 层",
      map_note: "可直接在高德地图中搜索场馆名称导航。",
      start_at: toIso("2026-04-10T10:00:00+08:00"),
      end_at: toIso("2026-04-20T18:00:00+08:00"),
      apply_deadline: toIso("2026-04-08T18:00:00+08:00"),
      opening_hours: "10:00-18:00",
      admission_type: "free",
      admission_fee: 0,
      capacity: 200,
      booth_count: 20,
      cover_url: "",
      poster_url: "",
      gallery_images: [],
      tags: ["竹编", "器物"],
      art_categories: ["传统工艺", "生活美学"],
      highlights: ["公开展览", "支持现场交流"],
      transportation: ["地铁 3 号线换乘可达"],
      facilities: ["洗手间", "休息区"],
      application_requirements: "演示数据，详情以后台配置为准。",
      submission_materials: ["作品图片", "作者简介"],
      schedule_items: [
        {
          label: "开幕交流",
          start_at: toIso("2026-04-10T14:00:00+08:00"),
          end_at: toIso("2026-04-10T15:30:00+08:00"),
          note: "主理人与匠人见面交流",
        },
      ],
      external_links: [],
      review_note: "演示发布数据",
      created_at: now,
      updated_at: now,
      published_at: now,
      approved_at: now,
      rejected_at: null,
    },
    {
      uuid: "demo-offline-exhibition-002",
      user_uuid: owner.uuid,
      locale: "zh",
      applicant_role: "artisan",
      status: "published",
      title: "运河漆艺与首饰展",
      subtitle: "漆艺材料与饰品创作展示",
      summary: "偏工艺体验型的中小型线下展览。",
      description:
        "适合前台展示收费类型、开放时间、联络方式等基础信息，也能用于地图导航演示。",
      curator_name: "林墨",
      curator_title: "联合策展人",
      organizer_name: "杭艺云展",
      co_organizers: ["拱墅工艺空间"],
      sponsor_name: "",
      supporting_organizations: [],
      contact_name: "展务组",
      contact_phone: "13800000002",
      contact_wechat: "hyyz-demo-02",
      contact_email: "demo02@hyyz.local",
      venue_name: "运河工艺空间",
      province: "浙江省",
      city: "杭州市",
      district: "拱墅区",
      street: "丽水路",
      address_detail: "创意园 5 号楼 1 层",
      formatted_address: "浙江省杭州市拱墅区丽水路创意园 5 号楼 1 层",
      map_note: "建议从北门进入。",
      start_at: toIso("2026-04-15T09:30:00+08:00"),
      end_at: toIso("2026-04-28T17:30:00+08:00"),
      apply_deadline: toIso("2026-04-12T20:00:00+08:00"),
      opening_hours: "09:30-17:30",
      admission_type: "paid",
      admission_fee: 29.9,
      capacity: 120,
      booth_count: 12,
      cover_url: "",
      poster_url: "",
      gallery_images: [],
      tags: ["漆艺", "首饰"],
      art_categories: ["材料实验", "饰品设计"],
      highlights: ["体验工作坊", "可现场购票"],
      transportation: ["可停车", "公交直达"],
      facilities: ["寄存处"],
      application_requirements: "演示数据。",
      submission_materials: ["展陈方案"],
      schedule_items: [],
      external_links: [],
      review_note: "演示发布数据",
      created_at: now,
      updated_at: now,
      published_at: now,
      approved_at: now,
      rejected_at: null,
    },
    {
      uuid: "demo-offline-exhibition-003",
      user_uuid: owner.uuid,
      locale: "zh",
      applicant_role: "user",
      status: "published",
      title: "良渚陶艺周末展",
      subtitle: "陶艺作品与现场拉坯体验",
      summary: "适合作为第三条演示数据，方便测试列表布局与详情页跳转。",
      description:
        "涵盖陶艺展示、体验、主办方信息与联系方式，字段控制在基础必需范围内。",
      curator_name: "周宁",
      curator_title: "空间主理人",
      organizer_name: "良渚手作实验室",
      co_organizers: [],
      sponsor_name: "",
      supporting_organizations: [],
      contact_name: "阿宁",
      contact_phone: "13800000003",
      contact_wechat: "",
      contact_email: "demo03@hyyz.local",
      venue_name: "良渚创作工坊",
      province: "浙江省",
      city: "杭州市",
      district: "余杭区",
      street: "古墩路北延段",
      address_detail: "良渚艺术街区 3 号",
      formatted_address: "浙江省杭州市余杭区古墩路北延段良渚艺术街区 3 号",
      map_note: "周边停车位有限。",
      start_at: toIso("2026-04-18T11:00:00+08:00"),
      end_at: toIso("2026-05-01T19:00:00+08:00"),
      apply_deadline: toIso("2026-04-16T18:00:00+08:00"),
      opening_hours: "11:00-19:00",
      admission_type: "free",
      admission_fee: 0,
      capacity: 80,
      booth_count: 8,
      cover_url: "",
      poster_url: "",
      gallery_images: [],
      tags: ["陶艺", "周末展"],
      art_categories: ["陶艺", "体验活动"],
      highlights: ["适合亲子", "现场体验"],
      transportation: ["建议网约车前往"],
      facilities: ["休息区"],
      application_requirements: "演示数据。",
      submission_materials: ["基础资料"],
      schedule_items: [],
      external_links: [],
      review_note: "演示发布数据",
      created_at: now,
      updated_at: now,
      published_at: now,
      approved_at: now,
      rejected_at: null,
    },
  ];

  const { error: postError } = await supabase
    .from("home_posts")
    .upsert(homePosts, { onConflict: "uuid" });

  if (postError) {
    throw postError;
  }

  const { error: tagError } = await supabase
    .from("home_post_tags")
    .upsert(homePostTags, { onConflict: "post_uuid,tag" });

  if (tagError) {
    throw tagError;
  }

  const { error: exhibitionError } = await supabase
    .from("offline_exhibitions")
    .upsert(offlineExhibitions, { onConflict: "uuid" });

  if (exhibitionError) {
    throw exhibitionError;
  }

  console.log(
    JSON.stringify(
      {
        owner_uuid: owner.uuid,
        home_posts: homePosts.map((item) => ({
          uuid: item.uuid,
          title: item.title,
          status: item.status,
        })),
        offline_exhibitions: offlineExhibitions.map((item) => ({
          uuid: item.uuid,
          title: item.title,
          status: item.status,
        })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
