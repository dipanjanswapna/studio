import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';

export function About() {
  const aboutImage = PlaceHolderImages.find(img => img.id === 'about-image');

  return (
    <section id="about" className="w-full bg-background py-12 md:py-24 lg:py-32">
      <div className="container grid items-center gap-8 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
            Candidate Profile
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            The People's Doctor: Dr. Monisha Chakraborty
          </h2>
          <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Born and raised in Barishal, Dr. Monisha Chakraborty is a dedicated public servant with a proven track record. After graduating from Barishal Medical College, she chose to serve her community, leaving a government job to provide unbiased care for all.
          </p>
          <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Known as the "doctor of the poor," she fearlessly served patients during the pandemic and has always stood for the people. With unwavering integrity, she now seeks to represent Barishal-5, offering honest, progressive leadership.
          </p>
        </div>
        <div className="flex justify-center">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {aboutImage && (
                <Image
                  src={aboutImage.imageUrl}
                  alt={aboutImage.description}
                  width={800}
                  height={600}
                  className="aspect-[4/3] w-full object-cover"
                  data-ai-hint={aboutImage.imageHint}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
