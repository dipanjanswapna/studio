import Image from 'next/image';

import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const updatesData = [
  {
    id: 1,
    title: 'Campaign Kick-off Rally a Huge Success',
    date: 'October 26, 2023',
    category: 'Campaign Trail',
    description: 'Thousands gathered in Barishal to support Dr. Chakraborty as she officially launched her campaign for the national election.',
    imageId: 'update-1',
  },
  {
    id: 2,
    title: 'Dr. Monisha Outlines Vision for Healthcare',
    date: 'October 24, 2023',
    category: 'Policy',
    description: 'In a meeting with local leaders, Dr. Chakraborty detailed her comprehensive plan to improve healthcare access and quality for all residents.',
    imageId: 'update-2',
  },
  {
    id: 3,
    title: 'Volunteer Drive Exceeds Expectations',
    date: 'October 22, 2023',
    category: 'Community',
    description: 'An overwhelming number of citizens have signed up to volunteer, showing the powerful grassroots support for the campaign.',
    imageId: 'update-3',
  },
];

export function Updates() {
  return (
    <section id="updates" className="w-full bg-secondary py-12 md:py-24 lg:py-32">
      <div className="container space-y-12 px-4 md:px-6">
        <div className="mx-auto max-w-4xl space-y-4 text-center">
          <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">
            Latest News
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Election Updates
          </h2>
          <p className="text-muted-foreground md:text-xl/relaxed">
            Stay informed with the latest news and updates from the campaign trail.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {updatesData.map((update, index) => {
            const image = PlaceHolderImages.find(img => img.id === update.imageId);
            return (
              <div
                key={update.id}
                className="animate-in fade-in-0 slide-in-from-bottom-10 duration-500"
                style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
              >
                <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
                  {image && (
                     <Image
                      src={image.imageUrl}
                      alt={image.description}
                      width={600}
                      height={400}
                      className="aspect-video w-full object-cover"
                      data-ai-hint={image.imageHint}
                    />
                  )}
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="outline">{update.category}</Badge>
                      <p className="text-sm text-muted-foreground">{update.date}</p>
                    </div>
                    <CardTitle className="text-xl">{update.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <CardDescription>{update.description}</CardDescription>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
