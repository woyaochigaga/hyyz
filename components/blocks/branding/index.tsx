import { Section as SectionType } from "@/types/blocks/section";
import { cn } from "@/lib/utils";

export default function Branding({
  section,
  sectionClassName,
}: {
  section: SectionType;
  sectionClassName?: string;
}) {
  if (section.disabled) {
    return null;
  }

  return (
    <section id={section.name} className={cn("py-16", sectionClassName)}>
      <div className="container flex flex-row items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-center: text-muted-foreground lg:text-left">
            {section.title}
          </h2>
        </div>
      </div>
    </section>
  );
}
