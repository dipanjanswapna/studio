'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel, { EmblaCarouselType } from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type DotButtonPropType = {
  selected: boolean;
  onClick: () => void;
};

const DotButton: React.FC<DotButtonPropType> = (props) => {
  const { selected, onClick } = props;

  return (
    <button
      className={cn('embla__dot', selected && 'embla__dot--selected')}
      type="button"
      onClick={onClick}
    />
  );
};

function HeroCarouselSkeleton() {
    return (
        <section className="container grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Skeleton className="lg:col-span-3 h-[200px] lg:h-[400px] rounded-xl" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                <Skeleton className="rounded-xl h-24 lg:h-full" />
                <Skeleton className="rounded-xl h-24 lg:h-full" />
            </div>
        </section>
    );
}


export const HeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);
  
  useEffect(() => {
    // A simple loading state to prevent hydration errors.
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const mainSlides = [
    PlaceHolderImages.find((img) => img.id === 'hero-main-1'),
    PlaceHolderImages.find((img) => img.id === 'hero-main-2'),
    PlaceHolderImages.find((img) => img.id === 'hero-main-3'),
  ].filter((p): p is NonNullable<typeof p> => p !== undefined);

  const sideBannerTop = PlaceHolderImages.find((img) => img.id === 'hero-side-1');
  const sideBannerBottom = PlaceHolderImages.find((img) => img.id === 'hero-side-2');
  
  if (isLoading) {
    return <HeroCarouselSkeleton />;
  }

  return (
    <section className="container grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Main Slider Container */}
      <div className="lg:col-span-3 h-[200px] lg:h-[400px] rounded-xl overflow-hidden relative group border shadow-sm">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {mainSlides.map((slide) => (
              <div
                className="relative flex-[0_0_100%] h-full"
                key={slide.id}
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.description}
                  fill
                  className="object-cover"
                  data-ai-hint={slide.imageHint}
                  priority={mainSlides.indexOf(slide) === 0}
                  sizes="(max-width: 1024px) 100vw, 75vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="embla__dots">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => scrollTo(index)}
              selected={index === selectedIndex}
            />
          ))}
        </div>
      </div>

      {/* Side Banners Container */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
        {sideBannerTop ? (
          <Link href="/shop" className="relative rounded-xl overflow-hidden h-24 lg:h-full group/side-banner border shadow-sm">
             <Image
                src={sideBannerTop.imageUrl}
                alt={sideBannerTop.description}
                fill
                className="object-cover group-hover/side-banner:scale-105 transition-transform duration-300"
                data-ai-hint={sideBannerTop.imageHint}
                sizes="(max-width: 1023px) 50vw, 25vw"
              />
          </Link>
        ) : (
          <Skeleton className="rounded-xl h-24 lg:h-full" />
        )}
        {sideBannerBottom ? (
          <Link href="/shop" className="relative rounded-xl overflow-hidden h-24 lg:h-full group/side-banner border shadow-sm">
             <Image
                src={sideBannerBottom.imageUrl}
                alt={sideBannerBottom.description}
                fill
                className="object-cover group-hover/side-banner:scale-105 transition-transform duration-300"
                data-ai-hint={sideBannerBottom.imageHint}
                sizes="(max-width: 1023px) 50vw, 25vw"
              />
          </Link>
        ) : (
          <Skeleton className="rounded-xl h-24 lg:h-full" />
        )}
      </div>
    </section>
  );
};
