interface Section {
  heading: string;
  paragraphs: string[];
}

export function ContentSections({ sections }: { sections: Section[] }) {
  return (
    <div className="max-w-3xl space-y-8">
      {sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
